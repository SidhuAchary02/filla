/**
 * content.js
 * Filla Autofill — Main Autofill Engine (Content Script)
 * Depends on: fieldMapper.js (injected first via manifest)
 */

(function () {
    "use strict";

    const FM = window.FillaFieldMapper;

    // ─── Event Dispatcher ─────────────────────────────────────────────────────
    function dispatchEvents(el) {
        try {
            const prototype = Object.getPrototypeOf(el);
            const valueSetter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;

            if (valueSetter) {
                valueSetter.call(el, el.value);
            }

            el.dispatchEvent(new Event("input", { bubbles: true }));
            el.dispatchEvent(new Event("change", { bubbles: true }));
        } catch (err) {
            console.warn("[Filla] dispatch error:", err);
        }
    }

    // ─── Fill: Text / Email / Number / Tel / URL / Search ─────────────────────
function fillText(el, value) {
    el.focus();

    const type = (el.getAttribute("type") || "").toLowerCase();

    try {
        if (type === "number") {
            const num = Number(value);

            if (!isNaN(num)) {
                el.value = num;
            } else {
                console.warn("[Filla] ❌ Invalid number skipped:", value);
                return;
            }
        } else {
            el.value = value;
        }

        dispatchEvents(el);

        console.log(`[Filla] ✅ Text filled: "${el.name || el.id}" → "${value}"`);

    } catch (err) {
        console.warn("[Filla] fillText error:", err);
    }
}

    // ─── Fill: Textarea ────────────────────────────────────────────────────────
    function fillTextarea(el, value) {
        el.focus();
        el.value = value;
        dispatchEvents(el);
        console.log(`[Filla] ✅ Textarea filled: "${el.name || el.id}" → "${value}"`);
    }

    // ─── Fill: Select (Dropdown) ──────────────────────────────────────────────
    function fillSelect(el, value) {
        const target = FM.normalize(value);

        for (const opt of el.options) {
            const text = FM.normalize(opt.text);

            if (text.includes(target) || target.includes(text)) {
                el.selectedIndex = opt.index;

                el.dispatchEvent(new Event("change", { bubbles: true }));

                console.log("[Filla] ✅ Select chosen:", opt.text);
                return;
            }
        }
    }

    const customDropdowns = document.querySelectorAll('[role="combobox"]');

    customDropdowns.forEach(dd => {
        dd.click(); // open

        const options = document.querySelectorAll('[role="option"]');

        options.forEach(opt => {
            if (opt.innerText.toLowerCase().includes(value.toLowerCase())) {
                opt.click();
            }
        });
    });

    // ─── Fill: Radio Button Group ─────────────────────────────────────────────
    function fillRadio(radios, value) {
        const target = FM.normalize(value);

        for (const radio of radios) {
            const labelText = (
                radio.closest("label")?.innerText ||
                document.querySelector(`label[for="${radio.id}"]`)?.innerText ||
                radio.parentElement?.innerText ||
                ""
            ).toLowerCase();

            if (labelText.includes(target) || target.includes(labelText)) {
                radio.click(); // 🔥 IMPORTANT: use click, not checked
                console.log("[Filla] ✅ Radio clicked:", labelText);
                return;
            }
        }
    }

    // ─── Fill: Checkbox ────────────────────────────────────────────────────────
    function fillCheckbox(el, value) {
        // value can be a comma-separated list (e.g., skills / languages)
        const targets = value.split(",").map(v => FM.normalize(v.trim()));
        const elVal = FM.normalize(el.value);
        const elLabel = (() => {
            if (el.id) {
                const lbl = document.querySelector(`label[for="${el.id}"]`);
                if (lbl) return FM.normalize(lbl.innerText || lbl.textContent);
            }
            const lbl = el.closest("label");
            return lbl ? FM.normalize(lbl.innerText || lbl.textContent) : "";
        })();

        const shouldCheck = targets.some(t =>
            t === elVal || t === elLabel || elVal.includes(t) || elLabel.includes(t)
        );

        if (shouldCheck && !el.checked) {
            el.checked = true;
            dispatchEvents(el);
            console.log(`[Filla] ✅ Checkbox checked: "${el.name || el.id}" → "${el.value}"`);
        }
    }

    function normalizeValue(key, value, el) {
        if (!value) return value;

        // 🔥 Salary handling (context-aware)
        if (key === "min_salary") {
            const num = Number(value);
            if (isNaN(num)) return value;

            const type = (el.getAttribute("type") || "").toLowerCase();
            const placeholder = (el.placeholder || "").toLowerCase();
            const label = (el.labels?.[0]?.innerText || "").toLowerCase();

            // ✅ number input → raw number
            if (type === "number") return num;

            // ✅ detect numeric expectation
            if (placeholder.includes("number") || label.includes("amount")) {
                return num;
            }

            // ✅ default → human readable
            return (num / 100000).toFixed(0) + " LPA";
        }

        if (key === "experience") {
  const type = (el.getAttribute("type") || "").toLowerCase();

  if (type === "number") {
    // Only full-time experience (exclude internships)
    return 0;
  }

  return value;
}

        // 🔥 Notice period normalization
        if (key === "notice_period") {
            const v = String(value).toLowerCase();
            if (v.includes("immediate")) return "can join immediately";
        }

        return value;
    }

    // ─── Core: Process one field ───────────────────────────────────────────────
    function processField(el, userData) {

        const type = (el.getAttribute("type") || "text").toLowerCase();
        const tag = el.tagName.toLowerCase();

        if (type === "file") {
            console.log("[Filla] 🚫 Skipping file input");
            return;
        }

        // Skip hidden, submit, button, file, image fields
        if (["submit", "button", "file", "image", "hidden", "reset"].includes(type)) return;
        // Skip already filled fields (unless they're selects)
        if (tag !== "select" && el.value && el.value.trim() !== "") {
            console.log(`[Filla] ⏭️ Skipping pre-filled: "${el.name || el.id}"`);
            return;
        }

        const fingerprint = FM.extractFingerprint(el);
        const key = FM.matchKey(fingerprint);

        console.log(`[Filla] 🔍 Field: tag="${tag}" type="${type}" fp="${fingerprint}" → key="${key}"`);

        if (!key) {
            console.log(`[Filla] ❓ No match for: "${fingerprint}"`);
            return;
        }

        let value = FM.resolveValue(key, userData);
        value = normalizeValue(key, value, el);

        console.log("[Filla] Matching:", { key, value });

        if (value === null || value === undefined || value === "") {
            console.warn(`[Filla] ⚠️ No value for key "${key}"`);
            return;
        }

        if (tag === "textarea") {
            fillTextarea(el, value);
        } else if (tag === "select") {
            fillSelect(el, value);
        } else if (tag === "input") {
            if (type === "checkbox") {
                fillCheckbox(el, value);
            } else {
                // text, email, number, tel, url, search, etc.
                fillText(el, value);
            }
        }
    }

    // ─── Core: Handle radio groups separately ─────────────────────────────────
    function processRadioGroups(userData) {
        const groups = {};

        document.querySelectorAll('input[type="radio"]').forEach(radio => {
            const name = radio.name || radio.id || "unnamed";
            if (!groups[name]) groups[name] = [];
            groups[name].push(radio);
        });

        for (const [groupName, radios] of Object.entries(groups)) {
            const fingerprint = FM.extractFingerprint(radios[0]);
            const key = FM.matchKey(fingerprint);

            console.log(`[Filla] 🔍 Radio group: "${groupName}" fp="${fingerprint}" → key="${key}"`);

            if (!key) continue;

            let value = FM.resolveValue(key, userData);
            value = normalizeValue(key, value, el);

            console.log("[Filla] Matching:", { key, value });

            if (!value) continue;

            fillRadio(radios, value);
        }
    }

    // ─── Main Autofill Orchestrator ────────────────────────────────────────────
    function runAutofill(userData) {
        console.log("[Filla] 🚀 Starting autofill...");

        // All standard inputs (excluding radio — handled separately)
        const fields = document.querySelectorAll(
            'input:not([type="radio"]):not([type="hidden"]),' +
            "textarea," +
            "select"
        );
        const customFields = document.querySelectorAll(
            '[role="combobox"], [role="button"], [aria-haspopup="listbox"]'
        );

        fields.forEach(el => processField(el, userData));
        customFields.forEach(el => handleCustomField(el, userData));

        // Radio groups
        processRadioGroups(userData);

        console.log("[Filla] ✅ Autofill complete.");
    }

    function handleCustomField(el, userData) {
        const text = (el.innerText || "").toLowerCase();

        console.log("[Filla] 🔍 Custom field:", text);

        // 🔥 Salary (LPA dropdown style)
        if (text.includes("salary")) {
            const value = userData.profile?.min_salary;

            if (!value) return;

            const lpa = (Number(value) / 100000).toFixed(0);

            el.click();

            setTimeout(() => {
                const options = document.querySelectorAll('[role="option"], div');

                options.forEach(opt => {
                    if (opt.innerText.includes(lpa)) {
                        opt.click();
                    }
                });
            }, 500);
        }

        // 🔥 Work mode
        if (text.includes("work")) {
            if (text.includes("remote")) {
                el.click();
            }
        }
    }

    // ─── Message Listener ─────────────────────────────────────────────────────
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
        if (message.type === "FILLA_AUTOFILL") {
            const { userData } = message;

            if (!userData) {
                console.error("[Filla] ❌ No userData provided.");
                sendResponse({ success: false, error: "No userData provided" });
                return;
            }

            try {
                runAutofill(userData);
                sendResponse({ success: true });
            } catch (err) {
                console.error("[Filla] ❌ Autofill error:", err);
                sendResponse({ success: false, error: err.message });
            }
        }

        // Keep the message channel open for async
        return true;
    });

    console.log("[Filla] 🟢 Content script loaded and ready.");
})();