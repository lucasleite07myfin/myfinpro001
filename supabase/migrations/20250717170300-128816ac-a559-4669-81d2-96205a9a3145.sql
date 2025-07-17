-- FASE 1: Tabelas Base (sem dependências)

-- 1. Profiles (substitui users - integra com Supabase Auth)
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  full_name VARCHAR(255),
  app_mode VARCHAR(20) DEFAULT 'personal', -- 'personal' ou 'business'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- 2. Badges (sistema de gamificação)
CREATE TABLE public.badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

-- Create policy for badges (everyone can view)
CREATE POLICY "Everyone can view badges" 
ON public.badges 
FOR SELECT 
USING (true);

-- 3. Custom Categories (categorias personalizadas)
CREATE TABLE public.custom_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type VARCHAR(20) NOT NULL, -- 'income' ou 'expense'
  category_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, type, category_name)
);

-- Enable RLS
ALTER TABLE public.custom_categories ENABLE ROW LEVEL SECURITY;

-- Create policies for custom categories
CREATE POLICY "Users can view their own custom categories" 
ON public.custom_categories 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own custom categories" 
ON public.custom_categories 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own custom categories" 
ON public.custom_categories 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom categories" 
ON public.custom_categories 
FOR DELETE 
USING (auth.uid() = user_id);

-- FASE 2: Tabelas de Dados Principais

-- 4. Goals (metas financeiras)
CREATE TABLE public.goals (
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
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- Create policies for goals
CREATE POLICY "Users can view their own goals" 
ON public.goals 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals" 
ON public.goals 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals" 
ON public.goals 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals" 
ON public.goals 
FOR DELETE 
USING (auth.uid() = user_id);

-- 5. Assets (patrimônio e investimentos)
CREATE TABLE public.assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL, -- 'real_estate', 'vehicle', 'crypto', 'stocks', etc.
  value DECIMAL(15,2) NOT NULL,
  evaluation_date DATE,
  acquisition_value DECIMAL(15,2),
  acquisition_date DATE,
  location VARCHAR(255),
  insured BOOLEAN DEFAULT FALSE,
  notes TEXT,
  -- Campos específicos para cripto/investimentos
  symbol VARCHAR(20), -- BTC, ETH, PETR4, etc.
  quantity DECIMAL(20,8),
  wallet VARCHAR(255),
  last_price_brl DECIMAL(15,2),
  last_updated TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- Create policies for assets
CREATE POLICY "Users can view their own assets" 
ON public.assets 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own assets" 
ON public.assets 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own assets" 
ON public.assets 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own assets" 
ON public.assets 
FOR DELETE 
USING (auth.uid() = user_id);

-- 6. Liabilities (passivos)
CREATE TABLE public.liabilities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL, -- 'loan', 'financing', 'credit_card', etc.
  value DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.liabilities ENABLE ROW LEVEL SECURITY;

-- Create policies for liabilities
CREATE POLICY "Users can view their own liabilities" 
ON public.liabilities 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own liabilities" 
ON public.liabilities 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own liabilities" 
ON public.liabilities 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own liabilities" 
ON public.liabilities 
FOR DELETE 
USING (auth.uid() = user_id);

-- 7. Suppliers (fornecedores - modo business)
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  document VARCHAR(20) NOT NULL, -- CNPJ ou CPF
  is_company BOOLEAN NOT NULL, -- true para CNPJ, false para CPF
  state_registration VARCHAR(50),
  address JSONB, -- {"street": "", "number": "", "city": "", etc.}
  phone VARCHAR(20),
  email VARCHAR(255),
  contact_person VARCHAR(255),
  product_type VARCHAR(100) NOT NULL,
  other_product_type VARCHAR(255),
  payment_terms VARCHAR(500),
  bank_info JSONB, -- {"bank": "", "agency": "", "account": ""}
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- Create policies for suppliers
CREATE POLICY "Users can view their own suppliers" 
ON public.suppliers 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own suppliers" 
ON public.suppliers 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own suppliers" 
ON public.suppliers 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own suppliers" 
ON public.suppliers 
FOR DELETE 
USING (auth.uid() = user_id);

-- 8. Recurring Expenses (despesas recorrentes)
CREATE TABLE public.recurring_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  description VARCHAR(500) NOT NULL,
  category VARCHAR(100) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  due_day INTEGER NOT NULL,
  payment_method VARCHAR(50),
  is_paid BOOLEAN DEFAULT FALSE,
  paid_months TEXT[], -- Array de strings no formato "YYYY-MM"
  repeat_months INTEGER, -- NULL = infinito
  monthly_values JSONB, -- {"2024-01": 100.50, "2024-02": 105.00}
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraint para due_day
  CONSTRAINT check_due_day CHECK (due_day >= 1 AND due_day <= 31)
);

-- Enable RLS
ALTER TABLE public.recurring_expenses ENABLE ROW LEVEL SECURITY;

-- Create policies for recurring expenses
CREATE POLICY "Users can view their own recurring expenses" 
ON public.recurring_expenses 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recurring expenses" 
ON public.recurring_expenses 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recurring expenses" 
ON public.recurring_expenses 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recurring expenses" 
ON public.recurring_expenses 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_goals_updated_at
BEFORE UPDATE ON public.goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assets_updated_at
BEFORE UPDATE ON public.assets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_liabilities_updated_at
BEFORE UPDATE ON public.liabilities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at
BEFORE UPDATE ON public.suppliers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_recurring_expenses_updated_at
BEFORE UPDATE ON public.recurring_expenses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();