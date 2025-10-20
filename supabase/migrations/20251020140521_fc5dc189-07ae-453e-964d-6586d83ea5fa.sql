-- FASE 1: Adicionar suporte a lembretes WhatsApp

-- 1.1: Adicionar colunas de configuração WhatsApp na tabela recurring_expenses (Personal)
ALTER TABLE public.recurring_expenses 
  ADD COLUMN IF NOT EXISTS whatsapp_reminder_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS whatsapp_phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS reminder_days_before INTEGER,
  ADD COLUMN IF NOT EXISTS reminder_hours_before INTEGER;

-- 1.2: Adicionar colunas de configuração WhatsApp na tabela emp_recurring_expenses (Business)
ALTER TABLE public.emp_recurring_expenses 
  ADD COLUMN IF NOT EXISTS whatsapp_reminder_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS whatsapp_phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS reminder_days_before INTEGER,
  ADD COLUMN IF NOT EXISTS reminder_hours_before INTEGER;

-- 1.3: Criar tabela para log de notificações WhatsApp
CREATE TABLE IF NOT EXISTS public.whatsapp_notifications_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recurring_expense_id UUID NOT NULL,
  expense_type VARCHAR(20) NOT NULL CHECK (expense_type IN ('personal', 'business')),
  phone_number VARCHAR(20) NOT NULL,
  message_content TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending')),
  error_message TEXT,
  whatsapp_message_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.4: Ativar RLS na tabela de logs
ALTER TABLE public.whatsapp_notifications_log ENABLE ROW LEVEL SECURITY;

-- 1.5: Criar política RLS para usuários visualizarem apenas seus próprios logs
CREATE POLICY "Users can view own notifications"
  ON public.whatsapp_notifications_log 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- 1.6: Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_log_user_id ON public.whatsapp_notifications_log(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_log_expense_id ON public.whatsapp_notifications_log(recurring_expense_id);
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_whatsapp_enabled ON public.recurring_expenses(whatsapp_reminder_enabled) WHERE whatsapp_reminder_enabled = true;
CREATE INDEX IF NOT EXISTS idx_emp_recurring_expenses_whatsapp_enabled ON public.emp_recurring_expenses(whatsapp_reminder_enabled) WHERE whatsapp_reminder_enabled = true;