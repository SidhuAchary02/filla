// Smart Skill Experience Mapper
// Maps skill-based questions to actual experience from work history

const SKILL_KEYWORD_MAP = {
  // Cloud Platforms
  'aws': ['aws', 'amazon web services', 'ec2', 's3', 'lambda', 'rds'],
  'azure': ['azure', 'microsoft azure', 'cosmos db', 'app service'],
  'gcp': ['gcp', 'google cloud', 'firebase', 'datastore', 'bigquery'],
  
  // AI/ML
  'gen ai': ['generative ai', 'gen ai', 'llm', 'chatgpt', 'gpt', 'openai', 'ai', 'artificial intelligence', 'langchain', 'rag'],
  'mlops': ['mlops', 'ml ops', 'model deployment', 'model monitoring', 'mlflow', 'kubeflow'],
  'machine learning': ['machine learning', 'ml', 'deep learning', 'neural network', 'tensorflow', 'pytorch', 'scikit-learn'],
  'deep learning': ['deep learning', 'neural network', 'cnn', 'rnn', 'lstm', 'transformer'],
  
  // Backend Development
  'backend apis': ['backend api', 'api development', 'rest api', 'graphql', 'api design'],
  'microservices': ['microservices', 'micro service', 'service architecture', 'distributed systems'],
  'nodejs': ['node.js', 'nodejs', 'node', 'express', 'nestjs'],
  'python': ['python', 'django', 'flask', 'fastapi', 'sqlalchemy'],
  'java': ['java', 'spring', 'spring boot', 'maven'],
  'go': ['golang', 'go lang', 'go'],
  'rust': ['rust', 'cargo'],
  
  // Frontend
  'react': ['react', 'reactjs', 'react.js', 'jsx'],
  'vue': ['vue', 'vuejs', 'vue.js'],
  'angular': ['angular', 'angularjs'],
  'javascript': ['javascript', 'js', 'typescript', 'ts'],
  'html/css': ['html', 'css', 'html/css', 'html & css'],
  
  // DevOps & Infrastructure
  'ci/cd': ['ci/cd', 'cicd', 'continuous integration', 'continuous deployment', 'jenkins', 'gitlab ci', 'github actions'],
  'terraform': ['terraform', 'iac', 'infrastructure as code', 'terraform hcl'],
  'kubernetes': ['kubernetes', 'k8s', 'container orchestration'],
  'docker': ['docker', 'containerization', 'containers'],
  
  // Databases
  'sql': ['sql', 'mysql', 'postgresql', 'oracle', 'mssql', 'relational database'],
  'nosql': ['nosql', 'mongodb', 'cassandra', 'dynamodb', 'redis', 'firestore'],
  'postgresql': ['postgresql', 'postgres', 'pg'],
  'mongodb': ['mongodb', 'mongo'],
  
  // Data
  'data engineering': ['data engineering', 'etl', 'spark', 'hadoop', 'kafka'],
  'data science': ['data science', 'analytics', 'data analytics', 'business intelligence'],
  
  // Testing
  'testing': ['testing', 'unit test', 'integration test', 'jest', 'pytest', 'mocha'],
  'qa': ['qa', 'quality assurance', 'automation testing'],
};

// Reverse map: normalize skills to standard names
const NORMALIZED_SKILL_MAP = {
  'sql': 'sql',
  'postgresql': 'postgresql',
  'python': 'python',
  'react': 'react',
  'nodejs': 'nodejs',
  'node.js': 'nodejs',
  'node js': 'nodejs',
  'javascript': 'javascript',
  'typescript': 'javascript',
  'html': 'html/css',
  'css': 'html/css',
  'docker': 'docker',
  'kubernetes': 'kubernetes',
  'k8s': 'kubernetes',
  'aws': 'aws',
  'azure': 'azure',
  'gcp': 'gcp',
  'java': 'java',
  'spring': 'java',
  'go': 'go',
  'rust': 'rust',
  'django': 'python',
  'flask': 'python',
  'fastapi': 'python',
  'express': 'nodejs',
  'nestjs': 'nodejs',
  'vue': 'vue',
  'angular': 'angular',
  'mongodb': 'mongodb',
  'redis': 'nosql',
  'jenkins': 'ci/cd',
  'gitlab': 'ci/cd',
  'github': 'ci/cd',
  'terraform': 'terraform',
  'llm': 'gen ai',
  'chatgpt': 'gen ai',
  'openai': 'gen ai',
  'langchain': 'gen ai',
  'rag': 'gen ai',
};

