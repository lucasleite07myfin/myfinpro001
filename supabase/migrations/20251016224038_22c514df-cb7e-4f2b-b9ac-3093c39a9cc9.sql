-- PARTE 1: Remover política RLS duplicada/conflitante da tabela goals
-- Isso corrige o bug de exclusão de metas
DROP POLICY IF EXISTS "Users can see their own goals based on app mode" ON public.goals;

-- PARTE 2: Proteger tabela users (SEGURANÇA CRÍTICA)
-- Bloquear inserção manual (usar apenas Supabase Auth)
CREATE POLICY "Prevent manual user insertion" ON public.users 
FOR INSERT WITH CHECK (false);

-- Permitir apenas atualização do próprio perfil
CREATE POLICY "Users can update own data" ON public.users 
FOR UPDATE USING (auth.uid() = id);

-- Bloquear exclusão manual
CREATE POLICY "Prevent user deletion" ON public.users 
FOR DELETE USING (false);

-- PARTE 3: Remover políticas RLS duplicadas de todas as tabelas
-- Isso melhora performance e mantém apenas uma política por ação

-- Transactions
DROP POLICY IF EXISTS "Users can see their own transactions based on app mode" ON public.transactions;

-- Recurring expenses
DROP POLICY IF EXISTS "Users can see their own recurring expenses based on app mode" ON public.recurring_expenses;

-- Assets
DROP POLICY IF EXISTS "Users can see their own assets based on app mode" ON public.assets;

-- Liabilities
DROP POLICY IF EXISTS "Users can see their own liabilities." ON public.liabilities;

-- Health snapshots
DROP POLICY IF EXISTS "Users can see their own health snapshots." ON public.health_snapshots;

-- Custom categories
DROP POLICY IF EXISTS "Users can see their own custom categories." ON public.custom_categories;

-- Alert rules
DROP POLICY IF EXISTS "Users can see their own alert rules." ON public.alert_rules;

-- Alert logs
DROP POLICY IF EXISTS "Users can see their own alert logs." ON public.alert_logs;

-- Monthly finance data
DROP POLICY IF EXISTS "Users can see their own monthly finance data." ON public.monthly_finance_data;

-- Badges
DROP POLICY IF EXISTS "Badges are public." ON public.badges;

-- Suppliers
DROP POLICY IF EXISTS "Users can see their own suppliers." ON public.suppliers;

-- User badges
DROP POLICY IF EXISTS "Users can see their own badges." ON public.user_badges;