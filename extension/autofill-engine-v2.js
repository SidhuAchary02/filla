/**
 * AUTOFILL ENGINE V2 - Uses Normalized Profile
 * 
 * This is the CORRECTED autofill engine that:
 * 1. Detects intent from question (e.g., "AWS experience" → "aws")
 * 2. Looks up value in normalized_profile.experience_years[intent]
 * 3. NEVER tries to match question → raw DB fields
 */

// ============================================================================
// INTENT DETECTION - Maps questions to tech categories
// ============================================================================

const INTENT_KEYWORDS = {
  // Questions about Gen AI / LLM experience
  gen_ai: [
    "gen ai", "generative ai", "artificial intelligence", "ai",
    "llm", "large language model",
    "chatgpt", "gpt-3", "gpt-4", "rag", "prompt engineering",
    "fine-tun", "transformer", "langchain", "openai", "claude",
    "bedrock", "anthropic"
  ],

  // Questions about MLOps
  mlops: [
    "mlops", "model deployment", "ml pipeline", "data pipeline",
    "model serving", "ml monitoring", "mlflow", "kubeflow", "airflow",
    "feature store", "experiment tracking"
  ],

  // Questions about AWS
  aws: [
    "aws", "amazon web services", "ec2", "s3", "lambda",
    "rds", "dynamodb", "sqs", "sns", "cloudformation",
    "iam", "vpc", "api gateway", "elastic beanstalk",
    "redshift", "emr", "sagemaker"
  ],

  // Questions about Backend / REST API
  backend: [
    "backend", "rest api", "rest", "api", "microservices",
    "graphql", "websocket", "grpc", "message queue",
    "django", "fastapi", "flask", "express", "spring",
    "nodejs", "node.js", "java", "golang", "go lang",
    "server-side"
  ],

  // Questions about CI/CD
  cicd: [
    "ci/cd", "continuous integration", "continuous deployment",
    "github actions", "gitlab ci", "jenkins", "circleci",
    "terraform", "infrastructure", "docker", "kubernetes",
    "k8s", "containerization", "deployment"
  ],

  // Questions about Python
  python: [
    "python", "django", "flask", "fastapi", "pandas",
    "numpy", "scikit-learn", "jupyter", "pytest"
  ],

  // Questions about React / Frontend
  react: [
    "react", "reactjs", "jsx", "redux", "nextjs", "next.js",
    "typescript", "javascript", "css", "tailwind", "ui/ux",
    "component library", "state management"
  ],

  // Questions about SQL / Databases
  sql: [
    "sql", "postgres", "postgresql", "mysql", "mariadb",
    "database", "query", "normalization", "indexing",
    "transaction"
  ],

  // Questions about DevOps / Infrastructure
  devops: [
    "devops", "infrastructure", "linux", "monitoring",
    "prometheus", "grafana", "logging", "ansible", "puppet"
  ]
};

// ============================================================================
// DETECT INTENT FROM QUESTION
// ============================================================================

/**
 * detectIntent(question)
 * 
 * Maps form question to a technology category intent
 * 
 * Example:
 *   "How many years with AWS?" → "aws"
 *   "Experience with Kubernetes?" → "cicd"  (CI/CD infrastructure)
 *   "Unknown question?" → null
 */
function detectIntent(question) {
  if (!question || typeof question !== 'string') {
    return null;
  }

  const normalized = question.toLowerCase();

  // Try each intent category
  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    for (const keyword of keywords) {
      // Use word boundaries for better matching
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      if (regex.test(normalized)) {
        return intent;
      }
    }
  }

  return null; // No intent matched
}

// ============================================================================
// GET VALUE FROM NORMALIZED PROFILE
// ============================================================================

/**
 * getExperienceYears(intent, normalizedProfile)
 * 
 * Gets experience years for a technology from normalized_profile
 * 
 * Example:
 *   intent = "aws"
 *   normalizedProfile = { experience_years: { aws: 3, backend: 2, ... } }
 *   → returns 3
 * 
 *   If aws is 0 or missing:
 *   → returns null (NOT 0, never fill with 0!)
 */
function getExperienceYears(intent, normalizedProfile) {
  if (!intent || !normalizedProfile) {
    return null;
  }

  const experienceYears = normalizedProfile.experience_years || {};
  const years = experienceYears[intent];

  // CRITICAL: Don't return 0, return null
  if (years === undefined || years === null || years === 0) {
    return null;
  }

  return years;
}

