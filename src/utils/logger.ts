/**
 * Secure Logging System
 * Provides conditional logging based on environment
 * Prevents sensitive data leakage in production
 */

const IS_PRODUCTION = import.meta.env.PROD;

// Sensitive patterns to redact
const SENSITIVE_PATTERNS = [
  /password/i,
  /token/i,
  /secret/i,
  /api[_-]?key/i,
  /authorization/i,
  /bearer/i,
  /session/i,
  /cookie/i,
];

/**
 * Check if a key contains sensitive information
 */
const isSensitiveKey = (key: string): boolean => {
  return SENSITIVE_PATTERNS.some(pattern => pattern.test(key));
};

/**
 * Redact sensitive data from objects
 */
const redactSensitiveData = (data: any): any => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => redactSensitiveData(item));
  }

  const redacted: any = {};
  for (const [key, value] of Object.entries(data)) {
    if (isSensitiveKey(key)) {
      redacted[key] = '[REDACTED]';
    } else if (typeof value === 'object') {
      redacted[key] = redactSensitiveData(value);
    } else {
      redacted[key] = value;
    }
  }
  return redacted;
};

/**
 * Safe logger that only logs in development
 */
export const logger = {
  /**
   * Log informational messages (development only)
   */
  info: (...args: any[]) => {
    if (!IS_PRODUCTION) {
      const redactedArgs = args.map(arg => 
        typeof arg === 'object' ? redactSensitiveData(arg) : arg
      );
      console.log('[INFO]', ...redactedArgs);
    }
  },

  /**
   * Log warning messages (development only)
   */
  warn: (...args: any[]) => {
    if (!IS_PRODUCTION) {
      const redactedArgs = args.map(arg => 
        typeof arg === 'object' ? redactSensitiveData(arg) : arg
      );
      console.warn('[WARN]', ...redactedArgs);
    }
  },

  /**
   * Log error messages (always logged but sanitized)
   */
  error: (...args: any[]) => {
    const redactedArgs = args.map(arg => {
      if (arg instanceof Error) {
        return {
          name: arg.name,
          message: arg.message,
          // Only include stack in development
          ...(IS_PRODUCTION ? {} : { stack: arg.stack })
        };
      }
      return typeof arg === 'object' ? redactSensitiveData(arg) : arg;
    });
    console.error('[ERROR]', ...redactedArgs);
  },

  /**
   * Log debug messages (development only)
   */
  debug: (...args: any[]) => {
    if (!IS_PRODUCTION) {
      const redactedArgs = args.map(arg => 
        typeof arg === 'object' ? redactSensitiveData(arg) : arg
      );
      console.debug('[DEBUG]', ...redactedArgs);
    }
  }
};
