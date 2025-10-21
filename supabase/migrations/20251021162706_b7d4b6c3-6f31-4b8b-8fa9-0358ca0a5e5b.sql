-- Adicionar campo de limite de gastos na tabela profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS monthly_spending_limit numeric DEFAULT 5000;