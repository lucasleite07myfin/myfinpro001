-- Criar tabelas para snapshots de saúde financeira
CREATE TABLE IF NOT EXISTS public.health_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  
  -- Indicadores calculados
  savings_rate_pct NUMERIC(5,2), -- Taxa de poupança em %
  debt_income_pct NUMERIC(5,2),  -- Índice de endividamento em %
  months_emergency_fund NUMERIC(6,2), -- Meses de reserva de emergência
  net_worth_growth_12m NUMERIC(6,2), -- Crescimento patrimonial 12 meses em %
  
  -- Dados auxiliares para cálculo
  total_income NUMERIC(12,2),
  total_expense NUMERIC(12,2),
  total_debt NUMERIC(12,2),
  total_assets NUMERIC(12,2),
  emergency_fund NUMERIC(12,2),
  avg_monthly_expense NUMERIC(12,2),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, snapshot_date)
);

-- Index para performance
CREATE INDEX IF NOT EXISTS idx_health_snapshots_user_date ON public.health_snapshots(user_id, snapshot_date DESC);

-- Habilitar RLS
ALTER TABLE public.health_snapshots ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para health_snapshots
CREATE POLICY "Users can view own health_snapshots"
  ON public.health_snapshots FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own health_snapshots"
  ON public.health_snapshots FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own health_snapshots"
  ON public.health_snapshots FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own health_snapshots"
  ON public.health_snapshots FOR DELETE
  USING (auth.uid() = user_id);

-- Criar tabela para modo empresa
CREATE TABLE IF NOT EXISTS public.emp_health_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  
  -- Indicadores calculados
  savings_rate_pct NUMERIC(5,2),
  debt_income_pct NUMERIC(5,2),
  months_emergency_fund NUMERIC(6,2),
  net_worth_growth_12m NUMERIC(6,2),
  
  -- Dados auxiliares
  total_income NUMERIC(12,2),
  total_expense NUMERIC(12,2),
  total_debt NUMERIC(12,2),
  total_assets NUMERIC(12,2),
  emergency_fund NUMERIC(12,2),
  avg_monthly_expense NUMERIC(12,2),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, snapshot_date)
);

-- Index para performance
CREATE INDEX IF NOT EXISTS idx_emp_health_snapshots_user_date ON public.emp_health_snapshots(user_id, snapshot_date DESC);

-- Habilitar RLS
ALTER TABLE public.emp_health_snapshots ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para emp_health_snapshots
CREATE POLICY "Users can view own emp_health_snapshots"
  ON public.emp_health_snapshots FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own emp_health_snapshots"
  ON public.emp_health_snapshots FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own emp_health_snapshots"
  ON public.emp_health_snapshots FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own emp_health_snapshots"
  ON public.emp_health_snapshots FOR DELETE
  USING (auth.uid() = user_id);

-- Ativar extensões para cron job (se ainda não estiverem ativas)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;