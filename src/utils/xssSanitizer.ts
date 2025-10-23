/**
 * XSS Sanitization utilities
 * Prevents XSS attacks by sanitizing user input
 */

const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi, // onclick, onerror, etc
  /<iframe/gi,
  /<object/gi,
  /<embed/gi,
];

/**
 * Sanitizes text input by removing potentially dangerous HTML/JS
 * @param input - User input string
 * @returns Sanitized string safe for display
 */
export const sanitizeText = (input: string | null | undefined): string => {
  if (!input) return '';
  
  let sanitized = String(input);
  
  // Remove dangerous patterns
  DANGEROUS_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });
  
  // Encode HTML entities
  return sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Sanitizes HTML while allowing safe tags (b, i, u, p, br)
 * @param input - HTML string
 * @returns Sanitized HTML
 */
export const sanitizeHtml = (input: string | null | undefined): string => {
  if (!input) return '';
  
  let sanitized = String(input);
  
  // Remove dangerous patterns first
  DANGEROUS_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });
  
  // Allow only safe tags
  const allowedTags = ['b', 'i', 'u', 'p', 'br', 'strong', 'em'];
  const tagPattern = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
  
  sanitized = sanitized.replace(tagPattern, (match, tag) => {
    return allowedTags.includes(tag.toLowerCase()) ? match : '';
  });
  
  return sanitized;
};

/**
 * Validates and sanitizes email addresses
 * @param email - Email string
 * @returns Sanitized email or empty string if invalid
 */
export const sanitizeEmail = (email: string | null | undefined): string => {
  if (!email) return '';
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const trimmed = String(email).trim().toLowerCase();
  
  return emailRegex.test(trimmed) ? trimmed : '';
};

/**
 * Sanitizes URLs to prevent javascript: and data: protocols
 * @param url - URL string
 * @returns Safe URL or empty string
 */
export const sanitizeUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  
  const urlStr = String(url).trim();
  
  // Block dangerous protocols
  if (/^(javascript|data|vbscript):/i.test(urlStr)) {
    return '';
  }
  
  // Only allow http, https, mailto
  if (!/^(https?|mailto):/i.test(urlStr) && !urlStr.startsWith('/')) {
    return '';
  }
  
  return urlStr;
};
