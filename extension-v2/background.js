/**
 * background.js  v6
 * Filla Autofill — Background Service Worker (Manifest V3)
 *
 * Resume upload strategy:
 *  Supabase signed URLs are standard HTTPS URLs that return the file
 *  binary directly — no redirects, no HTML wrapper, no auth header needed.
 *  The service worker fetches the bytes and sends them as base64 to the
 *  content script, which reconstructs a File object and sets it on the
 *  file input via DataTransfer.
 *
 *  Fallback chain:
 *    1. Direct fetch of resume_url (works for Supabase, S3, Cloudinary, etc.)
 *    2. Authenticated direct fetch (Bearer token)
 *    3. Backend proxy at FILLA_API_BASE (for private/authenticated storage)
 */

"use strict";

const FILLA_API_BASE = "http://localhost:8000";

/* ═══════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════ */
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000; // 32 KB — avoids call-stack overflow on large files
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function getStoredToken() {
  return new Promise(resolve => {
    chrome.storage.local.get(["fillaToken", "access_token", "auth_token", "token", "jwt"], r => {
      resolve(r?.fillaToken || r?.access_token || r?.auth_token || r?.token || r?.jwt || "");
    });
  });
}

function asBearer(token) {
  const t = String(token || "").trim();
  if (!t) return "";
  return /^bearer\s+/i.test(t) ? t : `Bearer ${t}`;
}

function extractGoogleDriveFileId(url) {
  const u = String(url || "");
  const byPath = u.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (byPath?.[1]) return byPath[1];
  const byParam = u.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (byParam?.[1]) return byParam[1];
  return "";
}

function toDirectDownloadCandidates(url) {
  const original = String(url || "").trim();
  if (!original) return [];

  const out = [original];
  if (/drive\.google\.com/i.test(original)) {
    const id = extractGoogleDriveFileId(original);
    if (id) {
      out.unshift(`https://drive.google.com/uc?export=download&id=${id}`);
      out.push(`https://drive.google.com/uc?id=${id}&export=download`);
    }
  }
  return Array.from(new Set(out));
}

/* ═══════════════════════════════════════════════════════════════
   FETCH BINARY
   Returns { ok, base64, contentType, contentDisposition }
        or { ok: false, error }
═══════════════════════════════════════════════════════════════ */
async function fetchBinary(url, headers = {}) {
  let resp;
  try {
    resp = await fetch(url, {
      method: "GET",
      headers,
      redirect: "follow",
      credentials: "omit",  // avoids CORS issues with cross-origin storage
    });
  } catch (err) {
    return { ok: false, error: `Network error: ${err.message}` };
  }

  if (!resp.ok) {
    return { ok: false, error: `HTTP ${resp.status} ${resp.statusText}` };
  }

  const contentType = resp.headers.get("content-type") || "";
  const disposition = resp.headers.get("content-disposition") || "";

  // If server returned HTML, it's an error/login page — not a file
  if (contentType.includes("text/html")) {
    return { ok: false, error: "Server returned HTML instead of a file" };
  }

  const buffer = await resp.arrayBuffer();
  if (buffer.byteLength === 0) {
    return { ok: false, error: "Server returned an empty response" };
  }

  return {
    ok: true,
    base64: arrayBufferToBase64(buffer),
    contentType,
    contentDisposition: disposition,
  };
}

/* ═══════════════════════════════════════════════════════════════
   RESUME FETCH HANDLER
   Three-stage strategy: direct → authenticated → proxy
═══════════════════════════════════════════════════════════════ */
async function handleFetchResume(resumeUrl) {
  if (!resumeUrl || !resumeUrl.startsWith("http")) {
    return { success: false, error: "Invalid or missing resume URL" };
  }

  const candidates = toDirectDownloadCandidates(resumeUrl);
  console.log("[Filla BG] 📎 Fetching resume:", candidates[0]?.slice(0, 100) + "…");

  // Stage 1: Direct fetch — no auth header
  // Works for: Supabase signed URLs, public S3, Cloudinary public URLs
  for (const candidate of candidates) {
    const direct = await fetchBinary(candidate, {});
    if (direct.ok) {
      console.log(
        `[Filla BG] ✅ Direct fetch OK — ${Math.round(direct.base64.length * 0.75 / 1024)} KB`
      );
      return { success: true, ...direct };
    }
    console.warn("[Filla BG] ⚠️ Stage 1 failed:", direct.error, "url:", candidate);
  }

  // Stage 2: Fetch with Bearer token
  // Works for: private Supabase buckets, auth-required endpoints
  const token = await getStoredToken();
  if (token) {
    const authHeader = asBearer(token);
    for (const candidate of candidates) {
      const authed = await fetchBinary(candidate, { Authorization: authHeader });
      if (authed.ok) {
        console.log("[Filla BG] ✅ Authenticated fetch OK");
        return { success: true, ...authed };
      }
      console.warn("[Filla BG] ⚠️ Stage 2 failed:", authed.error, "url:", candidate);
    }
  }

  // Stage 3: Backend proxy
  if (!token) {
    return { success: false, error: "Could not fetch resume. Please log in and try again." };
  }

  const proxyUrl =
    `${FILLA_API_BASE}/api/extension/resume-file` +
    `?resume_ref=${encodeURIComponent(resumeUrl)}`;

  console.log("[Filla BG] 🔄 Trying backend proxy…");
  const proxied = await fetchBinary(proxyUrl, { Authorization: asBearer(token) });

  if (!proxied.ok) {
    return { success: false, error: `All stages failed. Last: ${proxied.error}` };
  }

  console.log("[Filla BG] ✅ Proxy fetch OK");
  return { success: true, ...proxied };
}

/* ═══════════════════════════════════════════════════════════════
   MESSAGE ROUTER
═══════════════════════════════════════════════════════════════ */
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {

  if (message.type === "FILLA_FETCH_RESUME") {
    handleFetchResume(message.resumeUrl)
      .then(result => sendResponse(result))
      .catch(err => {
        console.error("[Filla BG] ❌ Resume fetch exception:", err);
        sendResponse({ success: false, error: err?.message || "Unknown error" });
      });
    return true;
  }

  if (message.type === "FILLA_AUTOFILL") {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      const tab = tabs[0];
      if (!tab?.id) {
        sendResponse({ success: false, error: "No active tab found" });
        return;
      }

      chrome.scripting.executeScript(
        { target: { tabId: tab.id }, files: ["fieldMapper.js", "content.js"] },
        () => {
          if (chrome.runtime.lastError) {
            console.warn("[Filla BG] Inject note:", chrome.runtime.lastError.message);
          }
          chrome.tabs.sendMessage(tab.id, message, resp => {
            if (chrome.runtime.lastError) {
              sendResponse({ success: false, error: chrome.runtime.lastError.message });
            } else {
              sendResponse(resp);
            }
          });
        }
      );
    });
    return true;
  }
});

chrome.runtime.onInstalled.addListener(details => {
  console.log("[Filla BG] 🟢 Extension installed/updated:", details.reason);
});
