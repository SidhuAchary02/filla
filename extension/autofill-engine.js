/**
 * Production-Ready Autofill Engine
 * Deterministic question-to-field mapping with optional AI fallback
 * 
 * Core Principles:
 * - NEVER default to 0 or hallucinate values
 * - Keyword-based matching (deterministic)
 * - AI classification as optional fallback
 * - Extensible mapping system
 * - Comprehensive logging for unmatched questions
 */

// ============================================================================
// 1. QUESTION → FIELD MAPPING ENGINE
// ============================================================================

/**
 * Comprehensive keyword mapping from questions to profile fields
 * Format: fieldPath => { keywords, confidence, type }
 */
const FIELD_MAPPINGS = {
  'notice_period': {
    keywords: [
      'notice period', 'notice', 'availability', 'when can you join',
      'when can you start', 'joining date', 'start date', 'available from',
      'earliest start date', 'available date'
    ],
    type: 'string',
    confidence: 'high'
  },

  'experience.gen_ai': {
    keywords: [
      'gen ai', 'generative ai', 'generative artificial intelligence',
      'llm', 'large language model', 'chatgpt', 'openai', 'gpt',
      'langchain', 'rag', 'retrieval augmented generation', 'prompt engineering'
    ],
    type: 'number',
    confidence: 'high'
  },

  'experience.mlops': {
    keywords: [
      'mlops', 'ml ops', 'model deployment', 'model monitoring', 'model lifecycle',
      'mlflow', 'kubeflow', 'model operationalization'
    ],
    type: 'number',
    confidence: 'high'
  },

  'experience.aws': {
    keywords: [
      'aws', 'amazon web services', 'ec2', 's3', 'lambda', 'rds', 'dynamodb',
      'aws services', 'amazon', 'elasticache', 'ecs', 'eks'
    ],
    type: 'number',
    confidence: 'high'
  },

  'experience.backend': {
    keywords: [
      'backend', 'backend api', 'rest api', 'graphql', 'microservices',
      'api development', 'server-side', 'api design', 'backend development',
      'service architecture', 'distributed systems'
    ],
    type: 'number',
    confidence: 'high'
  },

  'experience.cicd': {
    keywords: [
      'ci/cd', 'cicd', 'continuous integration', 'continuous deployment',
      'continuous delivery', 'jenkins', 'gitlab ci', 'github actions',
      'devops', 'automation', 'pipeline', 'iac', 'infrastructure as code', 'terraform'
    ],
    type: 'number',
    confidence: 'high'
  },

  'experience.python': {
    keywords: [
      'python', 'python programming', 'django', 'flask', 'fastapi',
      'sqlalchemy', 'pandas', 'numpy', 'scikit-learn'
    ],
    type: 'number',
    confidence: 'high'
  },

  'experience.react': {
    keywords: [
      'react', 'reactjs', 'react.js', 'jsx', 'react development',
      'frontend react', 'react experience'
    ],
    type: 'number',
    confidence: 'high'
  },

  'skills': {
    keywords: [
      'skills', 'technical skills', 'expertise', 'competencies',
      'proficiency', 'programming skills', 'core skills', 'key skills'
    ],
    type: 'array',
    confidence: 'high'
  },

  'email': {
    keywords: [
      'email', 'email address', 'e-mail', 'work email', 'contact email'
    ],
    type: 'string',
    confidence: 'high'
  },

  'phone': {
    keywords: [
      'phone', 'phone number', 'mobile', 'mobile number', 'contact number',
      'telephone', 'mobile phone', 'cell phone'
    ],
    type: 'string',
    confidence: 'high'
  },

  'first_name': {
    keywords: [
      'first name', 'firstname', 'given name', 'first', 'fname'
    ],
    type: 'string',
    confidence: 'high'
  },

  'last_name': {
    keywords: [
      'last name', 'lastname', 'surname', 'family name', 'last', 'lname'
    ],
    type: 'string',
    confidence: 'high'
  },

  'full_name': {
    keywords: [
      'full name', 'fullname', 'complete name', 'name', 'your name',
      'candidate name', 'applicant name'
    ],
    type: 'string',
    confidence: 'high'
  },

  'location.city': {
    keywords: [
      'city', 'current city', 'city of residence', 'located in'
    ],
    type: 'string',
    confidence: 'high'
  },

  'location.country': {
    keywords: [
      'country', 'nation', 'country of residence', 'work authorized'
    ],
    type: 'string',
    confidence: 'high'
  },

  'min_salary': {
    keywords: [
      'expected salary', 'min salary', 'minimum salary', 'salary expectation',
      'salary expected', 'desired salary', 'minimum compensation'
    ],
    type: 'number',
    confidence: 'high'
  },

  'current_ctc': {
    keywords: [
      'current ctc', 'current salary', 'current compensation', 'ctc',
      'salary', 'current pay', 'current package'
    ],
    type: 'number',
    confidence: 'high'
  }
};

