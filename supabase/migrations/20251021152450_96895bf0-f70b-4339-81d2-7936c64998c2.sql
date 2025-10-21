-- Atualizar URL do webhook para o endpoint correto
UPDATE profiles
SET n8n_webhook_url = 'https://n8n-marcus.up.railway.app/webhook-test/7435cffa-1710-4f39-aeab-c4c3384c65eb',
    updated_at = now()
WHERE id = 'f87f6d94-4185-462a-b07a-c2527be0a296';