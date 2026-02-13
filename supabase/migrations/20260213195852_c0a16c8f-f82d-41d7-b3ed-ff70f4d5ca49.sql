
-- Create a function to automatically clean up expired pin reset tokens
CREATE OR REPLACE FUNCTION public.cleanup_expired_pin_reset_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.pin_reset_tokens
  WHERE expires_at < now() OR used = true;
END;
$$;

-- Add an index on expires_at for efficient cleanup queries
CREATE INDEX IF NOT EXISTS idx_pin_reset_tokens_expires_at ON public.pin_reset_tokens(expires_at);

-- Add an index on token for efficient lookups
CREATE INDEX IF NOT EXISTS idx_pin_reset_tokens_token ON public.pin_reset_tokens(token);

-- Replace the overly permissive RLS policy with more restrictive ones
DROP POLICY IF EXISTS "Service role can manage tokens" ON public.pin_reset_tokens;

-- Only allow authenticated users to see their own tokens (for status checks)
CREATE POLICY "Users can view own reset tokens"
ON public.pin_reset_tokens
FOR SELECT
USING (auth.uid() = user_id);

-- Service role INSERT policy (used by edge function with service role key)
-- Edge functions using SUPABASE_SERVICE_ROLE_KEY bypass RLS, so this policy
-- ensures that even if accessed via anon key, tokens can't be inserted
CREATE POLICY "No direct insert for anon users"
ON public.pin_reset_tokens
FOR INSERT
WITH CHECK (false);

-- No direct update/delete for regular users
CREATE POLICY "No direct update for anon users"
ON public.pin_reset_tokens
FOR UPDATE
USING (false);

CREATE POLICY "No direct delete for anon users"
ON public.pin_reset_tokens
FOR DELETE
USING (false);
