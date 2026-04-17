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
        el.value = value;
        dispatchEvents(el);
        console.log(`[Filla] ✅ Text filled: "${el.name || el.id}" → "${value}"`);
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
        const normalVal = FM.normalize(value);
        let matched = false;

        for (const opt of el.options) {
            const optText = FM.normalize(opt.text);
            const optValue = FM.normalize(opt.value);

            if (
                optText === normalVal ||
                optValue === normalVal ||
                optText.includes(normalVal) ||
                normalVal.includes(optText)
            ) {
                el.value = opt.value;
                matched = true;
                break;
            }
        }

        if (matched) {
            dispatchEvents(el);
            console.log(`[Filla] ✅ Select filled: "${el.name || el.id}" → "${value}"`);
        } else {
            console.warn(`[Filla] ⚠️ Select no match: "${el.name || el.id}" for value "${value}"`);
        }
    }

    // ─── Fill: Radio Button Group ─────────────────────────────────────────────
    function fillRadio(radios, value) {
        const normalVal = FM.normalize(value);
        let matched = false;

        for (const radio of radios) {
            const radioVal = FM.normalize(radio.value);
            const radioLabel = (() => {
                if (radio.id) {
                    const lbl = document.querySelector(`label[for="${radio.id}"]`);
                    if (lbl) return FM.normalize(lbl.innerText || lbl.textContent);
                }
                const lbl = radio.closest("label");
                return lbl ? FM.normalize(lbl.innerText || lbl.textContent) : "";
            })();

            if (
                radioVal.includes(normalVal) ||
                normalVal.includes(radioVal) ||
                radioLabel.includes(normalVal) ||
                normalVal.includes(radioLabel)
            ) {
                radio.checked = true;
                dispatchEvents(radio);
                matched = true;
                console.log(`[Filla] ✅ Radio selected: "${radio.name}" → "${radio.value}"`);
                break;
            }
        }

        if (!matched) {
            console.warn(`[Filla] ⚠️ Radio no match: name="${radios[0]?.name}" for value "${value}"`);
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

    function normalizeValue(key, value) {
        if (!value) return value;

        const v = value.toLowerCase();

        if (key === "notice_period") {
            if (v.includes("immediate")) return "can join immediately";
        }

        return value;
    }

    // ─── Core: Process one field ───────────────────────────────────────────────
    function processField(el, userData) {

        const tag = el.tagName.toLowerCase();
        const type = (el.getAttribute("type") || "text").toLowerCase();

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
        value = normalizeValue(key, value);

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
            value = normalizeValue(key, value);

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

        fields.forEach(el => processField(el, userData));

        // Radio groups
        processRadioGroups(userData);

        console.log("[Filla] ✅ Autofill complete.");
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