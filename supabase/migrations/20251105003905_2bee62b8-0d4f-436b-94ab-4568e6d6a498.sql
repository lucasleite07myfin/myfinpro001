-- Tabela para armazenar tokens de reset de PIN
CREATE TABLE IF NOT EXISTS public.pin_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_pin_reset_tokens_user_id ON public.pin_reset_tokens(user_id);
CREATE INDEX idx_pin_reset_tokens_token ON public.pin_reset_tokens(token);
CREATE INDEX idx_pin_reset_tokens_expires_at ON public.pin_reset_tokens(expires_at);

-- RLS Policies
ALTER TABLE public.pin_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Apenas o sistema pode gerenciar tokens (via service role)
CREATE POLICY "Service role can manage tokens"
  ON public.pin_reset_tokens
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);