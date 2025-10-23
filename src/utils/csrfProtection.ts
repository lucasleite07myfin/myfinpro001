/**
 * CSRF Protection Utilities
 * Generates and validates CSRF tokens for form submissions
 */

const CSRF_TOKEN_KEY = 'csrf_token';
const TOKEN_EXPIRY_MS = 3600000; // 1 hour

interface CSRFToken {
  token: string;
  timestamp: number;
}

/**
 * Generate a cryptographically secure random token
 */
const generateSecureToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Get or create a CSRF token
 */
export const getCSRFToken = (): string => {
  try {
    const stored = sessionStorage.getItem(CSRF_TOKEN_KEY);
    
    if (stored) {
      const parsed: CSRFToken = JSON.parse(stored);
      const now = Date.now();
      
      // Check if token is still valid
      if (now - parsed.timestamp < TOKEN_EXPIRY_MS) {
        return parsed.token;
      }
    }
  } catch (error) {
    // Invalid stored token, generate new one
  }

  // Generate new token
  const token = generateSecureToken();
  const csrfData: CSRFToken = {
    token,
    timestamp: Date.now()
  };
  
  try {
    sessionStorage.setItem(CSRF_TOKEN_KEY, JSON.stringify(csrfData));
  } catch (error) {
    // SessionStorage might be full or disabled
    console.warn('Failed to store CSRF token');
  }
  
  return token;
};

/**
 * Validate a CSRF token
 */
export const validateCSRFToken = (token: string): boolean => {
  try {
    const stored = sessionStorage.getItem(CSRF_TOKEN_KEY);
    
    if (!stored) {
      return false;
    }
    
    const parsed: CSRFToken = JSON.parse(stored);
    const now = Date.now();
    
    // Check token matches and is not expired
    return (
      parsed.token === token &&
      now - parsed.timestamp < TOKEN_EXPIRY_MS
    );
  } catch (error) {
    return false;
  }
};

/**
 * Clear the CSRF token (e.g., on logout)
 */
export const clearCSRFToken = (): void => {
  try {
    sessionStorage.removeItem(CSRF_TOKEN_KEY);
  } catch (error) {
    // Ignore errors
  }
};

/**
 * Add CSRF token to request headers
 */
export const addCSRFHeader = (headers: Record<string, string> = {}): Record<string, string> => {
  return {
    ...headers,
    'X-CSRF-Token': getCSRFToken()
  };
};
