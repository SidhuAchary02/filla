// Comprehensive Field Intent Mapping
// Maps form fields to profile data fields using keyword patterns and intent detection

const FIELD_INTENT_MAPPING = {
  // Personal Information
  first_name: {
    keywords: [
      'first name', 'firstname', 'given name', 'first',
      'fname', 'first_name', 'forename', 'given',
      'first_name_field', 'applicant_first_name'
    ],
    profileKey: 'first_name',
    weight: 1.0
  },
  
  middle_name: {
    keywords: [
      'middle name', 'middlename', 'middle initial', 'middle',
      'mname', 'middle_name', 'middle_name_field'
    ],
    profileKey: 'middle_name',
    weight: 0.8
  },

  last_name: {
    keywords: [
      'last name', 'lastname', 'surname', 'family name', 'last',
      'lname', 'last_name', 'family_name', 'second name',
      'last_name_field', 'applicant_last_name'
    ],
    profileKey: 'last_name',
    weight: 1.0
  },

  full_name: {
    keywords: [
      'full name', 'fullname', 'complete name', 'name',
      'candidate name', 'applicant name', 'your name', 'person name',
      'full_name', 'complete_name', 'candidate_name', 'applicant_name',
      'full name*', 'full name (required)'
    ],
    profileKey: 'first_name', // Will combine first + last
    weight: 1.0,
    isCompound: true
  },

  email: {
    keywords: [
      'email', 'email address', 'e-mail', 'mail', 'contact email',
      'email id', 'email_address', 'email_id', 'work email',
      'personal email', 'your email', 'email*', 'email (required)',
      'login email', 'account email', 'email_contact'
    ],
    profileKey: 'email',
    weight: 1.0
  },

  phone: {
    keywords: [
      'phone', 'phone number', 'mobile', 'mobile number', 'contact number',
      'telephone', 'phone no', 'contact phone', 'mobile no', 'mobile phone',
      'phone_number', 'mobile_number', 'contact_number', 'telephone_number',
      'cell phone', 'cellphone', 'work phone', 'personal phone',
      'phone*', 'phone (required)'
    ],
    profileKey: 'phone',
    weight: 0.95
  },

  // Address & Location
  address: {
    keywords: [
      'address', 'street address', 'street', 'address line 1',
      'address1', 'address_1', 'address line', 'mailing address',
      'residential address', 'current address', 'home address'
    ],
    profileKey: 'address',
    weight: 0.9
  },

  city: {
    keywords: [
      'city', 'town', 'city/town', 'city_name', 'city name',
      'current city', 'residence city'
    ],
    profileKey: 'location',
    subKey: 'city',
    weight: 0.85
  },

  state: {
    keywords: [
      'state', 'province', 'state/province', 'state_name', 'state name',
      'region', 'territory', 'county'
    ],
    profileKey: 'location',
    subKey: 'state',
    weight: 0.85
  },

  country: {
    keywords: [
      'country', 'nation', 'country_name', 'country name',
      'nation_name', 'current country', 'residence country'
    ],
    profileKey: 'location',
    subKey: 'country',
    weight: 0.85
  },

  postal_code: {
    keywords: [
      'postal code', 'postcode', 'zip code', 'zip', 'pincode', 'pin code',
      'postal_code', 'zipcode', 'zip_code', 'pin_code', 'postcode_',
      'zip*', 'postal code*'
    ],
    profileKey: 'location',
    subKey: 'pincode',
    weight: 0.85
  },

  // Professional Information
  skills: {
    keywords: [
      'skills', 'technical skills', 'expertise', 'competencies',
      'proficiency', 'programming skills', 'core skills', 'key skills',
      'skills_list', 'primary skills', 'professional skills',
      'specialized skills', 'skill set', 'your skills'
    ],
    profileKey: 'skills',
    weight: 1.0
  },

  experience: {
    keywords: [
      'experience', 'total experience', 'years of experience', 'work experience',
      'total exp', 'exp', 'years exp', 'professional experience',
      'work_experience', 'total_experience', 'work exp', 'how many years',
      'years of professional experience', 'overall experience'
    ],
    profileKey: 'experience_level',
    weight: 0.95
  },

  current_ctc: {
    keywords: [
      'current ctc', 'current salary', 'current compensation', 'ctc',
      'salary', 'current pay', 'present salary', 'current comp',
      'current_ctc', 'current_salary', 'current_compensation',
      'salary_current', 'ctc_current'
    ],
    profileKey: 'current_ctc',
    weight: 0.95
  },

  min_salary: {
    keywords: [
      'expected salary', 'min salary', 'minimum salary', 'salary expectation',
      'salary expected', 'salary requirement', 'minimum compensation',
      'desired salary', 'salary expectations', 'expected compensation',
      'minimum_salary', 'expected_salary', 'salary_expectation',
      'minimum ctc', 'ctc expected', 'expected ctc'
    ],
    profileKey: 'min_salary',
    weight: 0.95
  },

  notice_period: {
    keywords: [
      'notice period', 'notice', 'availability', 'joining date', 'start date',
      'when can you join', 'when can you start', 'available date',
      'notice_period', 'availability_date', 'joining_date', 'start_date',
      'available from', 'notice days', 'notice months', 'notice period (days)',
      'can join from', 'earliest start date'
    ],
    profileKey: 'notice_period',
    weight: 0.9
  },

  role: {
    keywords: [
      'role', 'position', 'job title', 'current role', 'current position',
      'desired role', 'target role', 'role interested', 'applying for',
      'role_name', 'position_name', 'job_title'
    ],
    profileKey: 'role',
    weight: 0.9
  },

  // Education
  education: {
    keywords: [
      'education', 'degree', 'educational background', 'school',
      'college', 'university', 'institution', 'education_background',
      'education_history'
    ],
    profileKey: 'education',
    weight: 0.85
  },

  // Work Authorization
  work_authorized_us: {
    keywords: [
      'authorized to work in the us', 'work in us', 'us authorization',
      'authorized to work in united states', 'us work permit',
      'right to work us', 'authorized us'
    ],
    profileKey: 'work_authorized_us',
    weight: 0.85
  },

  work_authorized_canada: {
    keywords: [
      'authorized to work in canada', 'work in canada', 'canada authorization',
      'authorized to work in canadian', 'canada work permit',
      'right to work canada'
    ],
    profileKey: 'work_authorized_canada',
    weight: 0.85
  },

  work_authorized_uk: {
    keywords: [
      'authorized to work in the uk', 'work in uk', 'uk authorization',
      'authorized to work in united kingdom', 'uk work permit',
      'right to work uk', 'authorized uk'
    ],
    profileKey: 'work_authorized_uk',
    weight: 0.85
  },

  sponsorship_required: {
    keywords: [
      'sponsorship', 'visa sponsorship', 'require sponsorship', 'need sponsorship',
      'sponsorship_required', 'visa required', 'require visa',
      'will you require', 'sponsorship needed'
    ],
    profileKey: 'sponsorship_required',
    weight: 0.85
  },

  // Demographic Information
  gender: {
    keywords: [
      'gender', 'sex', 'gender identity', 'what is your gender',
      'gender_identity', 'biological sex'
    ],
    profileKey: 'gender',
    weight: 0.8
  },

  ethnicity: {
    keywords: [
      'ethnicity', 'ethnic background', 'race', 'racial background',
      'ethnic_background', 'what ethnicity'
    ],
    profileKey: 'ethnicity',
    weight: 0.8
  },

  disability: {
    keywords: [
      'disability', 'disabilities', 'disabled', 'do you have disability',
      'disability_status', 'disability_disclosure'
    ],
    profileKey: 'disability',
    weight: 0.8
  },

  lgbtq: {
    keywords: [
      'lgbtq', 'lgbtq+', 'sexual orientation', 'gender identity',
      'identify as lgbtq', 'lgbtq_identity'
    ],
    profileKey: 'lgbtq',
    weight: 0.8
  },

  veteran: {
    keywords: [
      'veteran', 'military', 'are you veteran', 'military service',
      'military_service', 'veteran_status'
    ],
    profileKey: 'veteran',
    weight: 0.8
  },

  // Links & URLs
  linkedin: {
    keywords: [
      'linkedin', 'linkedin profile', 'linkedin url', 'linkedin link',
      'linkedin_profile', 'linkedin_url', 'linkedin_link',
      'in.com', 'linkedin profile url'
    ],
    profileKey: 'links',
    subKey: 'linkedin',
    weight: 0.95
  },

  github: {
    keywords: [
      'github', 'github profile', 'github url', 'github link',
      'github_profile', 'github_url', 'github_link',
      'github.com', 'github repository'
    ],
    profileKey: 'links',
    subKey: 'github',
    weight: 0.95
  },

  portfolio: {
    keywords: [
      'portfolio', 'portfolio url', 'portfolio link', 'website',
      'personal website', 'portfolio_url', 'portfolio_link',
      'your website', 'portfolio website'
    ],
    profileKey: 'links',
    subKey: 'portfolio',
    weight: 0.9
  },

  // Resume
  resume: {
    keywords: [
      'resume', 'cv', 'curriculum vitae', 'resume upload', 'upload resume',
      'attach resume', 'resume file', 'resume_url', 'resume_file'
    ],
    profileKey: 'resume_url',
    weight: 0.9
  },

  // Job Search Status
  job_search_status: {
    keywords: [
      'actively looking', 'job search', 'actively searching',
      'open to opportunities', 'actively seeking', 'employment status',
      'job_search_status', 'actively'
    ],
    profileKey: 'job_search_timeline',
    weight: 0.85
  }
};

