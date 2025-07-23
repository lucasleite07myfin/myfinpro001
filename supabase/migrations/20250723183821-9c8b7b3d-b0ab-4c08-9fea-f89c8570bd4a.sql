-- Criar tabelas específicas para modo empresarial com prefixo emp_

-- 1. emp_transactions
CREATE TABLE public.emp_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  description VARCHAR(500) NOT NULL,
  category VARCHAR(100) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  type VARCHAR(20) NOT NULL, -- 'income' ou 'expense'
  payment_method VARCHAR(50), -- 'cash', 'credit_card', 'debit_card', 'bank_transfer', 'pix', 'other'
  is_recurring_payment BOOLEAN DEFAULT FALSE,
  recurring_expense_id UUID,
  is_goal_contribution BOOLEAN DEFAULT FALSE,
  goal_id UUID,
  is_investment_contribution BOOLEAN DEFAULT FALSE,
  investment_id UUID,
  source VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.emp_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for emp_transactions
CREATE POLICY "Users can view their own emp_transactions" 
ON public.emp_transactions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own emp_transactions" 
ON public.emp_transactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own emp_transactions" 
ON public.emp_transactions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own emp_transactions" 
ON public.emp_transactions 
FOR DELETE 
USING (auth.uid() = user_id);

-- 2. emp_recurring_expenses
CREATE TABLE public.emp_recurring_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  description VARCHAR(500) NOT NULL,
  category VARCHAR(100) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  due_day INTEGER NOT NULL,
  payment_method VARCHAR(50),
  is_paid BOOLEAN DEFAULT FALSE,
  paid_months TEXT[],
  repeat_months INTEGER,
  monthly_values JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_due_day CHECK (due_day >= 1 AND due_day <= 31)
);

-- Enable RLS
ALTER TABLE public.emp_recurring_expenses ENABLE ROW LEVEL SECURITY;

-- Create policies for emp_recurring_expenses
CREATE POLICY "Users can view their own emp_recurring_expenses" 
ON public.emp_recurring_expenses 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own emp_recurring_expenses" 
ON public.emp_recurring_expenses 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own emp_recurring_expenses" 
ON public.emp_recurring_expenses 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own emp_recurring_expenses" 
ON public.emp_recurring_expenses 
FOR DELETE 
USING (auth.uid() = user_id);

-- 3. emp_goals
CREATE TABLE public.emp_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  target_amount DECIMAL(15,2) NOT NULL,
  current_amount DECIMAL(15,2) DEFAULT 0,
  target_date DATE NOT NULL,
  saving_location VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.emp_goals ENABLE ROW LEVEL SECURITY;

-- Create policies for emp_goals
CREATE POLICY "Users can view their own emp_goals" 
ON public.emp_goals 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own emp_goals" 
ON public.emp_goals 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own emp_goals" 
ON public.emp_goals 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own emp_goals" 
ON public.emp_goals 
FOR DELETE 
USING (auth.uid() = user_id);

-- 4. emp_assets
CREATE TABLE public.emp_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  value DECIMAL(15,2) NOT NULL,
  evaluation_date DATE,
  acquisition_value DECIMAL(15,2),
  acquisition_date DATE,
  location VARCHAR(255),
  insured BOOLEAN DEFAULT FALSE,
  notes TEXT,
  symbol VARCHAR(50),
  quantity DECIMAL(15,8),
  wallet VARCHAR(255),
  last_price_brl DECIMAL(15,2),
  last_updated TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.emp_assets ENABLE ROW LEVEL SECURITY;

-- Create policies for emp_assets
CREATE POLICY "Users can view their own emp_assets" 
ON public.emp_assets 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own emp_assets" 
ON public.emp_assets 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own emp_assets" 
ON public.emp_assets 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own emp_assets" 
ON public.emp_assets 
FOR DELETE 
USING (auth.uid() = user_id);

-- 5. emp_liabilities
CREATE TABLE public.emp_liabilities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  value DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.emp_liabilities ENABLE ROW LEVEL SECURITY;

-- Create policies for emp_liabilities
CREATE POLICY "Users can view their own emp_liabilities" 
ON public.emp_liabilities 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own emp_liabilities" 
ON public.emp_liabilities 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own emp_liabilities" 
ON public.emp_liabilities 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own emp_liabilities" 
ON public.emp_liabilities 
FOR DELETE 
USING (auth.uid() = user_id);

-- 6. emp_custom_categories
CREATE TABLE public.emp_custom_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'income' ou 'expense'
  category_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.emp_custom_categories ENABLE ROW LEVEL SECURITY;

