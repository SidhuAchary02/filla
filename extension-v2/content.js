/**
 * content.js  v4 — Filla Autofill Engine
 *
 * FIXES vs v3:
 *  1. detectSection() now recognises "Experience Details" and "Education Details"
 *     (the exact headings on this form), not just "Work Experience N"
 *  2. "Location" field INSIDE work/edu sections → resolved from job/edu data,
 *     NOT from user's home city (separate key: work_location_val)
 *  3. Nationality select → resolved to "India" (loc.country)
 *  4. Experience (in years) → number input → fills 0
 *  5. Expected Salary → number input → fills raw number 1500000
 *  6. Official Notice Period (in days) → number input → fills 0
 *  7. "Date of Joining" / "Date of Relieving" → MM/YYYY text inputs
 *  8. "Start of Course" / "End of Course" → YYYY text inputs
 *  9. "Course" → maps to degree value
 * 10. "Branch/ Specialization" → maps to field_of_study
 * 11. "University/ College" → maps to school
 * 12. "Github/Portfolio Link" single field → filled with both URLs
 */

(function () {
  "use strict";

  if (window.__fillaV4Loaded) {
    chrome.runtime.onMessage.addListener(handleMessage);
    return;
  }
  window.__fillaV4Loaded = true;

  const FM = window.FillaFieldMapper;

  /* ═══════════════════════════════════════════════════════════════
     FLOATING UI
  ═══════════════════════════════════════════════════════════════ */
  (function injectStyles() {
    const s = document.createElement("style");
    s.textContent = `
      #filla-ui{position:fixed;top:20px;right:20px;width:280px;background:#fff7f3;
        border:1px solid #da5a2a;border-radius:16px;padding:14px;
        z-index:2147483647;font-family:'DM Sans',system-ui,sans-serif;color:#1f1c17;
        box-shadow:0 10px 28px rgba(158,47,9,0.16);transition:all .2s ease;font-size:13px}
      #filla-header{display:flex;align-items:center;gap:10px;margin-bottom:8px}
      #filla-logo{width:28px;height:28px;object-fit:contain;display:block;flex-shrink:0}
      #filla-title{font-size:13px;font-weight:600}
      #filla-status{font-size:11px;color:#9e2f09;margin-top:2px}
      #filla-progress{font-size:11px;color:#9e2f09;min-height:14px;margin-top:4px;font-weight:700}
      #filla-log{margin-top:8px;max-height:90px;overflow-y:auto;font-size:10px;
        color:#9e2f09;line-height:1.7;
        border-top:1px solid #f0cdbf;padding-top:6px}
      .filla-resume-hint{margin-top:8px;padding:9px 11px;
        background:#fff7f3;border:1px solid #da5a2a;
        border-radius:10px;font-size:12px;color:#9e2f09;line-height:1.5;
        font-family:'DM Sans',system-ui,sans-serif}
      .filla-resume-hint strong{color:#9e2f09}
      .filla-resume-hint a{color:#9e2f09;text-decoration:underline}
      .filla-resume-hint small{color:#9e2f09}
    `;
    document.head.appendChild(s);
  })();

  let _logLines = [];
  function getBox() {
    let b = document.getElementById("filla-ui");
    if (!b) { b = document.createElement("div"); b.id = "filla-ui"; document.body.appendChild(b); }
    return b;
  }
  function uiLog(line) {
    _logLines.push(line);
    if (_logLines.length > 14) _logLines.shift();
    const el = document.getElementById("filla-log");
    if (el) el.innerHTML = _logLines.join("<br>");
  }
  function showUI(status, progress = "") {
    const box = getBox();
    box.style.cssText = "";
    box.innerHTML = `
      <div id="filla-header">
        <div><div id="filla-title">Filla Autofill</div>
             <div id="filla-status">${status}</div></div>
      </div>
      <div id="filla-progress">${progress}</div>
      <div id="filla-log"></div>`;
    if (_logLines.length) document.getElementById("filla-log").innerHTML = _logLines.join("<br>");
  }
  /* ═══════════════════════════════════════════════════════════════
     UTILITIES
  ═══════════════════════════════════════════════════════════════ */
  const delay  = ms => new Promise(r => setTimeout(r, ms));
  const scroll = el => el.scrollIntoView({ behavior: "smooth", block: "center" });

  function sendMessageAsync(message) {
    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage(message, (resp) => {
          if (chrome.runtime.lastError) {
            resolve({ success: false, error: chrome.runtime.lastError.message });
            return;
          }
          resolve(resp || { success: false, error: "No response from background" });
        });
      } catch (err) {
        resolve({ success: false, error: err?.message || "Message send failed" });
      }
    });
  }

  function parseFilename(contentDisposition, fallbackUrl, contentType) {
    const cd = String(contentDisposition || "");
    const m = cd.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i);
    let name = decodeURIComponent((m?.[1] || m?.[2] || "").trim());

    if (!name) {
      try {
        const u = new URL(String(fallbackUrl || ""));
        name = (u.pathname.split("/").pop() || "").trim();
      } catch (_) {
        name = "";
      }
    }

    if (!name || !name.includes(".")) {
      const t = String(contentType || "").toLowerCase();
      const ext = t.includes("pdf") ? "pdf"
        : t.includes("msword") ? "doc"
        : t.includes("wordprocessingml") ? "docx"
        : t.includes("rtf") ? "rtf"
        : t.includes("opendocument") ? "odt"
        : "pdf";
      name = `resume.${ext}`;
    }
    return name;
  }

  function base64ToFile(base64, contentType, fileName) {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    return new File([bytes], fileName, { type: contentType || "application/octet-stream" });
  }

  function highlight(el) {
    const was = el.style.outline;
    el.style.outline = "2.5px solid #6366f1";
    el.style.borderRadius = "3px";
    setTimeout(() => { el.style.outline = was; }, 700);
  }

  // React / Vue / Angular compatible event dispatch
  function fire(el) {
    try {
      const proto  = Object.getPrototypeOf(el);
      const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
      if (setter) setter.call(el, el.value);
    } catch (_) {}
    el.dispatchEvent(new Event("input",  { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.dispatchEvent(new Event("blur",   { bubbles: true }));
  }

  /* ═══════════════════════════════════════════════════════════════
     SECTION DETECTOR
     Walks up the DOM from the element, reads block heading text,
     and returns { section: "work"|"education"|"", index: 0|1|... }

     Handles BOTH naming conventions seen in the wild:
       • "Work Experience 1 / 2 …"   (Greenhouse, Lever)
       • "Experience Details"         (this form — no number)
       • "Education Details"          (this form)
       • "Education 1 / 2 …"
  ═══════════════════════════════════════════════════════════════ */
  function detectSection(el) {
    let node  = el.parentElement;
    let depth = 0;

    while (node && depth < 15) {
      // Only look at heading-like elements or reasonably small containers
      const headings = node.querySelectorAll
        ? Array.from(node.querySelectorAll("h1,h2,h3,h4,h5,legend,label,p,span,div"))
            .filter(h => {
              const t = (h.innerText || h.textContent || "").trim();
              return t.length > 0 && t.length < 80 && !h.querySelector("input,select,textarea");
            })
        : [];

      for (const h of headings) {
        const t = FM.normalize(h.innerText || h.textContent || "");

        // Work section — numbered: "work experience 2"
        const wn = t.match(/work experience\s*(\d+)/);
        if (wn) return { section: "work", index: parseInt(wn[1]) - 1 };

        // Education — numbered
        const en = t.match(/education\s*(\d+)/);
        if (en) return { section: "education", index: parseInt(en[1]) - 1 };

        // Work section — unnumbered: "experience details" / "work experience"
        if (t === "experience details" || t === "work experience" || t === "employment details") {
          return { section: "work", index: 0 };
        }

        // Education — unnumbered: "education details"
        if (t === "education details" || t === "education" || t === "academic details") {
          return { section: "education", index: 0 };
        }
      }

      node = node.parentElement;
      depth++;
    }

    return { section: "", index: 0 };
  }

  /* ═══════════════════════════════════════════════════════════════
     DEGREE NORMALISER
     Maps profile degree strings → synonyms for select matching
  ═══════════════════════════════════════════════════════════════ */
  const DEGREE_ALIASES = {
    "b.tech":  ["bachelor", "b.tech", "btech", "b.e", "be ", "engineering", "b.sc", "bsc", "b tech"],
    "m.tech":  ["master", "m.tech", "mtech", "m.e", "me "],
    "mba":     ["mba", "master of business"],
    "phd":     ["phd", "doctorate", "ph.d"],
    "diploma": ["diploma"],
    "10th":    ["10th", "ssc", "secondary"],
    "12th":    ["12th", "hsc", "higher secondary", "intermediate"],
  };
  function degreeSynonyms(degree) {
    const d = FM.normalize(degree);
    for (const [key, syns] of Object.entries(DEGREE_ALIASES)) {
      if (d.includes(key) || syns.some(s => d.includes(s))) return syns;
    }
    return [d];
  }

  /* ═══════════════════════════════════════════════════════════════
     FILL: TEXT / EMAIL / NUMBER / TEL / URL
  ═══════════════════════════════════════════════════════════════ */
  function fillText(el, value) {
    const type = (el.getAttribute("type") || "text").toLowerCase();
    el.focus();
    if (type === "number") {
      const num = Number(String(value).replace(/[^0-9.]/g, ""));
      if (isNaN(num)) return;
      el.value = num;
    } else {
      el.value = String(value);
    }
    fire(el);
    uiLog(`✅ "${el.name || el.id || el.placeholder || "??"}" = "${el.value}"`);
  }

  /* ═══════════════════════════════════════════════════════════════
     FILL: DATE TEXT INPUT
     Detects format from placeholder and fills accordingly.
  ═══════════════════════════════════════════════════════════════ */
  function fillDate(el, isoDateStr, forceFormat) {
    if (!isoDateStr) return;
    const type = (el.getAttribute("type") || "text").toLowerCase();
    const ph   = FM.normalize(el.placeholder || "");

    if (type === "date")  { el.value = isoDateStr.slice(0, 10); fire(el); return; }
    if (type === "month") { el.value = isoDateStr.slice(0, 7);  fire(el); return; }

    // Text input — detect format
    let formatted;
    if (forceFormat === "YYYY" || (ph.includes("yyyy") && !ph.includes("mm"))) {
      formatted = FM.toYYYY(isoDateStr);
    } else if (forceFormat === "DD/MM/YYYY" || ph.includes("dd/mm/yyyy")) {
      formatted = FM.toDDMMYYYY(isoDateStr);
    } else if (forceFormat === "MM/YYYY" || ph.includes("mm/yyyy") || ph.includes("mm yyyy")) {
      formatted = FM.toMMYYYY(isoDateStr);
    } else if (ph.includes("yyyy")) {
      formatted = FM.toYYYY(isoDateStr);
    } else {
      formatted = FM.toMMYYYY(isoDateStr); // default
    }

    fillText(el, formatted);
  }

  /* ═══════════════════════════════════════════════════════════════
     FILL: TEXTAREA
  ═══════════════════════════════════════════════════════════════ */
  function fillTextarea(el, value) {
    el.focus();
    el.value = String(value);
    fire(el);
    uiLog(`✅ textarea "${el.name || el.id}"`);
  }

  /* ═══════════════════════════════════════════════════════════════
     FILL: NATIVE <select>
  ═══════════════════════════════════════════════════════════════ */
  function fillSelect(el, value, key) {
    let rawValue = String(value);
    if (key === "nationality" || key === "country") {
      const n = FM.normalize(rawValue);
      if (n === "indian") rawValue = "India";
    }

    const target   = FM.normalize(rawValue);
    const synonyms = key === "degree" ? degreeSynonyms(value) : [target];

    const isCountryLike = key === "nationality" || key === "country";

    // Country / nationality must prefer exact match to avoid false positive like:
    // "British Indian Ocean Territory" for value "Indian".
    if (isCountryLike) {
      for (const opt of el.options) {
        const t = FM.normalize(opt.text);
        const v = FM.normalize(opt.value);
        if (t === target || v === target) {
          el.selectedIndex = opt.index;
          fire(el);
          uiLog(`✅ select "${el.name || el.id}" = "${opt.text}"`);
          return true;
        }
      }
    }

    for (const opt of el.options) {
      const t = FM.normalize(opt.text);
      const v = FM.normalize(opt.value);

      const direct = t === target || v === target ||
                     (target.length > 2 && (t.includes(target) || target.includes(t)));
      const syn    = synonyms.some(s => s.length > 1 && (t.includes(s) || v.includes(s)));

      if (direct || syn) {
        el.selectedIndex = opt.index;
        fire(el);
        uiLog(`✅ select "${el.name || el.id}" = "${opt.text}"`);
        return true;
      }
    }
    uiLog(`⚠️ select no match: "${el.name || el.id}" for "${value}"`);
    return false;
  }

  /* ═══════════════════════════════════════════════════════════════
     FILL: CUSTOM ARIA DROPDOWN
  ═══════════════════════════════════════════════════════════════ */
  async function fillAriaDropdown(trigger, value, key) {
    let rawValue = String(value);
    if (key === "nationality" || key === "country") {
      const n = FM.normalize(rawValue);
      if (n === "indian") rawValue = "India";
    }

    const target   = FM.normalize(rawValue);
    const synonyms = key === "degree" ? degreeSynonyms(value) : [target];
    const isCountryLike = key === "nationality" || key === "country";

    trigger.click();
    await delay(400);

    const options = document.querySelectorAll('[role="option"],[role="menuitem"],[role="listitem"]');

    if (isCountryLike) {
      for (const opt of options) {
        const t = FM.normalize(opt.innerText || opt.textContent || "");
        if (t === target) {
          opt.click();
          uiLog(`✅ aria-select "${key}" = "${opt.innerText.trim()}"`);
          await delay(200);
          return true;
        }
      }
    }
    for (const opt of options) {
      const t = FM.normalize(opt.innerText || opt.textContent || "");
      if (t.includes(target) || synonyms.some(s => s.length > 1 && t.includes(s))) {
        opt.click();
        uiLog(`✅ aria-select "${key}" = "${opt.innerText.trim()}"`);
        await delay(200);
        return true;
      }
    }
    document.body.click(); // close
    uiLog(`⚠️ aria-select no match "${key}" for "${value}"`);
    await delay(200);
    return false;
  }

  /* ═══════════════════════════════════════════════════════════════
     FILL: RADIO GROUP
  ═══════════════════════════════════════════════════════════════ */
  function fillRadio(radios, value) {
    const target = FM.normalize(String(value));
    for (const r of radios) {
      const lf = r.id ? (document.querySelector(`label[for="${r.id}"]`)?.innerText || "") : "";
      const lw = r.closest("label")?.innerText || "";
      const pp = r.parentElement?.innerText || "";
      const rv = r.value || "";
      const combined = FM.normalize([lf, lw, pp, rv].join(" "));

      if (combined.includes(target) || (FM.normalize(rv).length > 1 && target.includes(FM.normalize(rv)))) {
        r.click();
        uiLog(`✅ radio "${r.name}" = "${value}"`);
        return true;
      }
    }
    uiLog(`⚠️ radio no match "${radios[0]?.name}" for "${value}"`);
    return false;
  }

  /* ═══════════════════════════════════════════════════════════════
     FILL: CHECKBOX
  ═══════════════════════════════════════════════════════════════ */
  function fillCheckbox(el, value) {
    const targets = String(value).split(",").map(v => FM.normalize(v.trim()));
    const elVal   = FM.normalize(el.value || "");
    const lf      = el.id ? FM.normalize(document.querySelector(`label[for="${el.id}"]`)?.innerText || "") : "";
    const lw      = FM.normalize(el.closest("label")?.innerText || "");
    const pp      = FM.normalize(el.parentElement?.innerText || "");

    const match = targets.some(t =>
      (elVal && (elVal.includes(t) || t.includes(elVal))) ||
      (lf    && (lf.includes(t)   || t.includes(lf)))    ||
      (lw    && (lw.includes(t)   || t.includes(lw)))    ||
      (pp    && (pp.includes(t)   || t.includes(pp)))
    );

    if (match && !el.checked) {
      el.checked = true;
      fire(el);
      uiLog(`✅ checkbox "${el.name || el.id}" checked`);
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     VALUE NORMALISER — post-resolve per element context
  ═══════════════════════════════════════════════════════════════ */
  function normalizeValue(key, rawValue, el) {
    if (rawValue === null || rawValue === undefined) return rawValue;
    const type = (el.getAttribute("type") || "").toLowerCase();
    const ph   = FM.normalize(el.placeholder || "");

    // Salary fields — number input gets raw number, text gets LPA string
    if (key === "min_salary" || key === "current_ctc") {
      const num = Number(rawValue);
      if (isNaN(num)) return String(rawValue);
      if (type === "number") return num;                      // raw: 1500000
      if (ph.includes("lpa") || ph.includes("lakhs")) return (num / 100000).toFixed(0) + " LPA";
      return num;                                            // default: raw number
    }

    // Notice period — number input gets 0 for "immediate"
    if (key === "notice_period" || key === "negotiable_np") {
      if (type === "number") return Number(rawValue) || 0;
      return String(rawValue) === "0" ? "0" : String(rawValue);
    }

    if (key === "experience" || key === "internship_exp") {
      return type === "number" ? Number(rawValue) : String(rawValue);
    }

    return rawValue;
  }

  /* ═══════════════════════════════════════════════════════════════
     IS DATE KEY?  Keys that should route to fillDate()
  ═══════════════════════════════════════════════════════════════ */
  const DATE_KEYS = new Set([
    "work_start", "work_end", "edu_start", "edu_end", "birthday", "lwd"
  ]);

  // Force format per key
  function dateFormat(key) {
    if (key === "edu_start" || key === "edu_end") return "YYYY";
    if (key === "work_start" || key === "work_end") return "MM/YYYY";
    if (key === "birthday") return "DD/MM/YYYY";
    if (key === "lwd") return "DD/MM/YYYY";
    return null;
  }

  /* ═══════════════════════════════════════════════════════════════
     PROCESS ONE FIELD
  ═══════════════════════════════════════════════════════════════ */
  function processField(el, userData) {
    const tag  = el.tagName.toLowerCase();
    const type = (el.getAttribute("type") || "text").toLowerCase();

    if (["submit", "button", "image", "hidden", "reset", "file"].includes(type)) return;

    // Skip non-empty (except selects which often default to "Select One")
    if (tag !== "select" && el.value && el.value.trim() !== "") return;

    const fp  = FM.extractFingerprint(el);
    const key = FM.matchKey(fp);

    if (!key) {
      console.log(`[Filla] ❓ "${fp.slice(0, 60)}"`);
      return;
    }

    // Detect section (work / education) and index
    const ctx = detectSection(el);

    // Special case: "Location" INSIDE a work/edu section → use section-specific value
    let resolvedKey = key;
    if (key === "name_fallback" && ctx.section === "work"  && fp.includes("location")) resolvedKey = "work_location_val";
    if (key === "name_fallback" && ctx.section === "education" && fp.includes("location")) resolvedKey = "edu_location";

    let rawVal = FM.resolveValue(resolvedKey, userData, ctx);
    let value  = normalizeValue(resolvedKey, rawVal, el);

    if (value === null || value === undefined || value === "") {
      console.log(`[Filla] ⚠️ no value key="${resolvedKey}" ctx=`, ctx);
      return;
    }

    console.log(`[Filla] 🔍 key="${resolvedKey}" ctx=`, ctx, `val="${value}"`);
    highlight(el);
    scroll(el);

    // Route to correct filler
    if (tag === "textarea")     return fillTextarea(el, value);
    if (tag === "select")       return fillSelect(el, value, resolvedKey);
    if (type === "checkbox")    return fillCheckbox(el, value);
    if (type === "date" || type === "month") return fillDate(el, String(rawVal));

    // Date text inputs: check by key or placeholder
    if (DATE_KEYS.has(resolvedKey)) return fillDate(el, String(rawVal), dateFormat(resolvedKey));

    const ph = FM.normalize(el.placeholder || "");
    if (ph.includes("mm/yyyy") || ph.includes("dd/mm/yyyy") || ph.includes("yyyy")) {
      return fillDate(el, String(rawVal), dateFormat(resolvedKey) || null);
    }

    fillText(el, value);
  }

  /* ═══════════════════════════════════════════════════════════════
     RADIO GROUPS
  ═══════════════════════════════════════════════════════════════ */
  function processRadioGroups(userData) {
    const groups = {};
    document.querySelectorAll('input[type="radio"]').forEach(r => {
      const n = r.name || `_id_${r.id}` || "_anon";
      (groups[n] = groups[n] || []).push(r);
    });

    for (const [, radios] of Object.entries(groups)) {
      const legendText = radios[0].closest("fieldset")?.querySelector("legend")?.innerText || "";
      const fp  = FM.extractFingerprint(radios[0]) + " " + FM.normalize(legendText);
      const key = FM.matchKey(fp.trim());
      if (!key) continue;

      const ctx  = detectSection(radios[0]);
      const raw  = FM.resolveValue(key, userData, ctx);
      const val  = normalizeValue(key, raw, radios[0]);
      if (!val && val !== 0) continue;

      fillRadio(radios, val);
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     CURRENTLY WORKING HERE CHECKBOX
  ═══════════════════════════════════════════════════════════════ */
  function fillCurrentlyWorkingCheckboxes(userData) {
    const jobs = userData.profile?.work_experience || [];

    document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      const fp = FM.normalize([
        cb.name, cb.id,
        document.querySelector(`label[for="${cb.id}"]`)?.innerText || "",
        cb.closest("label")?.innerText || "",
        cb.parentElement?.innerText || "",
      ].join(" "));

      if (!fp.includes("currently") && !fp.includes("current")) return;

      const ctx = detectSection(cb);
      const job = jobs[ctx.index] ?? jobs[0] ?? {};

      if (job.is_current && !cb.checked) {
        cb.click();
        uiLog(`✅ "Currently working here" checked (job ${ctx.index})`);
      }
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     ARIA / CUSTOM DROPDOWNS  (React comboboxes etc.)
  ═══════════════════════════════════════════════════════════════ */
  async function processAriaDropdowns(userData) {
    const combos = document.querySelectorAll(
      '[role="combobox"],[aria-haspopup="listbox"],[aria-haspopup="true"]'
    );

    for (const dd of combos) {
      const fp  = FM.extractFingerprint(dd);
      const key = FM.matchKey(fp);
      if (!key) continue;

      const ctx = detectSection(dd);
      const raw = FM.resolveValue(key, userData, ctx);
      if (!raw) continue;

      await fillAriaDropdown(dd, raw, key);
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     WEBSITES / SOCIAL LINKS
  ═══════════════════════════════════════════════════════════════ */
  async function fillSocialAndWebsiteLinks(userData) {
    const p = userData.profile || {};

    const allInputs = document.querySelectorAll(
      'input[type="text"],input[type="url"],input[type="search"]'
    );

    for (const inp of allInputs) {
      if (inp.value) continue;
      const fp = FM.extractFingerprint(inp);

      if (fp.includes("github/portfolio") || fp.includes("github portfolio")) {
        fillText(inp, p.links?.github || p.links?.portfolio || "");
      } else if (fp.includes("linkedin")) {
        fillText(inp, p.links?.linkedin || "");
      } else if (fp.includes("github")) {
        fillText(inp, p.links?.github || "");
      } else if (fp.includes("portfolio") || fp.includes("personal website")) {
        fillText(inp, p.links?.portfolio || "");
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     WEBSITES "ADD" BUTTON
  ═══════════════════════════════════════════════════════════════ */
  async function fillWebsiteAddSection(userData) {
    const p = userData.profile || {};
    const links = [p.links?.portfolio, p.links?.github].filter(Boolean);
    if (!links.length) return;

    const addBtns = Array.from(document.querySelectorAll("button,a")).filter(btn => {
      const txt     = FM.normalize(btn.innerText || "");
      const section = FM.normalize(btn.closest("section,div,fieldset")?.innerText?.slice(0, 100) || "");
      return txt === "add" && section.includes("website");
    });

    for (let i = 0; i < Math.min(links.length, 3); i++) {
      if (addBtns[0]) { addBtns[0].click(); await delay(400); }

      const urlInputs = Array.from(document.querySelectorAll('input[type="url"],input[type="text"]'))
        .filter(inp => {
          const fp = FM.normalize(inp.placeholder + inp.name + inp.id);
          return (fp.includes("url") || fp.includes("http") || fp.includes("website")) && !inp.value;
        });

      if (urlInputs.length) {
        fillText(urlInputs[urlInputs.length - 1], links[i]);
        await delay(200);
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     RESUME NOTICE
  ═══════════════════════════════════════════════════════════════ */
  async function handleResumeFields(userData) {
    const resumeUrl = userData.profile?.resume_url;
    const fileInputs = Array.from(document.querySelectorAll('input[type="file"]'));

    if (!fileInputs.length) return;

    let fetchResult = null;
    let resumeFile = null;

    if (resumeUrl) {
      uiLog("📎 Resume: fetching file…");
      fetchResult = await sendMessageAsync({
        type: "FILLA_FETCH_RESUME",
        resumeUrl,
      });

      if (fetchResult?.success && fetchResult?.base64) {
        const fileName = parseFilename(fetchResult.contentDisposition, resumeUrl, fetchResult.contentType);
        resumeFile = base64ToFile(fetchResult.base64, fetchResult.contentType, fileName);
      }
    }

    // Keka asks a native confirm dialog after resume upload.
    // Auto-accept only that specific prompt during attach, then restore.
    const originalConfirm = window.confirm;
    const autoAcceptPatterns = [
      "overwrite the existing data",
      "data extracted from the uploaded resume",
    ];

    window.confirm = function patchedConfirm(message) {
      const text = String(message || "").toLowerCase();
      if (autoAcceptPatterns.some(p => text.includes(p))) {
        uiLog("✅ Auto-confirmed resume overwrite prompt");
        return true;
      }
      return originalConfirm.call(window, message);
    };

    fileInputs.forEach(f => {
      highlight(f);

      if (resumeFile) {
        try {
          const dt = new DataTransfer();
          dt.items.add(resumeFile);
          f.files = dt.files;
          fire(f);
          uiLog(`✅ Resume attached: ${resumeFile.name}`);
        } catch (err) {
          uiLog(`⚠️ Resume attach failed: ${err?.message || "unknown error"}`);
        }
      }

      const zone = f.closest("div") || f.parentElement;
      if (zone) {
        let hint = zone.querySelector(".filla-resume-hint");
        if (!hint) {
          hint = document.createElement("div");
          hint.className = "filla-resume-hint";
          zone.appendChild(hint);
        }

        if (resumeFile) {
          hint.innerHTML = `✅ <strong>Filla:</strong> Resume attached automatically (${resumeFile.name}).`;
        } else {
          const reason = fetchResult?.error ? `<br><small>${fetchResult.error}</small>` : "";
          hint.innerHTML = `📎 <strong>Filla:</strong> Upload resume manually.${
            resumeUrl
              ? `<br><a href="${resumeUrl}" target="_blank">Open your saved resume ↗</a>${reason}`
              : ""
          }`;
        }
      }
    });

    window.confirm = originalConfirm;

    if (!resumeFile) {
      uiLog("📎 Resume: auto-attach unavailable, manual upload needed");
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     MAIN PIPELINE
  ═══════════════════════════════════════════════════════════════ */
  async function startAutofillPipeline(userData) {
    _logLines = [];
    console.log("[Filla v4] 🚀 Pipeline start");
    showUI("Scanning form…");
    await delay(200);

    // 1. All standard fields
    const fields = Array.from(document.querySelectorAll(
      'input:not([type="radio"]):not([type="hidden"]):not([type="file"]), textarea, select'
    ));

    showUI("Filling fields…", `0 / ${fields.length}`);
    for (let i = 0; i < fields.length; i++) {
      showUI("Filling fields…", `${i + 1} / ${fields.length}`);
      await delay(60);
      processField(fields[i], userData);
    }

    // 2. Radio groups
    showUI("Filling radio buttons…");
    await delay(100);
    processRadioGroups(userData);

    // 3. Currently-working checkboxes
    fillCurrentlyWorkingCheckboxes(userData);

    // 4. ARIA custom dropdowns
    showUI("Filling custom dropdowns…");
    await processAriaDropdowns(userData);

    // 5. Social / website links (direct inputs)
    await fillSocialAndWebsiteLinks(userData);

    // 6. Websites "Add" section
    await fillWebsiteAddSection(userData);

    // 7. Resume
    await handleResumeFields(userData);

    showUI("✅ Done!", `${fields.length} fields processed`);
    uiLog("Pipeline complete");

    console.log("[Filla v4] ✅ Pipeline complete");
  }

  /* ═══════════════════════════════════════════════════════════════
     MESSAGE HANDLER
  ═══════════════════════════════════════════════════════════════ */
  function handleMessage(message, _sender, sendResponse) {
    if (message.type !== "FILLA_AUTOFILL") return;
    const { userData } = message;
    if (!userData) {
      sendResponse({ success: false, error: "No userData" });
      return true;
    }
    startAutofillPipeline(userData)
      .then(() => sendResponse({ success: true }))
      .catch(err => {
        console.error("[Filla v4] ❌", err);
        sendResponse({ success: false, error: err.message });
      });
    return true;
  }

  chrome.runtime.onMessage.addListener(handleMessage);
  console.log("[Filla v4] 🟢 Content script loaded");
})();
