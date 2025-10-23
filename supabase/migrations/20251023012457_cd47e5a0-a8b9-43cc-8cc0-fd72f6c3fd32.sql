-- Fix search_path for cleanup_rate_limit_attempts function
DROP FUNCTION IF EXISTS public.cleanup_rate_limit_attempts();

CREATE OR REPLACE FUNCTION public.cleanup_rate_limit_attempts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.rate_limit_attempts
  WHERE created_at < now() - interval '24 hours';
END;
$$;