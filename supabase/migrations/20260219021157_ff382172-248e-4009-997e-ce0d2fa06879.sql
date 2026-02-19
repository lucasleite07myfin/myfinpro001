
-- Fix permissive RLS on rate_limit_attempts
DROP POLICY IF EXISTS "Service role can manage rate limits" ON public.rate_limit_attempts;
CREATE POLICY "No direct access to rate limits" ON public.rate_limit_attempts FOR ALL USING (false);

-- Fix permissive RLS on subscriptions (keep user SELECT, block direct writes)
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON public.subscriptions;
CREATE POLICY "No direct insert on subscriptions" ON public.subscriptions FOR INSERT WITH CHECK (false);
CREATE POLICY "No direct update on subscriptions" ON public.subscriptions FOR UPDATE USING (false);
CREATE POLICY "No direct delete on subscriptions" ON public.subscriptions FOR DELETE USING (false);