-- Create policies for emp_custom_categories
CREATE POLICY "Users can view their own emp_custom_categories" 
ON public.emp_custom_categories 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own emp_custom_categories" 
ON public.emp_custom_categories 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own emp_custom_categories" 
ON public.emp_custom_categories 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own emp_custom_categories" 
ON public.emp_custom_categories 
FOR DELETE 
USING (auth.uid() = user_id);

-- 7. emp_monthly_finance_data
CREATE TABLE public.emp_monthly_finance_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  month VARCHAR(7) NOT NULL, -- formato "YYYY-MM"
  income_total DECIMAL(15,2) DEFAULT 0,
  expense_total DECIMAL(15,2) DEFAULT 0,
  balance DECIMAL(15,2) DEFAULT 0,
  savings_rate DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, month)
);

-- Enable RLS
ALTER TABLE public.emp_monthly_finance_data ENABLE ROW LEVEL SECURITY;

-- Create policies for emp_monthly_finance_data
CREATE POLICY "Users can view their own emp_monthly_data" 
ON public.emp_monthly_finance_data 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own emp_monthly_data" 
ON public.emp_monthly_finance_data 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own emp_monthly_data" 
ON public.emp_monthly_finance_data 
FOR UPDATE 
USING (auth.uid() = user_id);

-- 8. emp_alert_rules
CREATE TABLE public.emp_alert_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  rule_type VARCHAR(50) NOT NULL, -- 'overspend', 'low_balance', 'unusual_tx', 'bill_due'
  category_id VARCHAR(100), -- categoria da transação
  account_id UUID, -- pode referenciar assets no futuro
  threshold_value DECIMAL(15,2),
  threshold_percent DECIMAL(5,2),
  days_before_due INTEGER,
  notification_channel TEXT[], -- ['email', 'push', 'sms']
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.emp_alert_rules ENABLE ROW LEVEL SECURITY;

-- Create policies for emp_alert_rules
CREATE POLICY "Users can view their own emp_alert_rules" 
ON public.emp_alert_rules 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own emp_alert_rules" 
ON public.emp_alert_rules 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own emp_alert_rules" 
ON public.emp_alert_rules 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own emp_alert_rules" 
ON public.emp_alert_rules 
FOR DELETE 
USING (auth.uid() = user_id);

-- 9. emp_alert_logs
CREATE TABLE public.emp_alert_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_rule_id UUID,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  triggered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read BOOLEAN DEFAULT FALSE
);

-- Enable RLS
ALTER TABLE public.emp_alert_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for emp_alert_logs
CREATE POLICY "Users can view their own emp_alert_logs" 
ON public.emp_alert_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own emp_alert_logs" 
ON public.emp_alert_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 10. emp_health_snapshots
CREATE TABLE public.emp_health_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  snapshot_date DATE NOT NULL,
  savings_rate_pct DECIMAL(5,2), -- taxa de poupança %
  debt_income_pct DECIMAL(5,2), -- dívida/renda %
  months_emergency_fund DECIMAL(5,2), -- meses de reserva
  net_worth_growth_12m DECIMAL(5,2), -- crescimento patrimônio 12m %
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, snapshot_date)
);

-- Enable RLS
ALTER TABLE public.emp_health_snapshots ENABLE ROW LEVEL SECURITY;

-- Create policies for emp_health_snapshots
CREATE POLICY "Users can view their own emp_health_snapshots" 
ON public.emp_health_snapshots 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own emp_health_snapshots" 
ON public.emp_health_snapshots 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own emp_health_snapshots" 
ON public.emp_health_snapshots 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_emp_transactions_updated_at
BEFORE UPDATE ON public.emp_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_emp_recurring_expenses_updated_at
BEFORE UPDATE ON public.emp_recurring_expenses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_emp_goals_updated_at
BEFORE UPDATE ON public.emp_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_emp_assets_updated_at
BEFORE UPDATE ON public.emp_assets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_emp_liabilities_updated_at
BEFORE UPDATE ON public.emp_liabilities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_emp_monthly_finance_data_updated_at
BEFORE UPDATE ON public.emp_monthly_finance_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_emp_alert_rules_updated_at
BEFORE UPDATE ON public.emp_alert_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ÍNDICES PARA PERFORMANCE
CREATE INDEX idx_emp_transactions_user_date ON public.emp_transactions(user_id, date DESC);
CREATE INDEX idx_emp_transactions_user_type ON public.emp_transactions(user_id, type);
CREATE INDEX idx_emp_transactions_user_month ON public.emp_transactions(user_id, date_part('year', date), date_part('month', date));
CREATE INDEX idx_emp_recurring_expenses_user ON public.emp_recurring_expenses(user_id);
CREATE INDEX idx_emp_goals_user ON public.emp_goals(user_id);
CREATE INDEX idx_emp_assets_user ON public.emp_assets(user_id);
CREATE INDEX idx_emp_alert_logs_user_unread ON public.emp_alert_logs(user_id, read) WHERE read = FALSE;

