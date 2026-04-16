// Smart Value Converter
// Converts profile values based on field type for proper form submission

const NOTICE_PERIOD_MAPPING = {
  'immediate': '0',
  'immediately': '0',
  'asap': '0',
  '0 days': '0',
  '1 week': '7',
  'week': '7',
  '2 weeks': '14',
  '15 days': '15',
  '30 days': '30',
  '1 month': '30',
  'month': '30',
  '2 months': '60',
  '3 months': '90',
  '60 days': '60',
  '90 days': '90',
};

// Detect field input type from HTML element
function getFieldInputType(element) {
  if (!element) return 'text';

  const inputType = element.getAttribute('type') || '';
  if (inputType) return inputType.toLowerCase();

  if (element.tagName === 'TEXTAREA') return 'textarea';
  if (element.tagName === 'SELECT') return 'select';

  return 'text';
}

// Convert value based on expected field type
function convertValueForFieldType(value, fieldType) {
  if (!value) return '';

  const fieldInputType = fieldType.toLowerCase();

  // Numeric fields
  if (['number', 'tel'].includes(fieldInputType)) {
    return convertToNumber(value);
  }

  // Email fields
  if (fieldInputType === 'email') {
    return String(value).trim();
  }

  // URL fields
  if (fieldInputType === 'url') {
    return String(value).trim();
  }

  // Date fields
  if (fieldInputType === 'date') {
    return convertToDate(value);
  }

  // Default: return as string
  return String(value).trim();
}

// Convert value to number (removes non-numeric characters)
function convertToNumber(value) {
  if (typeof value === 'number') {
    return String(value);
  }

  const str = String(value || '').trim();
  const match = str.match(/(\d+\.?\d*)/);
  
  return match ? match[1] : '0';
}

// Convert value to date format YYYY-MM-DD
function convertToDate(value) {
  if (!value) return '';

  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) return '';

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  } catch (err) {
    return '';
  }
}

// Convert notice period string to days for numeric fields
function convertNoticePeriodToNumber(value) {
  if (!value) return '0';

  const valueLower = String(value).toLowerCase().trim();

  // Check direct mapping
  if (NOTICE_PERIOD_MAPPING[valueLower]) {
    return NOTICE_PERIOD_MAPPING[valueLower];
  }

  // Try to extract numbers from strings like "30 days", "2 weeks", etc.
  const match = valueLower.match(/(\d+)\s*(day|week|month)?/);
  if (match) {
    const num = parseInt(match[1], 10);
    const unit = match[2] || '';

    if (unit.includes('week')) return String(num * 7);
    if (unit.includes('month')) return String(num * 30);
    if (unit.includes('day')) return String(num);

    // If just a number, assume days
    return String(num);
  }

  // If it's "immediate", return 0
  if (valueLower === 'immediate') {
    return '0';
  }

  // Default fallback
  return String(value);
}

// Check if field is a numeric field that needs notice period conversion
function isNoticePeriodNumericField(fieldType, fieldLabel) {
  const isNumeric = ['number', 'tel'].includes((fieldType || 'text').toLowerCase());
  const isNoticePeriodField = (fieldLabel || '').toLowerCase().includes('notice');

  return isNumeric && isNoticePeriodField;
}

// Smart value formatter based on intent and field type
function formatValueForField(value, fieldIntent, fieldType, fieldElement) {
  if (!value) return '';

  const intent = (fieldIntent || '').toLowerCase();
  const inputType = (fieldType || 'text').toLowerCase();

  // Special handling for notice period in numeric fields
  if (intent.includes('notice_period')) {
    if (inputType === 'number' || inputType === 'tel') {
      return convertNoticePeriodToNumber(value);
    }
  }

  // Special handling for experience years
  if (intent.includes('experience') && inputType === 'number') {
    return convertToNumber(value);
  }

  // Special handling for skills (should be text, not numeric)
  if (intent.includes('skills') && inputType === 'text') {
    if (Array.isArray(value)) {
      return value.map(s => typeof s === 'string' ? s : s.name).join(', ');
    }
    return String(value);
  }

  // Special handling for salary/compensation (numeric)
  if ((intent.includes('salary') || intent.includes('ctc')) && inputType === 'number') {
    return convertToNumber(value);
  }

  // Default conversion based on field type
  return convertValueForFieldType(value, inputType);
}

// Validate if value is acceptable for field type
function isValidValueForFieldType(value, fieldType) {
  if (!value) return false;

  const inputType = (fieldType || 'text').toLowerCase();

  switch (inputType) {
    case 'number':
    case 'tel':
      const num = parseFloat(value);
      return !isNaN(num) && num >= 0;

    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value));

    case 'url':
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }

    case 'date':
      return /^\d{4}-\d{2}-\d{2}$/.test(String(value));

    default:
      return true;
  }
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getFieldInputType,
    convertValueForFieldType,
    convertToNumber,
    convertToDate,
    convertNoticePeriodToNumber,
    isNoticePeriodNumericField,
    formatValueForField,
    isValidValueForFieldType,
    NOTICE_PERIOD_MAPPING
  };
}