/**
 * Normalize text for comparison (lowercase, trim, remove extra spaces)
 * @param {string} text
 * @returns {string}
 */
function normalizeText(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[_\-&/,]/g, ' ')
    .replace(/\s+/g, ' ');
}

/**
 * Check if keyword matches question text
 * Supports both exact substring and word boundary matching
 * @param {string} question
 * @param {string} keyword
 * @returns {boolean}
 */
function keywordMatches(question, keyword) {
  const normalizedQuestion = normalizeText(question);
  const normalizedKeyword = normalizeText(keyword);

  // Exact substring match
  if (normalizedQuestion.includes(normalizedKeyword)) {
    return true;
  }

  // Check if keyword appears as complete words (not partial)
  const keywordWords = normalizedKeyword.split(' ');
  return keywordWords.every(word => 
    normalizedQuestion.split(' ').includes(word)
  );
}

/**
 * Match a question to a profile field using keyword mapping
 * Returns: { fieldPath, confidence, matchType }
 * 
 * @param {string} question - Form question/label
 * @returns {Object|null} Match result or null if no match
 */
function matchQuestionToField(question) {
  if (!question || typeof question !== 'string') {
    return null;
  }

  const normalizedQuestion = normalizeText(question);
  let bestMatch = null;
  let bestMatchScore = 0;

  // Check each field mapping
  for (const [fieldPath, config] of Object.entries(FIELD_MAPPINGS)) {
    // Check each keyword for this field
    for (const keyword of config.keywords) {
      if (keywordMatches(question, keyword)) {
        // Score based on keyword specificity
        const keywordLength = normalizeText(keyword).split(' ').length;
        const score = keywordLength; // More specific keywords score higher

        if (score > bestMatchScore) {
          bestMatchScore = score;
          bestMatch = {
            fieldPath,
            confidence: config.confidence,
            matchType: 'exact',
            matchedKeyword: keyword
          };
        }
      }
    }
  }

  return bestMatch;
}

// ============================================================================
// 2. VALUE EXTRACTION ENGINE
// ============================================================================

/**
 * Get value from profile using field path
 * Supports nested paths: "experience.aws" → profile.experience.aws
 * 
 * @param {string} fieldPath - Path to field (e.g., "experience.aws", "location.city")
 * @param {Object} profile - User profile object
 * @returns {any} Value or null if not found
 */
function getValueFromProfile(fieldPath, profile) {
  if (!fieldPath || !profile) {
    return null;
  }

  const parts = fieldPath.split('.');
  let value = profile;

  // Traverse nested object
  for (const part of parts) {
    if (value === null || value === undefined) {
      return null;
    }

    value = value[part];
  }

  // Validate value is not empty
  if (value === null || value === undefined || value === '') {
    return null;
  }

  // Handle arrays
  if (Array.isArray(value) && value.length === 0) {
    return null;
  }

  // Handle objects
  if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) {
    return null;
  }

  return value;
}

/**
 * Validate value for its expected type
 * @param {any} value
 * @param {string} type - Expected type (string, number, array, boolean)
 * @returns {boolean}
 */
