(() => {
  "use strict";

  // Listen for autofill requests from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "autofill") {
      performAutofill(request.data);
      sendResponse({ success: true });
    } else if (request.action === "getFields") {
      const fields = collectCurrentFields();
      sendResponse({ fields });
    }
  });

  function collectCurrentFields() {
    const fields = [];
    const fieldElements = document.querySelectorAll("input, textarea, select");

    fieldElements.forEach((field) => {
      const type = getFieldType(field);
      const question = extractQuestion(field);

      if (isAutofillCapable(field)) {
        fields.push({
          question,
          type,
          selector: getElementSelector(field)
        });
      }
    });

    return fields;
  }

  function getFieldType(field) {
    if (field.tagName === "TEXTAREA") return "textarea";
    if (field.tagName === "SELECT") return "select";
    return (field.getAttribute("type") || "text").toLowerCase();
  }

  function extractQuestion(field) {
    // Label via input.labels
    if (field.labels && field.labels.length) {
      for (const label of field.labels) {
        const text = normalizeText(label.textContent);
        if (text) return text;
      }
    }

    // Label via "for" attribute
    if (field.id) {
      const label = document.querySelector(`label[for="${CSS.escape(field.id)}"]`);
      if (label) {
        const text = normalizeText(label.textContent);
        if (text) return text;
      }
    }

    // aria-label
    const ariaLabel = normalizeText(field.getAttribute("aria-label"));
    if (ariaLabel) return ariaLabel;

    // placeholder
    const placeholder = normalizeText(field.getAttribute("placeholder"));
    if (placeholder) return placeholder;

    // name
    const name = normalizeText(field.getAttribute("name"));
    if (name) return name;

    return "unknown";
  }

  function normalizeText(text) {
    return (text || "").replace(/\s+/g, " ").trim();
  }

  function isAutofillCapable(field) {
    if (!field.offsetHeight || !field.offsetWidth) return false;
    if (field.hidden || field.getAttribute("aria-hidden") === "true") return false;

    const style = window.getComputedStyle(field);
    if (style.display === "none" || style.visibility === "hidden") return false;

    return field.getClientRects().length > 0;
  }

  function getElementSelector(field) {
    // Prefer ID
    if (field.id) {
      return `#${CSS.escape(field.id)}`;
    }

    // Fallback to name
    if (field.name) {
      return `${field.tagName}[name="${CSS.escape(field.name)}"]`;
    }

    // CSS path
    return getCSSPath(field);
  }

  function getCSSPath(field) {
    if (field.id) return `#${CSS.escape(field.id)}`;

    const path = [];
    let current = field;

    while (current && current.nodeType === Node.ELEMENT_NODE) {
      let selector = current.tagName.toLowerCase();

      if (current.id) {
        selector += `#${CSS.escape(current.id)}`;
        path.unshift(selector);
        break;
      }

      // Add class if it exists
      if (current.className) {
        const classes = current.className.split(/\s+/).filter(Boolean);
        if (classes.length) {
          selector += `.${classes.map(CSS.escape).join(".")}`;
        }
      }

      // Add name if it exists
      if (current.name) {
        selector += `[name="${CSS.escape(current.name)}"]`;
      }

      path.unshift(selector);
      current = current.parentElement;

      // Stop after a reasonable depth
      if (path.length > 5) break;
    }

    return path.join(" > ");
  }

  function performAutofill(profile) {
    const results = {
      filled: 0,
      skipped: 0,
      failed: 0,
      details: []
    };

    // Iterate over ALL DOM fields and fill using processQuestionV2
    const fields = document.querySelectorAll("input, textarea, select");

    fields.forEach((field) => {
      const question = extractQuestion(field);
      const fieldType = getFieldType(field);

      // Skip if field is not visible or capable
      if (!isAutofillCapable(field)) {
        return;
      }

      // Use processQuestionV2 to get the value for this question
      if (typeof processQuestionV2 !== 'undefined') {
        const result = processQuestionV2(question, profile);

        if (!result.matched || result.value === null) {
          results.skipped += 1;
          results.details.push({
            question: question,
            type: fieldType,
            status: "skipped",
            reason: result.reason
          });
          return;
        }

        try {
          fillField(field, result.value, fieldType);
          results.filled += 1;
          results.details.push({
            question: question,
            type: fieldType,
            status: "filled",
            value: String(result.value).substring(0, 50)
          });
          console.log(`[Filla] ✓ Filled: "${question}" → ${result.value}`);
        } catch (err) {
          results.failed += 1;
          results.details.push({
            question: question,
            type: fieldType,
            status: "failed",
            error: err.message
          });
          console.error(`[Filla] ✗ Failed to fill: "${question}"`, err);
        }
      } else {
        results.failed += 1;
        results.details.push({
          question: question,
          type: fieldType,
          status: "failed",
          error: "processQuestionV2 not available"
        });
        console.warn("[Filla] processQuestionV2 function not found - ensure autofill-engine-v2.js is loaded");
      }
    });

    console.log("[Filla] Autofill Results:", results);
    return results;
  }

  function fillField(field, value, type) {
    if (type === "select") {
      // Select by value or option text
      const option = Array.from(field.options).find(
        (opt) => opt.value === value || opt.textContent.trim() === value
      );
      if (option) {
        field.value = option.value;
      } else {
        throw new Error(`Option "${value}" not found in select`);
      }
    } else if (type === "file") {
      // File inputs require dataTransfer (security restriction)
      // Can only be programmatically set via drag-drop or user interaction
      console.warn("File inputs require manual selection due to browser security");
    } else if (type === "textarea") {
      field.value = String(value);
    } else {
      // text, email, number, tel, url, date, time
      field.value = String(value);
    }

    // Trigger change events to notify any event listeners
    field.dispatchEvent(new Event("input", { bubbles: true }));
    field.dispatchEvent(new Event("change", { bubbles: true }));
  }
})();
