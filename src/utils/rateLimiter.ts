import { supabase } from '@/integrations/supabase/client';

interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number;
  message?: string;
  remainingAttempts?: number;
}

export const checkRateLimit = async (
  identifier: string,
  action: 'login' | 'signup' | 'password_reset'
): Promise<RateLimitResult> => {
  try {
    const { data, error } = await supabase.functions.invoke('rate-limit-check', {
      body: { identifier, action }
    });

    if (error) {
      console.warn('Rate limit check failed, allowing request:', error);
      return { allowed: true };
    }

    return data as RateLimitResult;
  } catch (error) {
    console.warn('Rate limit check error, allowing request:', error);
    return { allowed: true };
  }
};