function isValidValue(value, type) {
  if (value === null || value === undefined) {
    return false;
  }

  switch (type) {
    case 'string':
      return typeof value === 'string' && value.trim().length > 0;

    case 'number':
      const num = Number(value);
      return !isNaN(num) && num >= 0;

    case 'array':
      return Array.isArray(value) && value.length > 0;

    case 'boolean':
      return typeof value === 'boolean';

    default:
      return value !== null && value !== undefined;
  }
}

// ============================================================================
// 3. AUTOFILL ENGINE (CORE)
// ============================================================================

/**
 * Main autofill function
 * Matches question to field, extracts value, and returns with confidence
 * 
 * NEVER defaults to 0 or guesses values
 * 
 * @param {string} question - Form question/label
 * @param {Object} profile - User profile object
 * @returns {Object} { value, confidence, fieldPath, matched }
 */
function autofillField(question, profile) {
  if (!question || !profile) {
    return {
      value: null,
      confidence: 'low',
      fieldPath: null,
      matched: false,
      reason: 'Missing question or profile'
    };
  }

  // Step 1: Try keyword matching
  const match = matchQuestionToField(question);

  if (!match) {
    // Log unmatched question for analysis
    logUnmatchedQuestion(question);
    return {
      value: null,
      confidence: 'low',
      fieldPath: null,
      matched: false,
      reason: 'No matching field found'
    };
  }

  // Step 2: Get value from profile
  const value = getValueFromProfile(match.fieldPath, profile);

  if (value === null || value === undefined) {
    return {
      value: null,
      confidence: 'low',
      fieldPath: match.fieldPath,
      matched: true,
      reason: 'Field found but value is empty in profile'
    };
  }

  // Step 3: Validate value for its expected type
  const fieldConfig = FIELD_MAPPINGS[match.fieldPath];
  if (!isValidValue(value, fieldConfig.type)) {
    return {
      value: null,
      confidence: 'low',
      fieldPath: match.fieldPath,
      matched: true,
      reason: `Value invalid for type: ${fieldConfig.type}`
    };
  }

  // Step 4: Success - return value with confidence
  return {
    value,
    confidence: match.confidence,
    fieldPath: match.fieldPath,
    matched: true,
    matchedKeyword: match.matchedKeyword,
    type: fieldConfig.type,
    reason: 'Successfully matched and extracted'
  };
}

// ============================================================================
// 4. OPTIONAL AI LAYER (FALLBACK ONLY)
// ============================================================================

/**
 * AI-assisted question classification
 * ONLY called if keyword matching fails
 * 
 * This is a placeholder that can be extended with actual AI/LLM calls
 * 
 * @param {string} question
 * @returns {string|null} Field path or null
 */
function aiClassifyQuestion(question) {
  // This would be replaced with actual AI call (Claude, GPT, etc.)
  // For now, return null to maintain deterministic behavior
  
  console.warn('[Filla] AI classification requested for:', question);
  
  // Could call: await fetch('/api/classify-question', { question })
  // But for production safety, keep AI optional
  
  return null;
}

// ============================================================================
// 5. LOGGING & ANALYTICS
// ============================================================================

/**
 * Store unmatched questions for analysis
 * Helps improve keyword mappings
 */
const UNMATCHED_QUESTIONS_LOG = [];
const MAX_LOG_SIZE = 1000;

/**
 * Log questions that couldn't be matched
 * @param {string} question
 */
function logUnmatchedQuestion(question) {
  const normalized = normalizeText(question);

  // Avoid duplicates
  if (UNMATCHED_QUESTIONS_LOG.includes(normalized)) {
    return;
  }

  UNMATCHED_QUESTIONS_LOG.push(normalized);

  // Limit log size
  if (UNMATCHED_QUESTIONS_LOG.length > MAX_LOG_SIZE) {
    UNMATCHED_QUESTIONS_LOG.shift();
  }

  console.log('[Filla] Unmatched question:', question);
}

