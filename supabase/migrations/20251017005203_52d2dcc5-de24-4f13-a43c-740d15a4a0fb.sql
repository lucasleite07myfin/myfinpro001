-- Tabela de perfis de usuário
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabelas de finanças pessoais
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  payment_method TEXT,
  source TEXT,
  is_recurring_payment BOOLEAN DEFAULT false,
  is_goal_contribution BOOLEAN DEFAULT false,
  is_investment_contribution BOOLEAN DEFAULT false,
  goal_id UUID,
  investment_id UUID,
  recurring_expense_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE recurring_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  due_day INTEGER NOT NULL CHECK (due_day BETWEEN 1 AND 31),
  payment_method TEXT,
  repeat_months INTEGER,
  monthly_values JSONB,
  is_paid BOOLEAN DEFAULT false,
  paid_months TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  target_amount DECIMAL(15,2) NOT NULL,
  current_amount DECIMAL(15,2) DEFAULT 0,
  target_date DATE,
  saving_location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  value DECIMAL(15,2) NOT NULL,
  evaluation_date DATE,
  acquisition_value DECIMAL(15,2),
  acquisition_date DATE,
  insured BOOLEAN DEFAULT false,
  wallet TEXT,
  symbol TEXT,
  notes TEXT,
  location TEXT,
  last_updated TIMESTAMP,
  last_price_brl DECIMAL(15,2),
  quantity DECIMAL(20,8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE liabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  value DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE custom_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, name, type)
);

CREATE TABLE monthly_finance_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  month TEXT NOT NULL,
  income_total DECIMAL(15,2) DEFAULT 0,
  expense_total DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, month)
);

-- Tabelas de negócios (empresariais)
CREATE TABLE emp_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  payment_method TEXT,
  source TEXT,
  is_recurring_payment BOOLEAN DEFAULT false,
  is_goal_contribution BOOLEAN DEFAULT false,
  is_investment_contribution BOOLEAN DEFAULT false,
  goal_id UUID,
  investment_id UUID,
  recurring_expense_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE emp_recurring_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  due_day INTEGER NOT NULL CHECK (due_day BETWEEN 1 AND 31),
  payment_method TEXT,
  repeat_months INTEGER,
  monthly_values JSONB,
  is_paid BOOLEAN DEFAULT false,
  paid_months TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE emp_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  target_amount DECIMAL(15,2) NOT NULL,
  current_amount DECIMAL(15,2) DEFAULT 0,
  target_date DATE,
  saving_location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE emp_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  value DECIMAL(15,2) NOT NULL,
  evaluation_date DATE,
  acquisition_value DECIMAL(15,2),
  acquisition_date DATE,
  insured BOOLEAN DEFAULT false,
  wallet TEXT,
  symbol TEXT,
  notes TEXT,
  location TEXT,
  last_updated TIMESTAMP,
  last_price_brl DECIMAL(15,2),
  quantity DECIMAL(20,8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE emp_liabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  value DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  document TEXT,
  state_registration TEXT,
  is_company BOOLEAN DEFAULT false,
  product_type TEXT,
  other_product_type TEXT,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address JSONB,
  bank_info JSONB,
  payment_terms TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE emp_monthly_finance_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  month TEXT NOT NULL,
  income_total DECIMAL(15,2) DEFAULT 0,
  expense_total DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, month)
);

-- Índices para performance
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_recurring_expenses_user_id ON recurring_expenses(user_id);
CREATE INDEX idx_goals_user_id ON goals(user_id);
CREATE INDEX idx_assets_user_id ON assets(user_id);
CREATE INDEX idx_liabilities_user_id ON liabilities(user_id);
CREATE INDEX idx_custom_categories_user_id ON custom_categories(user_id);
CREATE INDEX idx_monthly_finance_data_user_id ON monthly_finance_data(user_id);

CREATE INDEX idx_emp_transactions_user_id ON emp_transactions(user_id);
CREATE INDEX idx_emp_transactions_date ON emp_transactions(date);
CREATE INDEX idx_emp_recurring_expenses_user_id ON emp_recurring_expenses(user_id);
CREATE INDEX idx_emp_goals_user_id ON emp_goals(user_id);
CREATE INDEX idx_emp_assets_user_id ON emp_assets(user_id);
CREATE INDEX idx_emp_liabilities_user_id ON emp_liabilities(user_id);
CREATE INDEX idx_suppliers_user_id ON suppliers(user_id);
CREATE INDEX idx_emp_monthly_finance_data_user_id ON emp_monthly_finance_data(user_id);

-- RLS: Habilitar para todas as tabelas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE liabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_finance_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE emp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE emp_recurring_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE emp_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE emp_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE emp_liabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE emp_monthly_finance_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Usuários só podem ver seus próprios dados
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions" ON transactions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own recurring_expenses" ON recurring_expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own recurring_expenses" ON recurring_expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own recurring_expenses" ON recurring_expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own recurring_expenses" ON recurring_expenses FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own goals" ON goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goals" ON goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals" ON goals FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own assets" ON assets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own assets" ON assets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own assets" ON assets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own assets" ON assets FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own liabilities" ON liabilities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own liabilities" ON liabilities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own liabilities" ON liabilities FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own liabilities" ON liabilities FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own custom_categories" ON custom_categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own custom_categories" ON custom_categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own custom_categories" ON custom_categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own custom_categories" ON custom_categories FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own monthly_finance_data" ON monthly_finance_data FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own monthly_finance_data" ON monthly_finance_data FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own monthly_finance_data" ON monthly_finance_data FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own monthly_finance_data" ON monthly_finance_data FOR DELETE USING (auth.uid() = user_id);

-- Políticas para tabelas empresariais
CREATE POLICY "Users can view own emp_transactions" ON emp_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own emp_transactions" ON emp_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own emp_transactions" ON emp_transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own emp_transactions" ON emp_transactions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own emp_recurring_expenses" ON emp_recurring_expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own emp_recurring_expenses" ON emp_recurring_expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own emp_recurring_expenses" ON emp_recurring_expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own emp_recurring_expenses" ON emp_recurring_expenses FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own emp_goals" ON emp_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own emp_goals" ON emp_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own emp_goals" ON emp_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own emp_goals" ON emp_goals FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own emp_assets" ON emp_assets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own emp_assets" ON emp_assets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own emp_assets" ON emp_assets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own emp_assets" ON emp_assets FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own emp_liabilities" ON emp_liabilities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own emp_liabilities" ON emp_liabilities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own emp_liabilities" ON emp_liabilities FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own emp_liabilities" ON emp_liabilities FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own suppliers" ON suppliers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own suppliers" ON suppliers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own suppliers" ON suppliers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own suppliers" ON suppliers FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own emp_monthly_finance_data" ON emp_monthly_finance_data FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own emp_monthly_finance_data" ON emp_monthly_finance_data FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own emp_monthly_finance_data" ON emp_monthly_finance_data FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own emp_monthly_finance_data" ON emp_monthly_finance_data FOR DELETE USING (auth.uid() = user_id);

-- Trigger para criar profile automaticamente ao criar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();