// ============================================================================
// GET OTHER PROFILE VALUES
// ============================================================================

/**
 * getProfileValue(fieldPath, profile)
 * 
 * Gets simple profile values like name, email, phone, notice_period
 */
function getProfileValue(fieldPath, profile) {
  if (!fieldPath || !profile) {
    return null;
  }

  // Handle nested paths like "location.city"
  const parts = fieldPath.split('.');
  let value = profile;

  for (const part of parts) {
    if (value && typeof value === 'object') {
      value = value[part];
    } else {
      return null;
    }
  }

  // Return null if empty string, null, or undefined
  if (value === '' || value === null || value === undefined) {
    return null;
  }

  return value;
}

// ============================================================================
// MAIN AUTOFILL FUNCTION
// ============================================================================

/**
 * autofillQuestion(question, profile)
 * 
 * Main function for autofilling a form question
 * 
 * Returns:
 * {
 *   value: any,                  // The value to fill (or null)
 *   matched: boolean,            // Whether we found a match
 *   intent: string,              // The detected intent (e.g., "aws")
 *   reason: string,              // Why it matched or didn't
 *   confidence: "high" | "low"
 * }
 * 
 * CRITICAL BEHAVIORS:
 * - Returns { value: null, matched: false } for unknown questions
 * - NEVER returns 0 for missing experience
 * - NEVER fills with guesses
 */
function autofillQuestion(question, profile) {
  if (!question || !profile) {
    return {
      value: null,
      matched: false,
      intent: null,
      reason: "Missing question or profile",
      confidence: "low"
    };
  }

  // Step 1: Detect intent from question
  const intent = detectIntent(question);

  if (!intent) {
    return {
      value: null,
      matched: false,
      intent: null,
      reason: `No matching intent detected for: "${question}"`,
      confidence: "low"
    };
  }

  // Step 2: Get normalized profile
  const normalized = profile.normalized_profile;

  if (!normalized) {
    console.warn("[Filla] Warning: No normalized_profile in user data. Make sure profile is saved with work_experience.");
    return {
      value: null,
      matched: false,
      intent: intent,
      reason: "No normalized_profile available",
      confidence: "low"
    };
  }

  // Step 3: Get experience years for this intent
  const years = getExperienceYears(intent, normalized);

  if (years === null) {
    return {
      value: null,
      matched: false,
      intent: intent,
      reason: `No experience found for: ${intent}`,
      confidence: "low"
    };
  }

  // Step 4: Return matched value
  return {
    value: years,
    matched: true,
    intent: intent,
    reason: `Matched "${question}" to ${intent} = ${years} years`,
    confidence: "high"
  };
}

// ============================================================================
// HANDLE OTHER QUESTION TYPES
// ============================================================================

/**
 * handleNonTechQuestion(question, profile)
 * 
 * Handle questions that aren't about tech experience:
 * - Name, email, phone
 * - Notice period
 * - Location
 * - Skills list
 * - Education yes/no
 */
