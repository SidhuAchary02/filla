// Smart Field Matcher
// Matches form fields to profile data using intelligent pattern matching

class FieldMatcher {
  constructor() {
    // Field patterns to match against field names, labels, and placeholders
    this.patterns = {
      full_name: {
        patterns: ['full name', 'fullname', 'name', 'candidate name', 'applicant name', 'your name'],
        value_key: 'full_name'
      },
      first_name: {
        patterns: ['first name', 'firstname', 'given name', 'first'],
        value_key: 'first_name'
      },
      last_name: {
        patterns: ['last name', 'lastname', 'surname', 'family name', 'last'],
        value_key: 'last_name'
      },
      email: {
        patterns: ['email', 'email address', 'e-mail', 'mail', 'contact email', 'email id', 'email addressemail', 'addressemail'],
        value_key: 'email'
      },
      phone: {
        patterns: ['phone', 'phone number', 'mobile', 'mobile number', 'contact number', 'telephone', 'phone no', 'contact phone', 'mobile no', 'mobile phone'],
        value_key: 'phone'
      },
      phone_country_code: {
        patterns: ['phone country code', 'country code', 'code'],
        value_key: 'phone'
      },
      skills: {
        patterns: ['skills', 'technical skills', 'expertise', 'competencies', 'proficiency', 'programming skills'],
        value_key: 'skills'
      },
      experience: {
        patterns: ['experience', 'total experience', 'years of experience', 'work experience', 'total exp', 'exp'],
        value_key: 'experience'
      },
      notice_period: {
        patterns: ['notice period', 'notice', 'availability', 'joining date', 'start date', 'when can you join'],
        value_key: 'notice_period'
      },
      current_ctc: {
        patterns: ['current ctc', 'current salary', 'current compensation', 'ctc', 'salary', 'current pay'],
        value_key: 'current_ctc'
      },
    };
  }