// Calculate years of experience for a skill
function calculateSkillExperience(profileData, skillKeyword) {
  if (!profileData) return 0;

  // If explicit experience object exists with skill data, use it
  if (profileData.experience && typeof profileData.experience === 'object' && Object.keys(profileData.experience).length > 0) {
    const normalizedSkill = normalizeSkillName(skillKeyword);
    if (profileData.experience[normalizedSkill]) {
      return profileData.experience[normalizedSkill];
    }
  }

  // Otherwise, calculate from work_experience entries that mention this skill
  const workExp = Array.isArray(profileData.work_experience) ? profileData.work_experience : [];
  if (workExp.length === 0) return 0;

  const keywords = SKILL_KEYWORD_MAP[skillKeyword.toLowerCase()] || [skillKeyword.toLowerCase()];
  const relevantRoles = [];

  for (const role of workExp) {
    const roleText = [
      role.title || '',
      role.description || '',
      role.company || ''
    ].join(' ').toLowerCase();

    // Check if any keyword matches this role
    const hasKeyword = keywords.some(keyword => roleText.includes(keyword));
    if (hasKeyword) {
      const duration = calculateDuration(role.start_date, role.end_date);
      relevantRoles.push(duration);
    }
  }

  // Sum up total experience for this skill
  const totalYears = relevantRoles.reduce((sum, duration) => sum + duration, 0);
  return Math.max(0, Math.round(totalYears * 10) / 10); // Round to 1 decimal
}

// Calculate duration in years between two dates
function calculateDuration(startDate, endDate) {
  if (!startDate) return 0;

  try {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    
    if (isNaN(start.getTime())) return 0;
    
    const diffMs = end.getTime() - start.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    const diffYears = diffDays / 365.25;
    
    return Math.max(0, diffYears);
  } catch (err) {
    console.warn('[Filla] Error calculating duration:', err);
    return 0;
  }
}

// Normalize skill name to standard format
function normalizeSkillName(skill) {
  if (!skill) return '';
  
  const normalized = String(skill)
    .toLowerCase()
    .trim()
    .replace(/[_\-&/,]/g, ' ')
    .replace(/\s+/g, ' ');
  
  return NORMALIZED_SKILL_MAP[normalized] || normalized;
}

// Extract skill name from a question
function extractSkillFromQuestion(question) {
  if (!question) return null;

  const questionLower = question.toLowerCase();
  
  // Try to find a matching skill keyword
  for (const [skillName, keywords] of Object.entries(SKILL_KEYWORD_MAP)) {
    for (const keyword of keywords) {
      if (questionLower.includes(keyword)) {
        return skillName;
      }
    }
  }

  // If no exact match, try to extract anything that looks like a skill
  // Common patterns: "experience with X", "years of X", "X skills"
  const patterns = [
    /experience with\s+([^?!.]+)/i,
    /years of\s+([^?!.]+)/i,
    /\b([a-z]+(?:\s+[a-z]+)*)\s+(?:experience|skills|knowledge)/i,
  ];

  for (const pattern of patterns) {
    const match = question.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
}

// Check if a question is asking for skill-based experience
function isSkillExperienceQuestion(question) {
  if (!question) return false;

  const questionLower = question.toLowerCase();
  const patterns = [
    /years?.*experience.*with/i,
    /experience.*with.*years?/i,
    /proficiency.*in/i,
    /expertise.*in/i,
    /worked.*with/i,
    /experience.*level.*in/i,
  ];

  return patterns.some(pattern => pattern.test(questionLower));
}

// Main function to get experience value for a question
function getExperienceForQuestion(question, profileData) {
  if (!isSkillExperienceQuestion(question)) {
    return null;
  }

  const skill = extractSkillFromQuestion(question);
  if (!skill) {
    return null;
  }

  const years = calculateSkillExperience(profileData, skill);
  
  // Don't return 0 or empty - skip if no experience found
  // Only return if we have actual years of experience
  if (years === 0 || years < 0) {
    console.log(`[Filla] No experience found for skill: ${skill}`);
    return null; // Skip this field
  }

  if (years < 1) {
    return `${Math.round(years * 12)} months`;
  }

  return String(years);
}

// Check if a skill exists in user's profile
function hasSkill(profileData, skillName) {
  if (!profileData) return false;

  const skills = Array.isArray(profileData.skills) ? profileData.skills : [];
  const skillsLower = skills.map(s => (typeof s === 'string' ? s : s.name || '').toLowerCase());
  
  const normalizedSkill = normalizeSkillName(skillName).toLowerCase();
  
  return skillsLower.some(s => s.includes(normalizedSkill) || normalizedSkill.includes(s));
}

// Format experience value for form input
function formatExperienceValue(value) {
  if (!value) return '';
  
  // If it's a number, return as string
  if (typeof value === 'number') {
    return String(value);
  }

  // If it's a string like "2 years" or "6 months", extract the number
  const match = String(value).match(/(\d+\.?\d*)/);
  if (match) {
    return match[1];
  }

  return String(value);
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    calculateSkillExperience,
    extractSkillFromQuestion,
    isSkillExperienceQuestion,
    getExperienceForQuestion,
    hasSkill,
    formatExperienceValue,
    normalizeSkillName,
    SKILL_KEYWORD_MAP
  };
}
