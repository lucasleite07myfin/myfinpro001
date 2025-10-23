import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-user-identifier',
};

interface RateLimitCheck {
  identifier: string; // email or IP
  action: 'login' | 'signup' | 'password_reset';
}

// Rate limits: max attempts per time window
const RATE_LIMITS = {
  login: { maxAttempts: 5, windowMinutes: 15 },
  signup: { maxAttempts: 3, windowMinutes: 60 },
  password_reset: { maxAttempts: 3, windowMinutes: 60 },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { identifier, action } = await req.json() as RateLimitCheck;

    if (!identifier || !action) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const limit = RATE_LIMITS[action];
    const windowStart = new Date(Date.now() - limit.windowMinutes * 60 * 1000);

    // Check attempts in the time window
    const { data: attempts, error } = await supabaseClient
      .from('rate_limit_attempts')
      .select('*')
      .eq('identifier', identifier)
      .eq('action', action)
      .gte('created_at', windowStart.toISOString());

    if (error) throw error;

    const attemptCount = attempts?.length || 0;

    if (attemptCount >= limit.maxAttempts) {
      const oldestAttempt = attempts?.[0];
      const resetTime = oldestAttempt 
        ? new Date(new Date(oldestAttempt.created_at).getTime() + limit.windowMinutes * 60 * 1000)
        : new Date(Date.now() + limit.windowMinutes * 60 * 1000);

      return new Response(
        JSON.stringify({
          allowed: false,
          retryAfter: Math.ceil((resetTime.getTime() - Date.now()) / 1000),
          message: `Muitas tentativas. Tente novamente em ${Math.ceil((resetTime.getTime() - Date.now()) / 60000)} minutos.`
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log this attempt
    await supabaseClient
      .from('rate_limit_attempts')
      .insert({ identifier, action });

    return new Response(
      JSON.stringify({
        allowed: true,
        remainingAttempts: limit.maxAttempts - attemptCount - 1
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
