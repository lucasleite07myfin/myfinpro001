-- Add n8n webhook configuration fields to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS n8n_webhook_url TEXT,
ADD COLUMN IF NOT EXISTS notification_days_before INTEGER DEFAULT 3;

COMMENT ON COLUMN profiles.n8n_webhook_url IS 'n8n webhook URL for recurring expense notifications';
COMMENT ON COLUMN profiles.notification_days_before IS 'Number of days before due date to send notification';

-- Create index for faster lookups of profiles with webhooks configured
CREATE INDEX IF NOT EXISTS idx_profiles_webhook ON profiles(n8n_webhook_url) WHERE n8n_webhook_url IS NOT NULL;

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule daily check at 9 AM
SELECT cron.schedule(
  'daily-recurring-expenses-check',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := 'https://uxomcgymjlcfgboilndn.supabase.co/functions/v1/check-recurring-expenses',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4b21jZ3ltamxjZmdib2lsbmRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1OTk2ODgsImV4cCI6MjA3NjE3NTY4OH0.rzkXJr6g9s9-xJHDUtRMwWIqEg6m7MVWJbxBuPW_pn4'
    )
  ) AS request_id;
  $$
);