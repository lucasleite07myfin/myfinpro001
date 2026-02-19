
-- =============================================
-- TABELAS PESSOAIS
-- =============================================

-- transactions
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS amount_cents BIGINT NOT NULL DEFAULT 0;

UPDATE public.transactions
  SET amount_cents = ROUND(amount * 100)
  WHERE amount_cents = 0 AND amount IS NOT NULL AND amount <> 0;

CREATE INDEX IF NOT EXISTS idx_transactions_user_date
  ON public.transactions(user_id, date DESC);

-- recurring_expenses
ALTER TABLE public.recurring_expenses
  ADD COLUMN IF NOT EXISTS amount_cents BIGINT NOT NULL DEFAULT 0;

UPDATE public.recurring_expenses
  SET amount_cents = ROUND(amount * 100)
  WHERE amount_cents = 0 AND amount IS NOT NULL AND amount <> 0;

-- goals
ALTER TABLE public.goals
  ADD COLUMN IF NOT EXISTS target_amount_cents BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_amount_cents BIGINT NOT NULL DEFAULT 0;

UPDATE public.goals SET
  target_amount_cents = ROUND(target_amount * 100),
  current_amount_cents = ROUND(COALESCE(current_amount, 0) * 100)
  WHERE target_amount_cents = 0;

-- assets
ALTER TABLE public.assets
  ADD COLUMN IF NOT EXISTS value_cents BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS acquisition_value_cents BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_price_brl_cents BIGINT NOT NULL DEFAULT 0;

UPDATE public.assets SET
  value_cents = ROUND(value * 100),
  acquisition_value_cents = ROUND(COALESCE(acquisition_value, 0) * 100),
  last_price_brl_cents = ROUND(COALESCE(last_price_brl, 0) * 100)
  WHERE value_cents = 0;

-- liabilities
ALTER TABLE public.liabilities
  ADD COLUMN IF NOT EXISTS value_cents BIGINT NOT NULL DEFAULT 0;

UPDATE public.liabilities
  SET value_cents = ROUND(value * 100)
  WHERE value_cents = 0 AND value IS NOT NULL AND value <> 0;

-- monthly_finance_data
ALTER TABLE public.monthly_finance_data
  ADD COLUMN IF NOT EXISTS income_total_cents BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS expense_total_cents BIGINT NOT NULL DEFAULT 0;

UPDATE public.monthly_finance_data SET
  income_total_cents = ROUND(COALESCE(income_total, 0) * 100),
  expense_total_cents = ROUND(COALESCE(expense_total, 0) * 100)
  WHERE income_total_cents = 0 AND expense_total_cents = 0;

-- =============================================
-- TABELAS EMPRESARIAIS (emp_*)
-- =============================================

-- emp_transactions
ALTER TABLE public.emp_transactions
  ADD COLUMN IF NOT EXISTS amount_cents BIGINT NOT NULL DEFAULT 0;

UPDATE public.emp_transactions
  SET amount_cents = ROUND(amount * 100)
  WHERE amount_cents = 0 AND amount IS NOT NULL AND amount <> 0;

CREATE INDEX IF NOT EXISTS idx_emp_transactions_user_date
  ON public.emp_transactions(user_id, date DESC);

-- emp_recurring_expenses
ALTER TABLE public.emp_recurring_expenses
  ADD COLUMN IF NOT EXISTS amount_cents BIGINT NOT NULL DEFAULT 0;

UPDATE public.emp_recurring_expenses
  SET amount_cents = ROUND(amount * 100)
  WHERE amount_cents = 0 AND amount IS NOT NULL AND amount <> 0;

-- emp_goals
ALTER TABLE public.emp_goals
  ADD COLUMN IF NOT EXISTS target_amount_cents BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_amount_cents BIGINT NOT NULL DEFAULT 0;

UPDATE public.emp_goals SET
  target_amount_cents = ROUND(target_amount * 100),
  current_amount_cents = ROUND(COALESCE(current_amount, 0) * 100)
  WHERE target_amount_cents = 0;

-- emp_assets
ALTER TABLE public.emp_assets
  ADD COLUMN IF NOT EXISTS value_cents BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS acquisition_value_cents BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_price_brl_cents BIGINT NOT NULL DEFAULT 0;

UPDATE public.emp_assets SET
  value_cents = ROUND(value * 100),
  acquisition_value_cents = ROUND(COALESCE(acquisition_value, 0) * 100),
  last_price_brl_cents = ROUND(COALESCE(last_price_brl, 0) * 100)
  WHERE value_cents = 0;

-- emp_liabilities
ALTER TABLE public.emp_liabilities
  ADD COLUMN IF NOT EXISTS value_cents BIGINT NOT NULL DEFAULT 0;

UPDATE public.emp_liabilities
  SET value_cents = ROUND(value * 100)
  WHERE value_cents = 0 AND value IS NOT NULL AND value <> 0;

-- emp_monthly_finance_data
ALTER TABLE public.emp_monthly_finance_data
  ADD COLUMN IF NOT EXISTS income_total_cents BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS expense_total_cents BIGINT NOT NULL DEFAULT 0;

UPDATE public.emp_monthly_finance_data SET
  income_total_cents = ROUND(COALESCE(income_total, 0) * 100),
  expense_total_cents = ROUND(COALESCE(expense_total, 0) * 100)
  WHERE income_total_cents = 0 AND expense_total_cents = 0;
