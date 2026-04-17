(() => {
  "use strict";

  // Listen for autofill requests from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "autofill") {
      const results = performAutofill(request.profileData);
      sendResponse({ 
        success: true, 
        filledCount: results.filled,
        details: results.details 
      });
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

  function performAutofill(profileData) {
    if (!profileData) {
      console.error("[Filla] No profile data provided");
      return { filled: 0, skipped: 0, failed: 0, details: [] };
    }

    console.log("[Filla] Profile data received:", {
      first_name: profileData.first_name,
      last_name: profileData.last_name,
      email: profileData.email,
      phone: profileData.phone,
      skills: profileData.skills?.length || 0,
      has_normalized_profile: !!profileData.normalized_profile
    });

    const results = {
      filled: 0,
      skipped: 0,
      failed: 0,
      details: []
    };

    const fields = document.querySelectorAll("input, textarea, select");
    console.log(`[Filla] Found ${fields.length} total form fields`);

    for (const field of fields) {
      if (!isAutofillCapable(field)) {
        continue;
      }

      const fieldQuestion = extractQuestion(field);
      const fieldType = getFieldType(field);
      console.log(`[Filla] Processing field: "${fieldQuestion}" (type: ${fieldType})`);

      // Try to get value using processQuestionV2 (intelligent matching)
      let value = null;
      let matched = false;

      if (typeof processQuestionV2 === 'function') {
        try {
          const result = processQuestionV2(fieldQuestion, profileData);
          console.log(`[Filla]   → processQuestionV2 result:`, {
            matched: result.matched,
            value: result.value,
            reason: result.reason
          });
          
          if (result.matched && result.value !== null) {
            value = result.value;
            matched = true;
            console.log(`[Filla] ✓ Matched "${fieldQuestion}" → ${value}`);
          }
        } catch (err) {
          console.warn(`[Filla] processQuestionV2 error for "${fieldQuestion}":`, err.message);
        }
      } else {
        console.warn("[Filla] processQuestionV2 is not a function!");
      }

      if (!matched) {
        console.log(`[Filla] ✗ No match for "${fieldQuestion}"`);
        results.skipped += 1;
        results.details.push({
          question: fieldQuestion,
          type: fieldType,
          status: "skipped"
        });
        continue;
      }

      // Fill the field
      try {
        fillField(field, value, fieldType);
        results.filled += 1;
        results.details.push({
          question: fieldQuestion,
          type: fieldType,
          status: "filled",
          value: String(value).substring(0, 50)
        });
        console.log(`[Filla] ✓ Filled: "${fieldQuestion}"`);
      } catch (err) {
        results.failed += 1;
        results.details.push({
          question: fieldQuestion,
          type: fieldType,
          status: "failed",
          error: err.message
        });
        console.error(`[Filla] ✗ Failed to fill "${fieldQuestion}":`, err);
      }
    }

    console.log(`[Filla] Autofill complete: ${results.filled} filled, ${results.skipped} skipped, ${results.failed} failed`);
    console.log("[Filla] Detailed results:", results.details);
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
    } else if (type === "number") {
      // Convert notice period strings to numbers
      let numValue = value;
      
      if (typeof value === 'string') {
        const lowerValue = value.toLowerCase();
        
        // Notice period mappings
        if (lowerValue === 'immediate' || lowerValue === 'asap' || lowerValue === '0 days') {
          numValue = 0;
        } else if (lowerValue.includes('week')) {
          const num = parseInt(lowerValue);
          numValue = isNaN(num) ? 7 : num * 7;
        } else if (lowerValue.includes('month')) {
          const num = parseInt(lowerValue);
          numValue = isNaN(num) ? 30 : num * 30;
        } else {
          // Try to parse as number
          numValue = parseInt(value) || value;
        }
      }
      
      field.value = String(numValue);
    } else {
      // text, email, tel, url, date, time
      field.value = String(value);
    }

    // Trigger change events to notify any event listeners
    field.dispatchEvent(new Event("input", { bubbles: true }));
    field.dispatchEvent(new Event("change", { bubbles: true }));
  }
})();