function handleNonTechQuestion(question, profile) {
  if (!question) return null;

  const q = question.toLowerCase();
  const normalized = profile.normalized_profile || {};

  // Notice Period
  if (q.includes('notice') || q.includes('when can you') || q.includes('availability')) {
    const notice = normalized.notice_period || profile.notice_period;
    if (notice) {
      return { value: notice, matched: true, reason: "notice_period" };
    }
  }

  // Name fields
  if (q.includes('first name')) {
    const value = profile.first_name;
    if (value) return { value, matched: true, reason: "first_name" };
  }
  if (q.includes('last name')) {
    const value = profile.last_name;
    if (value) return { value, matched: true, reason: "last_name" };
  }
  if (q.includes('full name') || (q.includes('your') && q.includes('name'))) {
    const value = profile.full_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    if (value) return { value, matched: true, reason: "full_name" };
  }

  // Email
  if (q.includes('email')) {
    const value = profile.email;
    if (value) return { value, matched: true, reason: "email" };
  }

  // Phone
  if (q.includes('phone') || q.includes('mobile') || q.includes('contact number')) {
    const value = profile.phone;
    if (value) return { value, matched: true, reason: "phone" };
  }

  // Location
  if (q.includes('city') || q.includes('current city')) {
    const value = profile.location?.city;
    if (value) return { value, matched: true, reason: "location.city" };
  }
  if (q.includes('country')) {
    const value = profile.location?.country;
    if (value) return { value, matched: true, reason: "location.country" };
  }

  // Skills
  if (q.includes('skills') || q.includes('expertise') || q.includes('technical')) {
    const skills = profile.skills || [];
    if (Array.isArray(skills) && skills.length > 0) {
      // For generic "what are your skills?" questions, return comma-separated list
      const skillNames = skills.map(s => {
        if (typeof s === 'string') return s;
        if (s && s.name) return s.name;
        return '';
      }).filter(Boolean);
      
      if (skillNames.length > 0) {
        return { value: skillNames.join(', '), matched: true, reason: "skills" };
      }
    }
  }

  // Specific skill experience: "How many years with [SkillName]?"
  // Check user's actual skills list first, before trying generic categories
  if ((q.includes('years') || q.includes('experience')) && q.includes('with')) {
    const skills = profile.skills || [];
    
    if (Array.isArray(skills) && skills.length > 0) {
      for (const skill of skills) {
        const skillName = String(skill.name || skill).toLowerCase();
        const skillNormalized = String(skill.normalized || '').toLowerCase();
        
        // Check if question mentions this skill (exact name or normalized version)
        if (q.includes(skillName) || q.includes(skillNormalized)) {
          // For skill objects with experience field
          if (typeof skill === 'object' && skill.experience !== null && skill.experience !== undefined) {
            return { 
              value: skill.experience, 
              matched: true, 
              reason: `Matched skill experience: ${skill.name}` 
            };
          }
        }
      }
    }
  }

  // Salary/CTC - distinguish between current and expected
  if (q.includes('salary') || q.includes('ctc')) {
    // Current CTC
    if (q.includes('current') && (q.includes('ctc') || q.includes('salary') || q.includes('compensation'))) {
      const value = profile.current_ctc;
      if (value) return { value, matched: true, reason: "current_ctc" };
    }
    
    // Expected/Minimum CTC
    if ((q.includes('expected') || q.includes('minimum')) && (q.includes('ctc') || q.includes('salary'))) {
      const value = profile.min_salary || profile.expected_ctc;
      if (value) return { value, matched: true, reason: "min_salary" };
    }
    
    // Generic salary (fallback if no current/expected specified)
    const value = profile.min_salary || profile.current_ctc;
    if (value) return { value, matched: true, reason: "salary" };
  }

  // Education yes/no
  if (q.includes('education') || q.includes('degree')) {
    const education = profile.education || [];
    let degree = '';

    if (q.includes('associate')) degree = 'associate';
    else if (q.includes('bachelor')) degree = 'bachelor';
    else if (q.includes('master')) degree = 'master';
    else if (q.includes('phd') || q.includes('doctor')) degree = 'phd';

    if (degree) {
      const hasLevel = education.some(e => 
        (e.degree || '').toLowerCase().includes(degree)
      );
      return { 
        value: hasLevel ? 'Yes' : 'No', 
        matched: true, 
        reason: `education_${degree}` 
      };
    }
  }

  return null;
}

// ============================================================================
// ORCHESTRATION
// ============================================================================

/**
 * processQuestionV2(question, profile)
 * 
 * Main orchestration function
 * 
 * Tries in order:
 * 1. Tech experience (AWS, Gen AI, etc.) - uses normalized_profile
 * 2. Other fields (name, email, skills, etc.) - uses raw profile
 * 3. Returns null if no match
 */
function processQuestionV2(question, profile) {
  if (!question || !profile) {
    return {
      value: null,
      matched: false,
      reason: "Missing question or profile"
    };
  }

  // Try tech experience first
  const techResult = autofillQuestion(question, profile);
  if (techResult.matched && techResult.value !== null) {
    return {
      value: techResult.value,
      matched: true,
      reason: techResult.reason,
      confidence: "high"
    };
  }

  // Try other field types
  const otherResult = handleNonTechQuestion(question, profile);
  if (otherResult && otherResult.matched) {
    return {
      value: otherResult.value,
      matched: true,
      reason: otherResult.reason,
      confidence: "high"
    };
  }

  // No match found
  return {
    value: null,
    matched: false,
    reason: `Could not match: "${question}"`,
    confidence: "low"
  };
}

// ============================================================================
// DEBUG / LOGGING
// ============================================================================

function logAutofilledQuestion(question, result) {
  if (result.matched && result.value !== null) {
    console.log(`[Filla] ✓ Filled: "${question}" → ${result.value}`);
  } else {
    console.log(`[Filla] ✗ Skipped: "${question}"`);
  }
}
