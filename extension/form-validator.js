(() => {
  "use strict";

  const SEARCH_KEYWORDS = /search|find|query|keyword|lookup|filter/i;
  const LOGIN_KEYWORDS = /password|login|signin|sign in|authenticate|confirm password/i;
  const NOISE_KEYWORDS = /select|choose|option|dropdown|pick|none|--/i;

  window.Filla = window.Filla || {};

  /**
   * Get all meaningful form fields on the page
   * @returns {Array<{element, type, label, name, placeholder}>}
   */
  function getMeaningfulFields() {
    const fields = [];
    const allInputs = document.querySelectorAll("input, textarea, select");

    for (const field of allInputs) {
      // Skip if not visible or disabled
      if (!isFieldVisible(field) || field.disabled) continue;

      // Determine field type
      let type = "unknown";
      if (field.tagName === "TEXTAREA") {
        type = "textarea";
      } else if (field.tagName === "SELECT") {
        type = "select";
      } else if (field.tagName === "INPUT") {
        type = (field.getAttribute("type") || "text").toLowerCase();
      }

      // Skip non-meaningful field types
      const ignoredTypes = ["hidden", "submit", "button", "reset", "image", "checkbox", "radio", "color", "range"];
      if (ignoredTypes.includes(type)) continue;

      // Extract label from multiple sources
      const label = extractLabel(field);

      // Skip if label is search/filter like
      if (label && SEARCH_KEYWORDS.test(label)) continue;

      fields.push({
        element: field,
        type,
        label,
        name: field.getAttribute("name") || "",
        placeholder: field.getAttribute("placeholder") || ""
      });
    }

    return fields;
  }

  /**
   * Check if element is visible in the viewport
   */
  function isFieldVisible(field) {
    if (field.offsetHeight === 0 || field.offsetWidth === 0) return false;
    if (field.hidden) return false;
    if (field.getAttribute("aria-hidden") === "true") return false;

    const style = window.getComputedStyle(field);
    if (style.display === "none" || style.visibility === "hidden") return false;

    return field.getClientRects().length > 0;
  }

  /**
   * Extract meaningful label from field using priority system
   */
  function extractLabel(field) {
    // 1. HTML label element
    if (field.labels && field.labels.length) {
      const text = field.labels[0].textContent.trim();
      if (text && text.length > 0 && text.length < 100) {
        return text;
      }
    }

    // 2. aria-label attribute
    const ariaLabel = field.getAttribute("aria-label");
    if (ariaLabel && ariaLabel.trim()) {
      return ariaLabel.trim();
    }

    // 3. placeholder (if not noise)
    const placeholder = field.getAttribute("placeholder");
    if (placeholder && placeholder.trim() && !NOISE_KEYWORDS.test(placeholder)) {
      return placeholder.trim();
    }

    // 4. name attribute
    const name = field.getAttribute("name");
    if (name && name.length > 0 && name.length < 50 && !/^\d+$/.test(name)) {
      return name;
    }

    return "";
  }

  /**
   * Check if page contains a real form suitable for autofilling
   * @returns {boolean}
   */
  function isSupportedForm() {
    const debug = {
      reason: "",
      fieldCount: 0,
      fields: [],
      inForm: false,
      inContainer: false
    };

    try {
      // Get all meaningful fields
      const meaningfulFields = getMeaningfulFields();
      debug.fieldCount = meaningfulFields.length;
      debug.fields = meaningfulFields.map((f) => ({
        type: f.type,
        label: f.label || "(no label)"
      }));

      // Requirement 1: Need at least 2-3 meaningful fields
      if (meaningfulFields.length < 2) {
        debug.reason = `Only ${meaningfulFields.length} meaningful field(s). Minimum 2 required.`;
        console.log("[Filla] Form NOT supported:", debug.reason);
        return false;
      }

      // Requirement 2: Check if page has mostly non-meaningful fields (spam detection)
      const allInputs = document.querySelectorAll("input, textarea, select");
      if (allInputs.length > meaningfulFields.length * 3) {
        const meaningfulPercent = (meaningfulFields.length / allInputs.length) * 100;
        if (meaningfulPercent < 20) {
          debug.reason = `Too many non-meaningful fields (${meaningfulPercent.toFixed(0)}% meaningful).`;
          console.log("[Filla] Form NOT supported:", debug.reason);
          return false;
        }
      }

      // Requirement 3: Reject pure login forms (password + email only)
      const loginFormIndicators = meaningfulFields.filter((f) =>
        LOGIN_KEYWORDS.test(f.label.toLowerCase() + f.type.toLowerCase())
      );

      if (loginFormIndicators.length > 0 && meaningfulFields.length <= 3) {
        const isLikelyLogin =
          meaningfulFields.some((f) => f.type === "password") &&
          meaningfulFields.some((f) => f.type === "email" || f.label.toLowerCase().includes("email"));

        if (isLikelyLogin) {
          debug.reason = "Page is likely a login form (email + password).";
          console.log("[Filla] Form NOT supported:", debug.reason);
          return false;
        }
      }

      // Requirement 4: Reject filter/dropdown-only UIs
      const nonSelectFields = meaningfulFields.filter((f) => f.type !== "select");
      if (nonSelectFields.length === 0 && meaningfulFields.length > 0) {
        debug.reason = "Page contains only select dropdowns (likely a filter).";
        console.log("[Filla] Form NOT supported:", debug.reason);
        return false;
      }

      // Requirement 5: Check structural context
      debug.inForm = meaningfulFields.some((f) => f.element.closest("form"));
      debug.inContainer = meaningfulFields.some((f) => {
        const container = f.element.closest(
          "form, [role='form'], [role='dialog'], main, section, [class*='form'], [class*='modal'], [class*='card']"
        );
        return container && container !== document.body;
      });

      if (!debug.inForm && !debug.inContainer) {
        debug.reason = "Fields not within a form element or structured container.";
        console.log("[Filla] Form NOT supported:", debug.reason);
        return false;
      }

      // PASSED: This is a supported form
      console.log("[Filla] Form IS supported", debug);
      return true;
    } catch (err) {
      console.error("[Filla] Error validating form:", err);
      return false;
    }
  }

  // Export functions
  window.Filla.getMeaningfulFields = getMeaningfulFields;
  window.Filla.isSupportedForm = isSupportedForm;
})();