  /**
   * Normalize text for comparison (lowercase, trim, remove special chars)
   * @param {string} text - Text to normalize
   * @returns {string} Normalized text
   */
  normalize(text) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[_-]/g, ' ')
      .replace(/\s+/g, ' ');
  }

  /**
   * Check if text contains any of the patterns
   * @param {string} text - Text to check
   * @param {Array<string>} patterns - Patterns to match
   * @returns {boolean} True if any pattern matches
   */
  matchPatterns(text, patterns) {
    const normalizedText = this.normalize(text);
    return patterns.some(pattern => {
      const normalizedPattern = this.normalize(pattern);
      return normalizedText.includes(normalizedPattern) || normalizedPattern.includes(normalizedText);
    });
  }

  /**
   * Get field type from element (name, id, placeholder, label)
   * @param {HTMLElement} element - Form field element
   * @returns {Object|null} {type, confidence} or null
   */
  identifyFieldType(element) {
    let combinedText = '';

    // Get text from various sources
    const name = element.getAttribute('name') || '';
    const id = element.getAttribute('id') || '';
    const placeholder = element.getAttribute('placeholder') || '';
    const value = element.value || '';

    // Get associated label
    let labelText = '';
    if (element.id) {
      const label = document.querySelector(`label[for="${element.id}"]`);
      if (label) labelText = label.innerText || label.textContent || '';
    }
    
    // Also check for labels in parent elements (LinkedIn style)
    if (!labelText) {
      const parentLabel = element.closest('label');
      if (parentLabel) {
        labelText = parentLabel.innerText || parentLabel.textContent || '';
      }
    }
    
    // Check for labels in nearby divs (LinkedIn's common pattern)
    if (!labelText) {
      const parentDiv = element.closest('div[data-test-id], div.artdeco-inline-feedback__container, div[role="group"]');
      if (parentDiv) {
        const labelEl = parentDiv.querySelector('label, [aria-label], .artdeco-form__label');
        if (labelEl) labelText = labelEl.innerText || labelEl.textContent || '';
      }
    }
    
    // Check aria-label directly on element
    const ariaLabel = element.getAttribute('aria-label') || '';

    // Combine all text sources
    combinedText = [name, id, placeholder, labelText, ariaLabel].join(' ');

    let bestMatch = null;
    let highestConfidence = 0;

    // Check against all patterns
    for (const [fieldType, config] of Object.entries(this.patterns)) {
      if (this.matchPatterns(combinedText, config.patterns)) {
        // Calculate confidence based on how specific the match is
        const normalizedCombined = this.normalize(combinedText);
        const matchedPattern = config.patterns.find(p => 
          normalizedCombined.includes(this.normalize(p)) || 
          this.normalize(p).includes(normalizedCombined)
        );
        const confidence = matchedPattern.length / normalizedCombined.length;

        if (confidence > highestConfidence) {
          highestConfidence = confidence;
          bestMatch = { type: fieldType, ...config, confidence };
        }
      }
    }

    return bestMatch;
  }

  /**
   * Format value for display/population in forms
   * @param {string} fieldType - Type of field
   * @param {any} value - Value from profile
   * @returns {string} Formatted value
   */
  formatValue(fieldType, value) {
    if (!value) return '';

    switch (fieldType) {
      case 'skills':
        // Skills are array, join with comma
        return Array.isArray(value) ? value.join(', ') : value;

      case 'experience':
        // Experience is object {skill: years}, format as readable
        if (typeof value === 'object') {
          return Object.entries(value)
            .map(([skill, years]) => `${skill}: ${years} years`)
            .join(', ');
        }
        return value;

      case 'current_ctc':
        // Format as number with commas
        return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

      default:
        return String(value);
    }
  }

  /**
   * Match all form fields on page and return autofill suggestions
   * @param {Object} profileData - User profile data
   * @returns {Array<Object>} Array of {element, fieldType, suggestedValue}
   */
  matchFormFields(profileData) {
    const suggestions = [];
    const debugInfo = [];

    // Get all form inputs, textareas, and selects (including from iframes on some sites)
    const formElements = document.querySelectorAll('input, textarea, select');
    debugInfo.push(`Total fields found: ${formElements.length}`);

    formElements.forEach((element, index) => {
      // Skip if hidden
      if (element.offsetParent === null) {
        return;
      }
      
      // Skip file inputs and buttons
      const type = (element.getAttribute('type') || 'text').toLowerCase();
      if (['button', 'submit', 'reset', 'hidden', 'file'].includes(type)) {
        return;
      }

      const fieldMatch = this.identifyFieldType(element);
      if (fieldMatch && profileData[fieldMatch.value_key]) {
        const elementInfo = `${fieldMatch.type}(${(fieldMatch.confidence * 100).toFixed(0)}%)`;
        debugInfo.push(elementInfo);
        
        suggestions.push({
          element,
          fieldType: fieldMatch.type,
          fieldKey: fieldMatch.value_key,
          value: profileData[fieldMatch.value_key],
          formattedValue: this.formatValue(fieldMatch.type, profileData[fieldMatch.value_key]),
          confidence: fieldMatch.confidence,
        });
      }
    });

    console.log('[Filla] Matched fields:', debugInfo.join(', '));
    return suggestions;
  }

  /**
   * Auto-fill form with suggestions
   * @param {Array<Object>} suggestions - From matchFormFields()
   * @returns {number} Number of fields filled
   */
  autofillForm(suggestions) {
    let filledCount = 0;

    suggestions.forEach(({ element, formattedValue, fieldType }) => {
      try {
        // Clear any existing value first
        element.value = '';
        
        // Set the new value
        element.value = formattedValue;
        
        // Trigger blur to ensure any validation runs
        element.dispatchEvent(new Event('blur', { bubbles: true }));
        
        // Trigger change event for any listeners
        element.dispatchEvent(new Event('change', { bubbles: true }));
        
        // Trigger input event (often used by React/Vue)
        element.dispatchEvent(new Event('input', { bubbles: true }));

        filledCount++;
        console.log(`[Filla] Filled field: ${fieldType} = ${formattedValue.substring(0, 50)}...`);
      } catch (error) {
        console.error('[Filla] Error filling field:', error);
      }
    });

    return filledCount;
  }
}

// Export for use in other files
window.FieldMatcher = FieldMatcher;
