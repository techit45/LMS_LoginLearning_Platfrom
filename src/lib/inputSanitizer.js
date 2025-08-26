/**
 * 🔒 SECURITY: Input Sanitization and Validation Library
 * Centralizes all input validation and sanitization logic
 */

import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param {string} input - Raw HTML input
 * @param {Object} options - DOMPurify options
 * @returns {string} - Sanitized HTML
 */
export const sanitizeHtml = (input, options = {}) => {
  if (typeof input !== 'string') return '';
  
  const defaultOptions = {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
    ...options
  };
  
  return DOMPurify.sanitize(input, defaultOptions);
};

/**
 * Escape special characters to prevent SQL injection
 * @param {string} input - Raw string input
 * @returns {string} - Escaped string
 */
export const escapeString = (input) => {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/'/g, "''")  // Escape single quotes
    .replace(/\\/g, '\\\\') // Escape backslashes
    .replace(/;/g, '\\;')   // Escape semicolons
    .replace(/--/g, '\\--') // Escape SQL comments
    .replace(/\/\*/g, '\\/*') // Escape multi-line comments
    .replace(/\*\//g, '\\*/');
};

/**
 * 🔒 SECURE: Safe search query builder for Supabase
 * Prevents SQL injection in search operations
 * @param {string} searchTerm - User search input
 * @param {string} column - Column to search in
 * @returns {Object} - Safe search parameters
 */
export const buildSafeSearchQuery = (searchTerm, column = 'title') => {
  if (!searchTerm || typeof searchTerm !== 'string') {
    return { query: null, params: {} };
  }

  // Remove dangerous characters and trim
  const safeTerm = searchTerm
    .replace(/[%_\\]/g, '\\$&')  // Escape LIKE wildcards
    .replace(/[';\-\-]/g, '')    // Remove SQL injection attempts (fixed regex)
    .trim();

  if (safeTerm.length === 0) {
    return { query: null, params: {} };
  }

  // Limit search term length
  const maxLength = 100;
  const trimmedTerm = safeTerm.length > maxLength ? safeTerm.substring(0, maxLength) : safeTerm;

  return {
    query: `${column}.ilike.%${trimmedTerm}%`,
    safeTerm: trimmedTerm,
    originalTerm: searchTerm
  };
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - Is valid email
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean} - Is valid URL
 */
export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Sanitize user input for database operations
 * @param {Object} data - Data object to sanitize
 * @param {Array} allowedFields - Allowed field names
 * @returns {Object} - Sanitized data
 */
export const sanitizeUserInput = (data, allowedFields = []) => {
  const sanitized = {};
  
  for (const [key, value] of Object.entries(data)) {
    // Only include allowed fields
    if (allowedFields.length > 0 && !allowedFields.includes(key)) {
      continue;
    }
    
    if (typeof value === 'string') {
      sanitized[key] = sanitizeHtml(value);
    } else if (typeof value === 'number') {
      // Validate numbers
      sanitized[key] = isFinite(value) ? value : 0;
    } else if (typeof value === 'boolean') {
      sanitized[key] = Boolean(value);
    } else if (value === null || value === undefined) {
      sanitized[key] = null;
    } else {
      // Skip complex objects/arrays that could contain malicious data
      console.warn(`🔒 Sanitizer: Skipping complex field '${key}' of type ${typeof value}`);
    }
  }
  
  return sanitized;
};

/**
 * Rate limiting helper - check if action is allowed
 * @param {string} key - Unique key for the action (e.g., user_id + action_type)
 * @param {number} maxAttempts - Maximum attempts allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Object} - { allowed: boolean, remainingAttempts: number }
 */
export const checkRateLimit = (key, maxAttempts = 5, windowMs = 60000) => {
  const now = Date.now();
  const windowKey = `${key}_${Math.floor(now / windowMs)}`;
  
  // Get current attempt count from localStorage (in production, use Redis)
  const stored = localStorage.getItem(windowKey);
  const attempts = stored ? parseInt(stored, 10) : 0;
  
  if (attempts >= maxAttempts) {
    return { allowed: false, remainingAttempts: 0 };
  }
  
  // Increment attempt count
  localStorage.setItem(windowKey, (attempts + 1).toString());
  
  // Clean up old entries (basic cleanup)
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const storageKey = localStorage.key(i);
    if (storageKey && storageKey.startsWith(key + '_')) {
      const timestamp = parseInt(storageKey.split('_').pop(), 10);
      if (now - timestamp * windowMs > windowMs * 2) {
        localStorage.removeItem(storageKey);
      }
    }
  }
  
  return { 
    allowed: true, 
    remainingAttempts: maxAttempts - attempts - 1 
  };
};

/**
 * Validate file upload
 * @param {File} file - File to validate
 * @param {Object} options - Validation options
 * @returns {Object} - { valid: boolean, error?: string }
 */
export const validateFileUpload = (file, options = {}) => {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.txt']
  } = options;

  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  // Check file size
  if (file.size > maxSize) {
    const sizeMB = Math.round(maxSize / 1024 / 1024);
    return { valid: false, error: `File size exceeds ${sizeMB}MB limit` };
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'File type not allowed' };
  }

  // Check file extension
  const fileName = file.name.toLowerCase();
  const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext.toLowerCase()));
  
  if (!hasValidExtension) {
    return { valid: false, error: 'File extension not allowed' };
  }

  return { valid: true };
};

export default {
  sanitizeHtml,
  escapeString,
  buildSafeSearchQuery,
  isValidEmail,
  isValidUrl,
  sanitizeUserInput,
  checkRateLimit,
  validateFileUpload
};