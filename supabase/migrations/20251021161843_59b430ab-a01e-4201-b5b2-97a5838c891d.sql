-- Atualizar webhook URL para produção
UPDATE profiles
SET n8n_webhook_url = 'https://lucasleite07.app.n8n.cloud/webhook/7435cffa-1710-4f39-aeab-c4c3384c65eb',
    updated_at = now()
WHERE id = 'f87f6d94-4185-462a-b07a-c2527be0a296';