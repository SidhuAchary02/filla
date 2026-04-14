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

// Question -> profile mapper for dynamic job application questions.
const INTENT_KEYWORDS = {
  experience: ['experience', 'years', 'worked with', 'work with', 'hands on', 'hands-on', 'proficiency'],
  salary: ['salary', 'compensation', 'ctc', 'pay', 'package', 'expected salary', 'current salary'],
  notice_period: ['notice', 'availability', 'join', 'joining', 'start date', 'when can you start'],
  personal: ['name', 'email', 'e-mail', 'phone', 'mobile', 'contact number']
};

const SKILL_ALIAS_MAP = {
  'asp.net core': 'asp.net',
  'asp net core': 'asp.net',
  'asp.net mvc': 'asp.net',
  'asp net': 'asp.net',
  'python programming': 'python',
  'java programming': 'java',
  'javascript': 'js',
  'nodejs': 'node.js',
  'node js': 'node.js',
  'reactjs': 'react',
  'react js': 'react',
  'c sharp': 'c#',
  'c plus plus': 'c++'
};

function normalizeTextValue(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeSkill(skill) {
  let text = normalizeTextValue(skill)
    .replace(/\?/g, '')
    .replace(/[()\[\]{}:,;!]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (SKILL_ALIAS_MAP[text]) {
    return SKILL_ALIAS_MAP[text];
  }

  for (const [alias, canonical] of Object.entries(SKILL_ALIAS_MAP)) {
    if (text.includes(alias)) {
      return canonical;
    }
  }

  return text;
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseYearsFromDateRange(startDate, endDate, isCurrent) {
  if (!startDate) return 0;
  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) return 0;

  const end = isCurrent ? new Date() : new Date(endDate || new Date());
  if (Number.isNaN(end.getTime()) || end <= start) return 0;

  const years = (end - start) / (1000 * 60 * 60 * 24 * 365.25);
  return Math.max(0, Math.round(years * 10) / 10);
}

function getTotalExperienceYears(profile) {
  const experienceMap = profile?.experience;
  if (experienceMap && typeof experienceMap === 'object') {
    const values = Object.values(experienceMap).map(toNumber).filter((n) => n !== null);
    if (values.length > 0) {
      return Math.max(...values);
    }
  }

  const work = Array.isArray(profile?.work_experience) ? profile.work_experience : [];
  if (work.length > 0) {
    let total = 0;
    for (const item of work) {
      total += parseYearsFromDateRange(item?.start_date, item?.end_date, item?.is_current);
    }
    return Math.round(total * 10) / 10;
  }

  return 0;
}

function normalizeExperienceMap(profile) {
  const map = profile?.experience;
  if (map && typeof map === 'object') return map;
  return {};
}

function findBestSkillMatch(question, profile) {
  const q = normalizeTextValue(question);
  const experienceMap = normalizeExperienceMap(profile);
  const expKeys = Object.keys(experienceMap);

  if (expKeys.length === 0) return null;

  // 1) direct key-in-question
  for (const key of expKeys) {
    const nk = normalizeSkill(key);
    if (q.includes(nk)) return key;
  }

  // 2) alias matches
  for (const [alias, canonical] of Object.entries(SKILL_ALIAS_MAP)) {
    if (!q.includes(alias)) continue;
    for (const key of expKeys) {
      const nk = normalizeSkill(key);
      if (nk === canonical || nk.includes(canonical) || canonical.includes(nk)) {
        return key;
      }
    }
  }

  // 3) skills in parentheses e.g. (React, Next.js, Node.js)
  const open = q.indexOf('(');
  const close = q.indexOf(')');
  if (open !== -1 && close > open) {
    const inside = q.slice(open + 1, close);
    const candidates = inside.split(',').map((s) => normalizeSkill(s)).filter(Boolean);
    for (const candidate of candidates) {
      for (const key of expKeys) {
        const nk = normalizeSkill(key);
        if (nk === candidate || nk.includes(candidate) || candidate.includes(nk)) {
          return key;
        }
      }
    }
  }

  return null;
}

function convertNoticeToDays(notice) {
  const text = normalizeTextValue(notice);
  if (!text) return null;
  if (text.includes('immediate')) return 0;

  const numMatch = text.match(/\d+/);
  const num = numMatch ? Number(numMatch[0]) : null;
  if (!num) return null;

  if (text.includes('day')) return num;
  if (text.includes('week')) return num * 7;
  if (text.includes('month')) return num * 30;
  return num;
}

function normalizeSalaryForQuestion(question, salaryValue) {
  const raw = toNumber(salaryValue);
  if (raw === null) return null;

  const q = normalizeTextValue(question);
  if (q.includes('lpa') || q.includes('lakh')) {
    // If stored in INR/year (e.g. 1200000), convert to LPA (12)
    return raw >= 100000 ? Math.round((raw / 100000) * 100) / 100 : raw;
  }

  return raw;
}

function detectIntent(question) {
  const q = normalizeTextValue(question);

  const hasKeyword = (keywords) => keywords.some((k) => q.includes(k));

  if (hasKeyword(INTENT_KEYWORDS.experience)) return 'experience';
  if (hasKeyword(INTENT_KEYWORDS.salary)) return 'salary';
  if (hasKeyword(INTENT_KEYWORDS.notice_period)) return 'notice_period';
  if (hasKeyword(INTENT_KEYWORDS.personal)) return 'personal';
  return 'unknown';
}

function extractSkill(question) {
  const q = normalizeTextValue(question);
  if (!q) return null;

  // Strong phrase matches first.
  for (const alias of Object.keys(SKILL_ALIAS_MAP)) {
    if (q.includes(alias)) {
      return normalizeSkill(alias);
    }
  }

  // Common question anchors.
  const anchors = ['with', 'in', 'on', 'using', 'for'];
  for (const anchor of anchors) {
    const marker = ` ${anchor} `;
    const idx = q.indexOf(marker);
    if (idx !== -1) {
      const tail = q.slice(idx + marker.length);
      const fragment = tail
        .split(/[?.!,]/)[0]
        .replace(/\b(do you have|experience|years|year|knowledge|working|worked)\b/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (fragment) {
        return normalizeSkill(fragment);
      }
    }
  }

  return null;
}

function findExperienceKey(experienceMap, skill) {
  if (!experienceMap || typeof experienceMap !== 'object' || !skill) {
    return null;
  }

  const normalizedSkill = normalizeSkill(skill);
  const entries = Object.keys(experienceMap);

  for (const key of entries) {
    const nk = normalizeSkill(key);
    if (nk === normalizedSkill || nk.includes(normalizedSkill) || normalizedSkill.includes(nk)) {
      return key;
    }
  }

  return null;
}

function mapToProfile(question, userProfile) {
  const profile = userProfile || {};
  const type = detectIntent(question);
  const q = normalizeTextValue(question);

  if (type === 'experience') {
    const skill = extractSkill(question);
    const experienceMap = normalizeExperienceMap(profile);
    const matchedKey = findExperienceKey(experienceMap, skill) || findBestSkillMatch(question, profile);

    if (matchedKey) {
      return { type: 'experience', key: matchedKey, value: experienceMap[matchedKey] };
    }

    // Generic total experience style questions should not default to 0 if data exists.
    if (
      q.includes('full stack') ||
      q.includes('information technology') ||
      q.includes('it experience') ||
      q.includes('total experience')
    ) {
      const total = getTotalExperienceYears(profile);
      if (total > 0) {
        return { type: 'experience', key: 'total_experience', value: total };
      }
    }

    return { type: 'experience', key: skill, value: 0 };
  }

  if (type === 'salary') {
    const current = profile.current_ctc ?? null;
    const expected = profile.expected_ctc ?? profile.min_salary ?? null;

    if (q.includes('expected')) {
      return {
        type: 'salary',
        key: 'expected_ctc',
        value: normalizeSalaryForQuestion(question, expected)
      };
    }

    return {
      type: 'salary',
      key: 'current_ctc',
      value: normalizeSalaryForQuestion(question, current)
    };
  }

  if (type === 'notice_period') {
    if (q.includes('day')) {
      return { type: 'notice_period', key: 'notice_period_days', value: convertNoticeToDays(profile.notice_period) };
    }
    return { type: 'notice_period', key: 'notice_period', value: profile.notice_period ?? null };
  }

  if (type === 'personal') {
    const q = normalizeTextValue(question);
    if (q.includes('email') || q.includes('e-mail')) {
      return { type: 'personal', key: 'email', value: profile.email ?? null };
    }
    if (q.includes('phone') || q.includes('mobile') || q.includes('contact')) {
      return { type: 'personal', key: 'phone', value: profile.phone ?? null };
    }
    if (q.includes('name')) {
      return { type: 'personal', key: 'full_name', value: profile.full_name ?? null };
    }
  }

  return { type: 'unknown', key: null, value: null };
}

// Export for use in other files
window.FieldMatcher = FieldMatcher;
window.detectIntent = detectIntent;
window.extractSkill = extractSkill;
window.mapToProfile = mapToProfile;