-- Migrar dados existentes do modo business para as novas tabelas
INSERT INTO public.emp_transactions (user_id, date, description, category, amount, type, payment_method, is_recurring_payment, recurring_expense_id, is_goal_contribution, goal_id, is_investment_contribution, investment_id, source, created_at, updated_at)
SELECT user_id, date, description, category, amount, type, payment_method, is_recurring_payment, recurring_expense_id, is_goal_contribution, goal_id, is_investment_contribution, investment_id, source, created_at, updated_at
FROM public.transactions 
WHERE app_mode = 'business';

INSERT INTO public.emp_recurring_expenses (user_id, description, category, amount, due_day, payment_method, is_paid, paid_months, repeat_months, monthly_values, created_at, updated_at)
SELECT user_id, description, category, amount, due_day, payment_method, is_paid, paid_months, repeat_months, monthly_values, created_at, updated_at
FROM public.recurring_expenses 
WHERE app_mode = 'business';

INSERT INTO public.emp_goals (user_id, name, target_amount, current_amount, target_date, saving_location, created_at, updated_at)
SELECT user_id, name, target_amount, current_amount, target_date, saving_location, created_at, updated_at
FROM public.goals 
WHERE app_mode = 'business';

INSERT INTO public.emp_assets (user_id, name, type, value, evaluation_date, acquisition_value, acquisition_date, location, insured, notes, symbol, quantity, wallet, last_price_brl, last_updated, created_at, updated_at)
SELECT user_id, name, type, value, evaluation_date, acquisition_value, acquisition_date, location, insured, notes, symbol, quantity, wallet, last_price_brl, last_updated, created_at, updated_at
FROM public.assets 
WHERE app_mode = 'business';

INSERT INTO public.emp_liabilities (user_id, name, type, value, created_at, updated_at)
SELECT user_id, name, type, value, created_at, updated_at
FROM public.liabilities 
WHERE app_mode = 'business';

INSERT INTO public.emp_custom_categories (user_id, type, category_name, created_at)
SELECT user_id, type, category_name, created_at
FROM public.custom_categories 
WHERE app_mode = 'business';

INSERT INTO public.emp_monthly_finance_data (user_id, month, income_total, expense_total, balance, savings_rate, created_at, updated_at)
SELECT user_id, month, income_total, expense_total, balance, savings_rate, created_at, updated_at
FROM public.monthly_finance_data 
WHERE app_mode = 'business';

INSERT INTO public.emp_alert_rules (user_id, name, rule_type, category_id, account_id, threshold_value, threshold_percent, days_before_due, notification_channel, is_active, created_at, updated_at)
SELECT user_id, name, rule_type, category_id, account_id, threshold_value, threshold_percent, days_before_due, notification_channel, is_active, created_at, updated_at
FROM public.alert_rules 
WHERE app_mode = 'business';

INSERT INTO public.emp_alert_logs (alert_rule_id, user_id, message, triggered_at, read)
SELECT alert_rule_id, user_id, message, triggered_at, read
FROM public.alert_logs 
WHERE app_mode = 'business';

INSERT INTO public.emp_health_snapshots (user_id, snapshot_date, savings_rate_pct, debt_income_pct, months_emergency_fund, net_worth_growth_12m, created_at)
SELECT user_id, snapshot_date, savings_rate_pct, debt_income_pct, months_emergency_fund, net_worth_growth_12m, created_at
FROM public.health_snapshots 
WHERE app_mode = 'business';

-- Limpar dados do modo business das tabelas originais
DELETE FROM public.transactions WHERE app_mode = 'business';
DELETE FROM public.recurring_expenses WHERE app_mode = 'business';
DELETE FROM public.goals WHERE app_mode = 'business';
DELETE FROM public.assets WHERE app_mode = 'business';
DELETE FROM public.liabilities WHERE app_mode = 'business';
DELETE FROM public.custom_categories WHERE app_mode = 'business';
DELETE FROM public.monthly_finance_data WHERE app_mode = 'business';
DELETE FROM public.alert_rules WHERE app_mode = 'business';
DELETE FROM public.alert_logs WHERE app_mode = 'business';
DELETE FROM public.health_snapshots WHERE app_mode = 'business';