/**
 * Get unmatched questions for analysis
 * @returns {Array<string>}
 */
function getUnmatchedQuestions() {
  return [...UNMATCHED_QUESTIONS_LOG];
}

/**
 * Clear unmatched questions log
 */
function clearUnmatchedQuestions() {
  UNMATCHED_QUESTIONS_LOG.length = 0;
}

// ============================================================================
// 6. EXTENSIBLE MAPPING SYSTEM
// ============================================================================

/**
 * Add or update a field mapping
 * Allows dynamic extension of matching system
 * 
 * @param {string} fieldPath - Field path (e.g., "experience.aws")
 * @param {Array<string>} keywords - Keywords to match
 * @param {string} type - Data type (string, number, array, boolean)
 * @param {string} confidence - Confidence level (high, medium, low)
 */
function addFieldMapping(fieldPath, keywords, type = 'string', confidence = 'high') {
  if (!fieldPath || !Array.isArray(keywords) || keywords.length === 0) {
    console.error('[Filla] Invalid field mapping parameters');
    return false;
  }

  FIELD_MAPPINGS[fieldPath] = {
    keywords: keywords.map(k => normalizeText(k)),
    type,
    confidence
  };

  console.log(`[Filla] Added field mapping: ${fieldPath}`);
  return true;
}

/**
 * Get all field mappings (for debugging/extension)
 * @returns {Object}
 */
function getAllFieldMappings() {
  return { ...FIELD_MAPPINGS };
}

/**
 * Get mappings for a specific type
 * @param {string} type - Type filter (experience.*, skills, etc.)
 * @returns {Object}
 */
function getFieldMappingsByType(type) {
  const filtered = {};
  for (const [field, config] of Object.entries(FIELD_MAPPINGS)) {
    if (field.startsWith(type)) {
      filtered[field] = config;
    }
  }
  return filtered;
}

// ============================================================================
// 7. HIGH-LEVEL FLOW
// ============================================================================

/**
 * Complete autofill processing pipeline
 * Combines deterministic matching with optional AI fallback
 * 
 * @param {string} question - Form question/label
 * @param {Object} profile - User profile object
 * @param {Object} options - Configuration options
 * @returns {Object} Complete result with value and metadata
 */
function processQuestion(question, profile, options = {}) {
  const {
    enableAIFallback = false,
    logMatches = true
  } = options;

  // Step 1: Deterministic keyword matching
  let result = autofillField(question, profile);

  // Step 2: If no match and AI enabled, try AI classification
  if (!result.matched && enableAIFallback && typeof aiClassifyQuestion === 'function') {
    const aiFieldPath = aiClassifyQuestion(question);
    
    if (aiFieldPath) {
      const aiValue = getValueFromProfile(aiFieldPath, profile);
      if (aiValue !== null) {
        result = {
          value: aiValue,
          confidence: 'medium', // AI matches get medium confidence
          fieldPath: aiFieldPath,
          matched: true,
          matchedVia: 'ai',
          reason: 'Matched via AI classification'
        };
      }
    }
  }

  // Step 3: Logging
  if (logMatches) {
    if (result.matched) {
      console.log(`[Filla] ✓ Matched: "${question}" → ${result.fieldPath} = ${result.value}`);
    } else {
      console.log(`[Filla] ✗ Unmatched: "${question}"`);
    }
  }

  return result;
}

// ============================================================================
// EXPORTS
// ============================================================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    // Core functions
    matchQuestionToField,
    getValueFromProfile,
    autofillField,
    processQuestion,

    // AI/Fallback
    aiClassifyQuestion,

    // Extensibility
    addFieldMapping,
    getAllFieldMappings,
    getFieldMappingsByType,

    // Logging
    logUnmatchedQuestion,
    getUnmatchedQuestions,
    clearUnmatchedQuestions,

    // Utilities
    normalizeText,
    keywordMatches,
    isValidValue,

    // Constants
    FIELD_MAPPINGS
  };
}