// Alias map for common field name variations
const FIELD_ALIAS_MAP = {
  'fname': 'first_name',
  'lname': 'last_name',
  'mname': 'middle_name',
  'mobile': 'phone',
  'cell': 'phone',
  'tel': 'phone',
  'zip': 'postal_code',
  'pincode': 'postal_code',
  'exp': 'experience',
  'yoe': 'experience',
  'cv': 'resume',
  'cvupload': 'resume',
};

// Normalize and tokenize text for matching
function normalizeFieldText(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[_\-*()[\]{}<>:]/g, ' ')
    .replace(/\s+/g, ' ')
    .split(' ')
    .filter(word => word.length > 0);
}

// Calculate match score between field text and keywords
function calculateMatchScore(fieldTokens, keywords) {
  let maxScore = 0;

  for (const keyword of keywords) {
    const keywordTokens = normalizeFieldText(keyword);
    let matchedTokens = 0;

    for (const kToken of keywordTokens) {
      if (fieldTokens.includes(kToken)) {
        matchedTokens++;
      }
    }

    if (matchedTokens > 0) {
      const score = matchedTokens / Math.max(keywordTokens.length, fieldTokens.length);
      maxScore = Math.max(maxScore, score);
    }
  }

  return maxScore;
}

// Get profile value for a field intent
function getProfileValue(profileData, fieldIntent) {
  if (!fieldIntent || !profileData) return null;

  const intent = FIELD_INTENT_MAPPING[fieldIntent];
  if (!intent) return null;

  let value = profileData[intent.profileKey];

  // Handle nested profile keys (like location.city)
  if (intent.subKey) {
    if (typeof value === 'object' && value !== null) {
      value = value[intent.subKey];
    }
  }

  return value;
}

// Find best matching field intent from form field text
function findBestFieldIntent(fieldText) {
  const fieldTokens = normalizeFieldText(fieldText);
  let bestMatch = null;
  let bestScore = 0;

  for (const [fieldIntent, config] of Object.entries(FIELD_INTENT_MAPPING)) {
    const score = calculateMatchScore(fieldTokens, config.keywords);
    const weightedScore = score * config.weight;

    if (weightedScore > bestScore) {
      bestScore = weightedScore;
      bestMatch = fieldIntent;
    }
  }

  // Only return if score is above threshold
  return bestScore > 0.4 ? bestMatch : null;
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    FIELD_INTENT_MAPPING,
    FIELD_ALIAS_MAP,
    normalizeFieldText,
    calculateMatchScore,
    getProfileValue,
    findBestFieldIntent
  };
}
