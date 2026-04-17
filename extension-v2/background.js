/**
 * background.js
 * Filla Autofill — Background Service Worker (Manifest V3)
 */

"use strict";

// ─── Message Router ────────────────────────────────────────────────────────
// Relays messages from popup → active tab content script
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {

  if (message.type === "FILLA_AUTOFILL") {
    // Forward to the active tab's content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];

      if (!tab || !tab.id) {
        console.error("[Filla BG] ❌ No active tab found.");
        sendResponse({ success: false, error: "No active tab found." });
        return;
      }

      // Inject content scripts dynamically if not already present
      chrome.scripting.executeScript(
        {
          target: { tabId: tab.id },
          files: ["fieldMapper.js", "content.js"],
        },
        () => {
          // After ensuring scripts are loaded, send the autofill message
          const lastError = chrome.runtime.lastError;
          if (lastError) {
            // Scripts may already be injected — that's fine, proceed
            console.warn("[Filla BG] Script inject note:", lastError.message);
          }

          chrome.tabs.sendMessage(tab.id, message, (response) => {
            if (chrome.runtime.lastError) {
              console.error("[Filla BG] ❌ Message error:", chrome.runtime.lastError.message);
              sendResponse({ success: false, error: chrome.runtime.lastError.message });
            } else {
              sendResponse(response);
            }
          });
        }
      );
    });

    // Keep message channel open for async response
    return true;
  }
});

// ─── Install / Update Lifecycle ────────────────────────────────────────────
chrome.runtime.onInstalled.addListener((details) => {
  console.log("[Filla BG] 🟢 Extension installed/updated:", details.reason);
});