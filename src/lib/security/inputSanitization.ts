/**
 * Input Sanitization Utilities
 * Prevents XSS, SQL Injection, and other injection attacks
 * For AlgeriaTrade.dz B2B Platform
 * 
 * SECURITY LAYER: This provides defense-in-depth sanitization
 * Always use parameterized queries (Prisma ORM) for database operations
 */

// ===========================================
// Types
// ===========================================

export interface SanitizeOptions {
  maxLength?: number;
  allowHtml?: boolean;
  allowSpecialChars?: boolean;
  trim?: boolean;
  lowercase?: boolean;
}

export interface ValidationResult<T = string> {
  valid: boolean;
  value: T | null;
  sanitized: string;
  errors: string[];
  wasModified: boolean;
}

// ===========================================
// XSS Prevention Patterns
// ===========================================

// Dangerous HTML tags that should never be allowed
const DANGEROUS_HTML_TAGS = [
  'script', 'iframe', 'object', 'embed', 'applet',
  'meta', 'link', 'style', 'base', 'form'
];

// Dangerous event handlers (on* attributes)
const EVENT_HANDLER_PATTERN = /on\w+\s*=/gi;

// JavaScript patterns (for non-HTML contexts)
const JAVASCRIPT_PATTERNS = [
  /javascript\s*:/gi,
  /vbscript\s*:/gi,
  /data\s*:\s*text\/html/gi,
  /expression\s*\(/gi, // CSS expression (IE)
  /url\s*\(\s*['"]?\s*javascript:/gi, // CSS url() with javascript
];

// SQL Injection patterns (defense-in-depth, ORM should handle this)
const SQL_INJECTION_PATTERNS = [
  /(\b(union|select|insert|update|delete|drop|alter|create|exec|execute)\b)/gi,
  /(--|\#|\/\*)/g, // SQL comments
  /(;)\s*(select|insert|update|delete|drop)/gi, // Chained queries
];

// Path traversal patterns
const PATH_TRAVERSAL_PATTERN = /\.\.[\/\\]/g;

// ===========================================
// Core Sanitization Functions
// ===========================================

/**
 * Escape HTML special characters to prevent XSS
 */
export function escapeHtml(str: string): string {
  if (!str) return '';
  
  const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;', // Forward slash helps prevent </script> injection
    '`': '&#x60;', // Backtick used in some XSS vectors
  };
  
  return str.replace(/[&<>"'`/]/g, (char) => htmlEscapeMap[char] || char);
}

/**
 * Remove null bytes and other control characters
 */
export function removeControlChars(str: string): string {
  if (!str) return '';
  // Remove null bytes and other dangerous control characters except newlines/tabs
  return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

/**
 * Sanitize a string for safe use in HTML context
 */
export function sanitizeForHtml(input: string, options: SanitizeOptions = {}): ValidationResult {
  const {
    maxLength = 10000,
    allowHtml = false,
    trim = true,
  } = options;

  let sanitized = input;
  const errors: string[] = [];
  let wasModified = false;

  // Type check
  if (typeof input !== 'string') {
    return {
      valid: false,
      value: null,
      sanitized: '',
      errors: ['Input must be a string'],
      wasModified: true,
    };
  }

  // Trim whitespace
  if (trim) {
    const trimmed = sanitized.trim();
    if (trimmed !== sanitized) wasModified = true;
    sanitized = trimmed;
  }

  // Length check
  if (sanitized.length > maxLength) {
    errors.push(`Input exceeds maximum length of ${maxLength} characters`);
    sanitized = sanitized.substring(0, maxLength);
    wasModified = true;
  }

  // Remove control characters
  const withoutControlChars = removeControlChars(sanitized);
  if (withoutControlChars !== sanitized) {
    sanitized = withoutControlChars;
    wasModified = true;
  }

  // Check for path traversal
  if (PATH_TRAVERSAL_PATTERN.test(sanitized)) {
    errors.push('Path traversal sequences are not allowed');
    sanitized = sanitized.replace(PATH_TRAVERSAL_PATTERN, '');
    wasModified = true;
  }

  // HTML sanitization
  if (!allowHtml) {
    // Check for dangerous HTML
    const lowerInput = sanitized.toLowerCase();
    
    for (const tag of DANGEROUS_HTML_TAGS) {
      const tagPattern = new RegExp(`<\\s*${tag}[\\s>\\/]|<\\s*/\\s*${tag}\\s*>`, 'gi');
      if (tagPattern.test(sanitized)) {
        errors.push(`Dangerous HTML tag '${tag}' detected and removed`);
        sanitized = sanitized.replace(tagPattern, '');
        wasModified = true;
      }
    }

    // Check for event handlers
    if (EVENT_HANDLER_PATTERN.test(sanitized)) {
      errors.push('Event handler attributes are not allowed');
      sanitized = sanitized.replace(EVENT_HANDLER_PATTERN, '');
      wasModified = true;
    }

    // Escape remaining HTML
    const escaped = escapeHtml(sanitized);
    if (escaped !== sanitized) {
      sanitized = escaped;
      wasModified = true;
    }
  } else {
    // Even when allowing HTML, remove script tags and event handlers
    for (const tag of ['script', 'iframe', 'object', 'embed']) {
      const tagPattern = new RegExp(`<\\s*${tag}[\\s>\\/].*?<\\s*/\\s*${tag}\\s*>`, 'gis');
      if (tagPattern.test(sanitized)) {
        errors.push(`Dangerous HTML tag '${tag}' removed for security`);
        sanitized = sanitized.replace(tagPattern, '[removed]');
        wasModified = true;
      }
    }
  }

  // Check for JavaScript URLs
  for (const pattern of JAVASCRIPT_PATTERNS) {
    if (pattern.test(sanitized)) {
      errors.push('JavaScript URLs/expressions are not allowed');
      sanitized = sanitized.replace(pattern, '');
      wasModified = true;
    }
  }

  return {
    valid: errors.length === 0,
    value: errors.length === 0 ? sanitized : null,
    sanitized,
    errors,
    wasModified,
  };
}

/**
 * Sanitize input for use in URL parameters
 */
export function sanitizeForUrl(input: string): ValidationResult {
  let result = sanitizeForHtml(input, { maxLength: 2048 });
  
  // Additional URL-specific checks
  if (result.sanitized.includes('%00')) { // Null byte encoding
    result.errors.push('Encoded null bytes not allowed');
    result.sanitized = result.sanitized.replace(/%00/gi, '');
    result.wasModified = true;
  }

  // Remove characters that could break URL structure
  const cleaned = result.sanitized.replace(/[^\w\-~.]/g, (char) => {
    // Allow common safe URL characters
    if ('/?#[]@!$&\'()*+,;='.includes(char)) return char;
    return encodeURIComponent(char);
  });

  if (cleaned !== result.sanitized) {
    result.wasModified = true;
    result.sanitized = cleaned;
  }

  result.valid = result.errors.length === 0;
  result.value = result.valid ? result.sanitized : null;
  
  return result;
}

/**
 * Sanitize input for use in database queries (defense-in-depth)
 * NOTE: Always use parameterized queries! This is additional protection.
 */
export function sanitizeForDatabase(input: string, options: SanitizeOptions = {}): ValidationResult {
  let result = sanitizeForHtml(input, options);

  // Check for SQL injection patterns
  for (const pattern of SQL_INJECTION_PATTERNS) {
    if (pattern.test(result.sanitized)) {
      result.errors.push('Potentially unsafe SQL pattern detected');
      // Don't modify the value - let it fail at the query level
      // This way we log suspicious input but don't silently corrupt data
      result.valid = false;
      result.value = null;
    }
  }

  return result;
}

/**
 * Sanitize numeric input (extract only valid numbers)
 */
export function sanitizeNumeric(input: string | number, options: {
  min?: number;
  max?: number;
  allowDecimal?: boolean;
  allowNegative?: boolean;
  defaultValue?: number;
} = {}): ValidationResult<number> {
  const {
    min = Number.MIN_SAFE_INTEGER,
    max = Number.MAX_SAFE_INTEGER,
    allowDecimal = false,
    allowNegative = false,
    defaultValue,
  } = options;

  const errors: string[] = [];
  let numValue: number;
  let sanitized: string;

  if (typeof input === 'number') {
    if (!Number.isFinite(input)) {
      return {
        valid: false,
        value: defaultValue ?? null,
        sanitized: '',
        errors: ['Invalid number'],
        wasModified: true,
      };
    }
    numValue = input;
    sanitized = String(input);
  } else {
    // Extract numeric portion
    sanitized = allowDecimal 
      ? input.replace(/[^\d.\-]/g, '')
      : input.replace(/[^\d\-]/g, '');
    
    numValue = allowDecimal ? parseFloat(sanitized) : parseInt(sanitized, 10);

    if (sanitized !== input) {
      errors.push('Non-numeric characters removed');
    }
  }

  if (!Number.isFinite(numValue)) {
    return {
      valid: false,
      value: defaultValue ?? null,
      sanitized: sanitized || '',
      errors: errors.length > 0 ? errors : ['Invalid numeric format'],
      wasModified: true,
    };
  }

  // Range validation
  if (numValue < min) {
    errors.push(`Value ${numValue} is below minimum ${min}`);
    numValue = min;
  } else if (numValue > max) {
    errors.push(`Value ${numValue} exceeds maximum ${max}`);
    numValue = max;
  }

  // Negative check
  if (!allowNegative && numValue < 0) {
    errors.push('Negative values not allowed');
    numValue = Math.abs(numValue);
  }

  return {
    valid: errors.length === 0,
    value: errors.length === 0 ? numValue : (defaultValue ?? numValue),
    sanitized: String(numValue),
    errors,
    wasModified: String(numValue) !== (typeof input === 'number' ? String(input) : input),
  };
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(email: string): ValidationResult {
  if (!email || typeof email !== 'string') {
    return {
      valid: false,
      value: null,
      sanitized: '',
      errors: ['Email is required'],
      wasModified: true,
    };
  }

  const trimmed = email.trim().toLowerCase();
  const result = sanitizeForHtml(trimmed, { maxLength: 254 }); // RFC 5321 max length

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(result.sanitized)) {
    result.errors.push('Invalid email format');
    result.valid = false;
    result.value = null;
  }

  // Check for dangerous patterns in email
  if (result.sanitized.includes('..') || result.sanitized.startsWith('.') || result.sanitized.endsWith('.')) {
    result.errors.push('Invalid email format');
    result.valid = false;
    result.value = null;
  }

  return result;
}

/**
 * Sanitize phone number (Algerian format support)
 */
export function sanitizePhone(phone: string): ValidationResult {
  if (!phone || typeof phone !== 'string') {
    return {
      valid: false,
      value: null,
      sanitized: '',
      errors: ['Phone number is required'],
      wasModified: true,
    };
  }

  // Keep only digits, +, spaces, dashes, parentheses
  let sanitized = phone.replace(/[^\d\+\s\-\(\)]/g, '');
  const wasModified = sanitized !== phone.trim();

  const result = sanitizeForHtml(sanitized.trim(), { maxLength: 20 });

  // Validate Algerian phone format
  const digitsOnly = sanitized.replace(/\D/g, '');
  if (digitsOnly.length < 10 || digitsOnly.length > 15) {
    result.errors.push('Phone number must contain 10-15 digits');
    result.valid = false;
    result.value = null;
  }

  result.wasModified = result.wasModified || wasModified;

  return result;
}

/**
 * Sanitize filename (for file uploads)
 */
export function sanitizeFilename(filename: string): ValidationResult {
  if (!filename || typeof filename !== 'string') {
    return {
      valid: false,
      value: null,
      sanitized: '',
      errors: ['Filename is required'],
      wasModified: true,
    };
  }

  const errors: string[] = [];
  let sanitized = filename;
  let wasModified = false;

  // Remove path components (security critical!)
  if (sanitized.includes('/') || sanitized.includes('\\') || sanitized.includes('..')) {
    errors.push('Path separators not allowed in filenames');
    sanitized = sanitized.replace(/[\/\\]/g, '_').replace(/\.\./g, '_');
    wasModified = true;
  }

  // Remove null bytes
  if (/\0/.test(sanitized)) {
    errors.push('Null bytes not allowed');
    sanitized = sanitized.replace(/\0/g, '');
    wasModified = true;
  }

  // Remove control characters
  const withoutControl = removeControlChars(sanitized);
  if (withoutControl !== sanitized) {
    sanitized = withoutControl;
    wasModified = true;
  }

  // Limit length
  const MAX_FILENAME_LENGTH = 255;
  if (sanitized.length > MAX_FILENAME_LENGTH) {
    errors.push(`Filename too long (max ${MAX_FILENAME_LENGTH})`);
    sanitized = sanitized.substring(0, MAX_FILENAME_LENGTH);
    wasModified = true;
  }

  // Remove dangerous file extensions on Windows
  const DANGEROUS_EXTENSIONS = ['.exe', '.bat', '.cmd', '.ps1', '.sh', '.php', '.asp', '.jsp'];
  const ext = sanitized.toLowerCase().substring(sanitized.lastIndexOf('.'));
  if (DANGEROUS_EXTENSIONS.includes(ext)) {
    errors.push(`File type ${ext} not allowed`);
    sanitized = sanitized.replace(/\.[^.]+$/, '.txt'); // Rename to .txt
    wasModified = true;
  }

  // Remove hidden files (starting with dot)
  if (sanitized.startsWith('.') && !sanitized.startsWith('.')) {
    // Keep relative paths like ./file but hide actual hidden files
  }

  return {
    valid: errors.length === 0,
    value: errors.length === 0 ? sanitized : null,
    sanitized,
    errors,
    wasModified,
  };
}

/**
 * Comprehensive request body sanitizer for API routes
 */
export function sanitizeRequestBody(
  body: Record<string, unknown>,
  schema: Record<string, 'string' | 'number' | 'boolean' | 'email' | 'phone' | 'url' | 'html' | 'filename'>
): {
  valid: boolean;
  sanitized: Record<string, unknown>;
  errors: Array<{ field: string; message: string }>;
} {
  const errors: Array<{ field: string; message: string }> = [];
  const sanitized: Record<string, unknown> = {};

  for (const [field, type] of Object.entries(schema)) {
    const value = body[field];

    if (value === undefined || value === null) {
      continue; // Skip optional fields
    }

    if (typeof value !== 'string' && type !== 'boolean' && type !== 'number') {
      errors.push({ field, message: `Expected ${type}, received ${typeof value}` });
      continue;
    }

    let result: ValidationResult;

    switch (type) {
      case 'string':
        result = sanitizeForHtml(String(value), { maxLength: 10000 });
        break;
      case 'number':
        result = sanitizeNumeric(String(value));
        break;
      case 'boolean':
        sanitized[field] = Boolean(value);
        continue;
      case 'email':
        result = sanitizeEmail(String(value));
        break;
      case 'phone':
        result = sanitizePhone(String(value));
        break;
      case 'url':
        result = sanitizeForUrl(String(value));
        break;
      case 'html':
        result = sanitizeForHtml(String(value), { allowHtml: true });
        break;
      case 'filename':
        result = sanitizeFilename(String(value));
        break;
      default:
        result = sanitizeForHtml(String(value));
    }

    if (!result.valid) {
      errors.push(...result.errors.map(msg => ({ field, message: msg })));
    }

    sanitized[field] = result.sanitized;
  }

  return {
    valid: errors.length === 0,
    sanitized,
    errors,
  };
}

// Export convenience utilities
export default {
  escapeHtml,
  removeControlChars,
  sanitizeForHtml,
  sanitizeForUrl,
  sanitizeForDatabase,
  sanitizeNumeric,
  sanitizeEmail,
  sanitizePhone,
  sanitizeFilename,
  sanitizeRequestBody,
};
