-- FASE 3: Tabelas com Relacionamentos

-- 9. Transactions (transações financeiras)
CREATE TABLE public.transactions (
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
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for transactions
CREATE POLICY "Users can view their own transactions" 
ON public.transactions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions" 
ON public.transactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions" 
ON public.transactions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions" 
ON public.transactions 
FOR DELETE 
USING (auth.uid() = user_id);

-- 10. Alert Rules (regras de alertas)
CREATE TABLE public.alert_rules (
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
ALTER TABLE public.alert_rules ENABLE ROW LEVEL SECURITY;

-- Create policies for alert rules
CREATE POLICY "Users can view their own alert rules" 
ON public.alert_rules 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own alert rules" 
ON public.alert_rules 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own alert rules" 
ON public.alert_rules 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own alert rules" 
ON public.alert_rules 
FOR DELETE 
USING (auth.uid() = user_id);

-- 11. Alert Logs (histórico de alertas)
CREATE TABLE public.alert_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_rule_id UUID,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  triggered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read BOOLEAN DEFAULT FALSE
);

-- Enable RLS
ALTER TABLE public.alert_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for alert logs
CREATE POLICY "Users can view their own alert logs" 
ON public.alert_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own alert logs" 
ON public.alert_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 12. User Badges (many-to-many users↔badges)
CREATE TABLE public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  badge_id UUID,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Enable RLS
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Create policies for user badges
CREATE POLICY "Users can view their own user badges" 
ON public.user_badges 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own user badges" 
ON public.user_badges 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 13. Health Snapshots (snapshots de saúde financeira)
CREATE TABLE public.health_snapshots (
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
ALTER TABLE public.health_snapshots ENABLE ROW LEVEL SECURITY;

-- Create policies for health snapshots
CREATE POLICY "Users can view their own health snapshots" 
ON public.health_snapshots 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own health snapshots" 
ON public.health_snapshots 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own health snapshots" 
ON public.health_snapshots 
FOR UPDATE 
USING (auth.uid() = user_id);

-- 14. Monthly Finance Data (cache de dados mensais)
CREATE TABLE public.monthly_finance_data (
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
ALTER TABLE public.monthly_finance_data ENABLE ROW LEVEL SECURITY;

-- Create policies for monthly finance data
CREATE POLICY "Users can view their own monthly data" 
ON public.monthly_finance_data 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own monthly data" 
ON public.monthly_finance_data 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own monthly data" 
ON public.monthly_finance_data 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create triggers for automatic timestamp updates (tabelas restantes)
CREATE TRIGGER update_transactions_updated_at
BEFORE UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_alert_rules_updated_at
BEFORE UPDATE ON public.alert_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_monthly_finance_data_updated_at
BEFORE UPDATE ON public.monthly_finance_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ÍNDICES PARA PERFORMANCE
CREATE INDEX idx_transactions_user_date ON public.transactions(user_id, date DESC);
CREATE INDEX idx_transactions_user_type ON public.transactions(user_id, type);
CREATE INDEX idx_transactions_user_month ON public.transactions(user_id, date_part('year', date), date_part('month', date));
CREATE INDEX idx_recurring_expenses_user ON public.recurring_expenses(user_id);
CREATE INDEX idx_goals_user ON public.goals(user_id);
CREATE INDEX idx_assets_user ON public.assets(user_id);
CREATE INDEX idx_alert_logs_user_unread ON public.alert_logs(user_id, read) WHERE read = FALSE;

-- Função para criar perfil automaticamente quando usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, user_id, full_name, app_mode)
  VALUES (NEW.id, NEW.id, NEW.raw_user_meta_data ->> 'full_name', 'personal');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();