-- Atualizar dias de notificação para 1
UPDATE profiles
SET notification_days_before = 1, updated_at = now()
WHERE id = 'f87f6d94-4185-462a-b07a-c2527be0a296';

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Criar o cron job para rodar diariamente às 9h (horário de Brasília = 12h UTC)
SELECT cron.schedule(
  'daily-recurring-expenses-check',
  '0 12 * * *',
  $$
  SELECT net.http_post(
    url := 'https://uxomcgymjlcfgboilndn.supabase.co/functions/v1/check-recurring-expenses',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4b21jZ3ltamxjZmdib2lsbmRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1OTk2ODgsImV4cCI6MjA3NjE3NTY4OH0.rzkXJr6g9s9-xJHDUtRMwWIqEg6m7MVWJbxBuPW_pn4"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
  $$
);