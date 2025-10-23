-- Create rate_limit_attempts table for tracking authentication attempts
CREATE TABLE IF NOT EXISTS public.rate_limit_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('login', 'signup', 'password_reset')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add index for efficient queries
CREATE INDEX IF NOT EXISTS idx_rate_limit_identifier_action_created 
  ON public.rate_limit_attempts(identifier, action, created_at DESC);

-- Enable RLS
ALTER TABLE public.rate_limit_attempts ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role can manage rate limits (no user access needed)
CREATE POLICY "Service role can manage rate limits"
  ON public.rate_limit_attempts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Cleanup function: Remove old entries (older than 24 hours)
CREATE OR REPLACE FUNCTION public.cleanup_rate_limit_attempts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.rate_limit_attempts
  WHERE created_at < now() - interval '24 hours';
END;
$$;