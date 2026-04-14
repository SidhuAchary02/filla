(() => {
  "use strict";

  // Initialize FieldMatcher for intelligent form autofill
  let fieldMatcher = null;
  
  // Safe initialization with error handling
  try {
    if (typeof FieldMatcher !== 'undefined') {
      fieldMatcher = new FieldMatcher();
      console.log('[Filla] FieldMatcher initialized successfully');
    } else {
      console.warn('[Filla] FieldMatcher class not available, waiting...');
      // Retry initialization after a delay
      setTimeout(() => {
        if (typeof FieldMatcher !== 'undefined' && !fieldMatcher) {
          fieldMatcher = new FieldMatcher();
          console.log('[Filla] FieldMatcher initialized on retry');
        }
      }, 1000);
    }
  } catch (err) {
    console.error('[Filla] Error initializing FieldMatcher:', err);
  }

  const VALID_INPUT_TYPES = new Set(["text", "email", "number", "tel", "url", "date", "time"]);
  const IGNORED_INPUT_TYPES = new Set([
    "hidden",
    "submit",
    "button",
    "reset",
    "radio",
    "checkbox",
    "image",
    "range",
    "color"
  ]);
  const AUTOFILL_INPUT_TYPES = new Set(["file", "text", "email", "number", "tel", "url", "date", "time", "select", "textarea"]);

  const NOISE_WORDS = new Set([
    "select",
    "none",
    "drop",
    "dropdown",
    "choose",
    "option",
    "open",
    "close",
    "menu",
    "search",
    "filter",
    "clear"
  ]);

  const processedFields = new WeakSet();
  const questionCache = new WeakMap();
  const loggedFingerprints = new Set();
  const FIELD_SELECTOR = "input, textarea, select";

  const UTILITY_LABELS = new Set([
    "color",
    "transparency",
    "font size",
    "text edge style",
    "font family",
    "language",
    "playback speed"
  ]);

  function normalizeText(text) {
    return (text || "").replace(/\s+/g, " ").trim();
  }

  function isMeaningfulField(field) {
    if (!(field instanceof HTMLElement)) return false;
    if (field.disabled) return false;

    if (field.tagName === "TEXTAREA" || field.tagName === "SELECT") {
      return true;
    }

    if (field.tagName !== "INPUT") return false;

    const type = (field.getAttribute("type") || "text").toLowerCase();
    if (IGNORED_INPUT_TYPES.has(type)) return false;

    return VALID_INPUT_TYPES.has(type) || type === "file";
  }

  function isAutofillCapable(field) {
    if (!isMeaningfulField(field)) return false;
    if (field.tagName === "TEXTAREA" || field.tagName === "SELECT") return true;
    if (field.tagName === "INPUT") {
      const type = (field.getAttribute("type") || "text").toLowerCase();
      return AUTOFILL_INPUT_TYPES.has(type);
    }
    return false;
  }

  function isVisibleField(field) {
    if (!(field instanceof HTMLElement)) return false;
    if (field.hidden || field.getAttribute("aria-hidden") === "true") return false;

    const style = window.getComputedStyle(field);
    if (style.display === "none" || style.visibility === "hidden") return false;

    return field.getClientRects().length > 0;
  }

  function isValidNearbyCandidate(text) {
    const cleaned = normalizeText(text);
    if (!cleaned) return false;
    if (cleaned.length > 100) return false;
    if (cleaned.length < 2) return false;

    const lower = cleaned.toLowerCase();
    if (NOISE_WORDS.has(lower)) return false;

    const wordCount = lower.split(" ").filter(Boolean).length;
    if (wordCount > 12) return false;

    // Reject sentence-like or paragraph-like text.
    if (/[.!?]/.test(cleaned) && wordCount > 6) return false;
    if (/\n/.test(cleaned)) return false;

    return true;
  }

  function getLabelViaInputLabels(field) {
    if (!field.labels || !field.labels.length) return "";
    for (const label of field.labels) {
      const text = normalizeText(label.textContent);
      if (text) return text;
    }
    return "";
  }

  function getLabelViaForAttribute(field) {
    if (!field.id) return "";
    const label = document.querySelector(`label[for="${CSS.escape(field.id)}"]`);
    if (!label) return "";
    return normalizeText(label.textContent);
  }

  function getNearbyText(field) {
    let current = field;

    for (let level = 0; level < 3; level += 1) {
      const parent = current.parentElement;
      if (!parent) break;

      const candidates = [];

      const prev = current.previousElementSibling;
      if (prev) candidates.push(prev.textContent || "");

      const next = current.nextElementSibling;
      if (next) candidates.push(next.textContent || "");

      for (const node of parent.childNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
          candidates.push(node.textContent || "");
        }
      }

      const directLabel = parent.querySelector(":scope > label");
      if (directLabel) candidates.push(directLabel.textContent || "");

      for (const candidate of candidates) {
        const text = normalizeText(candidate);
        if (isValidNearbyCandidate(text)) return text;
      }

      current = parent;
    }

    return "";
  }

  function extractQuestion(field) {
    if (questionCache.has(field)) return questionCache.get(field);

    const question =
      getLabelViaInputLabels(field) ||
      getLabelViaForAttribute(field) ||
      normalizeText(field.getAttribute("aria-label")) ||
      normalizeText(field.getAttribute("placeholder")) ||
      normalizeText(field.getAttribute("name")) ||
      getNearbyText(field) ||
      "unknown";

    questionCache.set(field, question);
    return question;
  }

  function isLikelySearchControl(field, question) {
    const q = question.toLowerCase();
    const meta = normalizeText(
      [
        field.getAttribute("aria-label"),
        field.getAttribute("placeholder"),
        field.getAttribute("name"),
        field.getAttribute("id"),
        field.className
      ]
        .filter(Boolean)
        .join(" ")
    ).toLowerCase();

    const looksLikeSearch =
      /\b(search|find|query|keyword|lookup)\b/.test(q) ||
      /\b(search|find|query|keyword|lookup)\b/.test(meta);

    if (!looksLikeSearch) return false;

    return Boolean(
      field.closest("header, nav, [role='navigation'], [role='search']") ||
        field.closest("form[action*='search' i]")
    );
  }

  function isLikelyUtilityControl(field, question) {
    const q = question.toLowerCase();
    if (!UTILITY_LABELS.has(q)) return false;

    return Boolean(
      field.closest(
        "[role='dialog'], [aria-label*='settings' i], [id*='settings' i], [class*='settings' i], [aria-label*='caption' i], [id*='caption' i], [class*='caption' i]"
      )
    );
  }

  function buildFingerprint(field, payload) {
    const container = field.closest("form, [role='form'], [role='dialog'], main, section") || document.body;
    const containerId = normalizeText(
      [
        container.tagName,
        container.getAttribute("role") || "",
        container.getAttribute("aria-label") || "",
        container.getAttribute("name") || "",
        container.getAttribute("action") || ""
      ].join("|")
    ).toLowerCase();

    const fieldId = normalizeText(
      [
        field.tagName,
        field.getAttribute("type") || "",
        field.getAttribute("name") || "",
        field.getAttribute("aria-label") || "",
        field.getAttribute("placeholder") || ""
      ].join("|")
    ).toLowerCase();

    return `${payload.type}|${payload.question.toLowerCase()}|${fieldId}|${containerId}`;
  }

  function getFieldType(field) {
    if (field.tagName === "TEXTAREA") return "textarea";
    if (field.tagName === "SELECT") return "select";
    return (field.getAttribute("type") || "text").toLowerCase();
  }

  function markDebug(field) {
    field.style.outline = "2px solid #ff5a5f";
    field.style.outlineOffset = "1px";
  }

  function processField(field) {
    try {
    if (processedFields.has(field)) return;
    if (!isMeaningfulField(field)) return;
    if (!isVisibleField(field)) return;

    processedFields.add(field);

    const payload = {
      question: extractQuestion(field),
      type: getFieldType(field),
      autofillCapable: isAutofillCapable(field),
      fieldElement: field
    };

    if (isLikelySearchControl(field, payload.question)) return;
    if (isLikelyUtilityControl(field, payload.question)) return;

    const fingerprint = buildFingerprint(field, payload);
    if (loggedFingerprints.has(fingerprint)) return;

    loggedFingerprints.add(fingerprint);
    if (loggedFingerprints.size > 5000) {
      loggedFingerprints.clear();
    }

    console.log(payload);
    markDebug(field);
    } catch (_err) {
      // Keep content script resilient on complex pages.
    }
  }

  function collectFields(root) {
    if (!root) return [];

    const fields = [];
    if (root instanceof Element && root.matches(FIELD_SELECTOR)) {
      fields.push(root);
    }

    if (root instanceof Document || root instanceof DocumentFragment || root instanceof Element) {
      fields.push(...root.querySelectorAll(FIELD_SELECTOR));
    }

    return fields;
  }

  function scan(root = document) {
    const fields = collectFields(root);
    for (const field of fields) {
      processField(field);
    }
  }

  let scanTimer = null;
  const pendingScanRoots = new Set();

  function scheduleScan(root = document) {
    if (root instanceof Node) {
      pendingScanRoots.add(root);
    } else {
      pendingScanRoots.add(document);
    }

    if (scanTimer) return;

    scanTimer = window.setTimeout(() => {
      scanTimer = null;

      const roots = Array.from(pendingScanRoots);
      pendingScanRoots.clear();

      for (const currentRoot of roots) {
        scan(currentRoot);
      }
    }, 120);
  }

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList" || mutation.addedNodes.length === 0) {
        continue;
      }

      for (const node of mutation.addedNodes) {
        if (!(node instanceof HTMLElement)) continue;

        if (
          node.matches?.(FIELD_SELECTOR) ||
          node.querySelector?.(FIELD_SELECTOR)
        ) {
          scheduleScan(node);
        }
      }
    }
  });

  function createFloatingUI() {
    const style = document.createElement("style");
    style.textContent = `
      .filla-btn {
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999999;
        font-size: 24px;
        transition: transform 0.2s, box-shadow 0.2s;
        font-family: system-ui, -apple-system, sans-serif;
      }

      .filla-btn:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 16px rgba(102, 126, 234, 0.6);
      }

      .filla-btn:active {
        transform: scale(0.95);
      }

      .filla-window {
        position: fixed;
        bottom: 100px;
        right: 30px;
        width: 320px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        z-index: 999998;
        display: none;
        flex-direction: column;
        overflow: hidden;
        font-family: system-ui, -apple-system, sans-serif;
      }

      .filla-window.open {
        display: flex;
        animation: slideIn 0.2s ease-out;
      }

      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .filla-window-header {
        padding: 16px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        font-weight: 600;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 14px;
      }

      .filla-window-close {
        background: none;
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s;
      }

      .filla-window-close:hover {
        transform: rotate(90deg);
      }

      .filla-window-body {
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .filla-autofill-btn {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        padding: 12px 16px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        font-size: 14px;
        transition: transform 0.2s, box-shadow 0.2s;
        font-family: system-ui, -apple-system, sans-serif;
      }

      .filla-autofill-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      }

      .filla-autofill-btn:active {
        transform: translateY(0);
      }

      .filla-field-list {
        max-height: 240px;
        overflow-y: auto;
        font-size: 12px;
        color: #666;
      }

      .filla-field-item {
        padding: 8px 12px;
        background: #f5f5f5;
        border-radius: 4px;
        margin-bottom: 6px;
        border-left: 3px solid #667eea;
      }

      .filla-field-item strong {
        color: #333;
        display: block;
        margin-bottom: 2px;
      }

      .filla-field-type {
        font-size: 11px;
        color: #999;
      }
    `;
    document.head.appendChild(style);

    const btn = document.createElement("button");
    btn.className = "filla-btn";
    btn.title = "Filla - Form Autofill";
    btn.setAttribute("aria-label", "Open Filla panel");
    btn.innerHTML = "✎";
    document.body.appendChild(btn);

    const windowEl = document.createElement("div");
    windowEl.className = "filla-window";
    windowEl.innerHTML = `
      <div class="filla-window-header">
        <span>Filla Autofill</span>
        <button class="filla-window-close" aria-label="Close panel">&times;</button>
      </div>
      <div class="filla-window-body">
        <button class="filla-autofill-btn">Autofill Form</button>
        <div class="filla-field-list"></div>
      </div>
    `;
    document.body.appendChild(windowEl);

    return { btn, window: windowEl };
  }

  function setupFloatingUI(detectedFields) {
    const { btn, window: windowEl } = createFloatingUI();

    btn.addEventListener("click", () => {
      windowEl.classList.toggle("open");
      updateFieldList(windowEl, detectedFields);
    });

    const closeBtn = windowEl.querySelector(".filla-window-close");
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      windowEl.classList.remove("open");
    });

    const autofillBtn = windowEl.querySelector(".filla-autofill-btn");
    autofillBtn.addEventListener("click", () => {
      console.log("Autofill triggered", detectedFields);
    });
  }

  function updateFieldList(windowEl, detectedFields) {
    const fieldList = windowEl.querySelector(".filla-field-list");
    fieldList.innerHTML = "";

    if (!detectedFields || detectedFields.length === 0) {
      fieldList.innerHTML = '<div style="padding: 8px; color: #999; font-size: 12px;">No form fields detected</div>';
      return;
    }

    detectedFields.slice(0, 10).forEach((field) => {
      const item = document.createElement("div");
      item.className = "filla-field-item";
      item.innerHTML = `
        <strong>${field.question}</strong>
        <span class="filla-field-type">${field.type}</span>
      `;
      fieldList.appendChild(item);
    });

    if (detectedFields.length > 10) {
      const more = document.createElement("div");
      more.style.cssText = "padding: 8px; color: #999; font-size: 12px; text-align: center;";
      more.textContent = `+${detectedFields.length - 10} more fields`;
      fieldList.appendChild(more);
    }
  }

  // ============ HANDLE MESSAGES FROM POPUP ============
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    try {
      if (message.action === 'autofill' && message.profileData) {
        if (!fieldMatcher) {
          sendResponse({
            success: false,
            error: 'FieldMatcher not initialized on this page. Try refreshing.'
          });
          return true;
        }
        handleAutofillMessage(message.profileData, sendResponse);
        return true; // Will respond asynchronously
      }
    } catch (err) {
      console.error('[Filla] Message handler error:', err);
      sendResponse({
        success: false,
        error: err.message
      });
    }
  });

  async function handleAutofillMessage(profileData, sendResponse) {
    try {
      console.log('[Filla] Starting autofill with profile data:', Object.keys(profileData));
      
      if (!fieldMatcher || typeof fieldMatcher.matchFormFields !== 'function') {
        sendResponse({
          success: false,
          error: 'Field matcher not initialized. Try refreshing the page.'
        });
        return;
      }

      const matchedFields = fieldMatcher.matchFormFields(profileData) || [];
      const filledElements = new WeakSet();
      let filledCount = 0;

      if (matchedFields.length > 0) {
        matchedFields.forEach(({ element, formattedValue }) => {
          try {
            if (element && formattedValue !== null && formattedValue !== undefined && String(formattedValue).trim() !== '') {
              element.value = String(formattedValue);
              element.dispatchEvent(new Event('input', { bubbles: true }));
              element.dispatchEvent(new Event('change', { bubbles: true }));
              filledElements.add(element);
              filledCount += 1;
            }
          } catch (_err) {
            // Continue best-effort filling.
          }
        });
      }

      // Fallback pass: question-based mapping for dynamic fields.
      const allFields = Array.from(document.querySelectorAll('input, textarea, select'));
      const handledRadioGroups = new Set();

      allFields.forEach((field) => {
        if (!isVisibleField(field) || !isAutofillCapable(field) || filledElements.has(field)) {
          return;
        }

        const question = extractQuestion(field);
        const mapped = resolveQuestionMapping(question, profileData);
        if (!mapped || mapped.value === null || mapped.value === undefined || mapped.value === '') {
          return;
        }

        const fieldType = getFieldType(field);
        if (fieldType === 'radio') {
          const radioName = field.getAttribute('name') || '';
          if (!radioName || handledRadioGroups.has(radioName)) {
            return;
          }
          const didFill = fillRadioGroupByQuestion(field, mapped.value);
          if (didFill) {
            handledRadioGroups.add(radioName);
            filledCount += 1;
          }
          return;
        }

        const didFill = fillGenericField(field, mapped.value, fieldType);
        if (didFill) {
          filledCount += 1;
        }
      });

      if (filledCount === 0) {
        const fieldInfo = allFields
          .slice(0, 12)
          .map(el => `${extractQuestion(el)} [${getFieldType(el)}]`)
          .join(', ');

        console.warn(`[Filla] No matching fields found. Total fields on page: ${allFields.length}`);
        console.warn(`[Filla] Sample fields: ${fieldInfo}`);
        sendResponse({
          success: false,
          error: `No matching form fields. Found ${allFields.length} total fields but none matched your profile.`
        });
        return;
      }

      sendResponse({
        success: true,
        filledCount,
        fields: matchedFields.map((f) => ({
          type: f.fieldType,
          value: f.formattedValue
        }))
      });
    } catch (error) {
      console.error('[Filla] Autofill error:', error);
      sendResponse({
        success: false,
        error: error.message
      });
    }
  }

  function resolveQuestionMapping(question, profileData) {
    const q = normalizeText(question).toLowerCase();
    const profile = profileData || {};

    if (typeof window.mapToProfile === 'function') {
      const mapped = window.mapToProfile(question, profile);
      if (mapped && mapped.type !== 'unknown') {
        return mapped;
      }
    }

    // Education yes/no fallback for questions like:
    // "Have you completed ... Associate's Degree?"
    if (q.includes('education') || q.includes('degree')) {
      const education = Array.isArray(profile.education) ? profile.education : [];
      const degrees = education
        .map((e) => normalizeText(e?.degree || e?.major || ''))
        .join(' ')
        .toLowerCase();

      let required = '';
      if (q.includes('associate')) required = 'associate';
      else if (q.includes('bachelor')) required = 'bachelor';
      else if (q.includes('master')) required = 'master';
      else if (q.includes('phd') || q.includes('doctor')) required = 'phd';

      if (required) {
        const hasLevel = degrees.includes(required);
        return { type: 'personal', key: 'education', value: hasLevel ? 'Yes' : 'No' };
      }
    }

    // Generic years of experience fallback when no specific skill match is found.
    if (q.includes('years') && q.includes('experience')) {
      return { type: 'experience', key: null, value: 0 };
    }

    // Location yes/no fallback: "Are you currently based in Mumbai?"
    if (q.includes('based in')) {
      const location = profile.location || {};
      const city = normalizeText(location.city || '').toLowerCase();
      const match = q.match(/based in\s+([a-z .-]+)/i);
      if (match && match[1]) {
        const askedCity = normalizeText(match[1]).replace(/[?]/g, '').toLowerCase();
        const isBased = city && (city.includes(askedCity) || askedCity.includes(city));
        return { type: 'personal', key: 'location', value: isBased ? 'Yes' : 'No' };
      }
    }

    return { type: 'unknown', key: null, value: null };
  }

  function fillRadioGroupByQuestion(field, value) {
    const groupName = field.getAttribute('name');
    if (!groupName) return false;

    const radios = Array.from(document.querySelectorAll(`input[type="radio"][name="${CSS.escape(groupName)}"]`));
    if (radios.length === 0) return false;

    const target = normalizeText(String(value)).toLowerCase();
    const picked = radios.find((radio) => {
      const label = extractQuestion(radio).toLowerCase();
      const radioVal = normalizeText(radio.value).toLowerCase();
      return label.includes(target) || radioVal === target;
    });

    if (!picked) return false;

    picked.checked = true;
    picked.dispatchEvent(new Event('input', { bubbles: true }));
    picked.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }

  function fillGenericField(field, value, fieldType) {
    try {
      if (fieldType === 'select') {
        const target = normalizeText(String(value)).toLowerCase();
        const options = Array.from(field.options || []);
        const match = options.find((opt) => {
          const optValue = normalizeText(opt.value).toLowerCase();
          const optText = normalizeText(opt.textContent).toLowerCase();
          return optValue === target || optText === target || optText.includes(target);
        });

        if (!match) return false;
        field.value = match.value;
      } else {
        field.value = String(value);
      }

      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    } catch (_err) {
      return false;
    }
  }

  function start() {
    // Check if page has a supported form
    const isSupported = window.Filla && window.Filla.isSupportedForm && window.Filla.isSupportedForm();

    if (!isSupported) {
      console.log("[Filla] Page skipped - not a supported form");
      return;
    }

    const detectedFields = [];
    const originalLog = console.log;
    let floatingUIReady = false;

    // Intercept console logs to collect detected fields
    console.log = function (...args) {
      if (args[0] && typeof args[0] === "object" && args[0].question && args[0].type) {
        if (!floatingUIReady) {
          setupFloatingUI(detectedFields);
          floatingUIReady = true;
        }
        detectedFields.push(args[0]);
      }
      originalLog.apply(console, args);
    };

    scan(document);

    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    }

    window.addEventListener("hashchange", scheduleScan, { passive: true });
    window.addEventListener("popstate", scheduleScan, { passive: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();