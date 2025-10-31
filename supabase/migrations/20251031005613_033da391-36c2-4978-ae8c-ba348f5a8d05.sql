-- FASE 1: Criar estrutura de dados para sub-acessos empresariais

-- Enum para tipos de acesso
CREATE TYPE public.business_access_type AS ENUM ('owner', 'employee');

-- Tabela principal de sub-acessos
CREATE TABLE public.business_sub_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sub_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_type public.business_access_type NOT NULL DEFAULT 'employee',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Permissões granulares
  can_view_transactions BOOLEAN DEFAULT TRUE,
  can_create_transactions BOOLEAN DEFAULT TRUE,
  can_edit_transactions BOOLEAN DEFAULT FALSE,
  can_delete_transactions BOOLEAN DEFAULT FALSE,
  can_view_investments BOOLEAN DEFAULT TRUE,
  can_manage_investments BOOLEAN DEFAULT FALSE,
  can_view_suppliers BOOLEAN DEFAULT TRUE,
  can_manage_suppliers BOOLEAN DEFAULT FALSE,
  can_view_dre BOOLEAN DEFAULT TRUE,
  can_view_cashflow BOOLEAN DEFAULT TRUE,
  
  UNIQUE(owner_id, sub_user_id)
);

-- Tabela de convites temporários
CREATE TABLE public.business_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  permissions JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.business_sub_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_invites ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para business_sub_accounts
CREATE POLICY "Owners can view their sub accounts"
ON public.business_sub_accounts FOR SELECT
USING (auth.uid() = owner_id);

CREATE POLICY "Employees can view own access"
ON public.business_sub_accounts FOR SELECT
USING (auth.uid() = sub_user_id);

CREATE POLICY "Owners can manage sub accounts"
ON public.business_sub_accounts FOR ALL
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- Políticas RLS para business_invites
CREATE POLICY "Owners can view their invites"
ON public.business_invites FOR SELECT
USING (auth.uid() = owner_id);

CREATE POLICY "Owners can manage invites"
ON public.business_invites FOR ALL
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- Funções helper de segurança
CREATE OR REPLACE FUNCTION public.is_business_sub_account(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.business_sub_accounts
    WHERE sub_user_id = _user_id 
    AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.get_business_owner_id(_sub_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT owner_id 
  FROM public.business_sub_accounts
  WHERE sub_user_id = _sub_user_id 
  AND is_active = true
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.has_business_permission(
  _user_id UUID, 
  _permission TEXT
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT 
      CASE _permission
        WHEN 'can_view_transactions' THEN can_view_transactions
        WHEN 'can_create_transactions' THEN can_create_transactions
        WHEN 'can_edit_transactions' THEN can_edit_transactions
        WHEN 'can_delete_transactions' THEN can_delete_transactions
        WHEN 'can_view_investments' THEN can_view_investments
        WHEN 'can_manage_investments' THEN can_manage_investments
        WHEN 'can_view_suppliers' THEN can_view_suppliers
        WHEN 'can_manage_suppliers' THEN can_manage_suppliers
        WHEN 'can_view_dre' THEN can_view_dre
        WHEN 'can_view_cashflow' THEN can_view_cashflow
        ELSE FALSE
      END
    FROM public.business_sub_accounts
    WHERE sub_user_id = _user_id 
    AND is_active = true
    LIMIT 1),
    FALSE
  );
$$;

-- Atualizar políticas RLS das tabelas emp_transactions
DROP POLICY IF EXISTS "Users can view own emp_transactions" ON public.emp_transactions;
CREATE POLICY "Users and sub-accounts can view emp_transactions"
ON public.emp_transactions FOR SELECT
USING (
  auth.uid() = user_id 
  OR 
  (
    public.is_business_sub_account(auth.uid()) 
    AND public.get_business_owner_id(auth.uid()) = user_id
    AND public.has_business_permission(auth.uid(), 'can_view_transactions')
  )
);

DROP POLICY IF EXISTS "Users can insert own emp_transactions" ON public.emp_transactions;
CREATE POLICY "Users and authorized sub-accounts can insert emp_transactions"
ON public.emp_transactions FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  OR 
  (
    public.is_business_sub_account(auth.uid()) 
    AND public.get_business_owner_id(auth.uid()) = user_id
    AND public.has_business_permission(auth.uid(), 'can_create_transactions')
  )
);

DROP POLICY IF EXISTS "Users can update own emp_transactions" ON public.emp_transactions;
CREATE POLICY "Users and authorized sub-accounts can update emp_transactions"
ON public.emp_transactions FOR UPDATE
USING (
  auth.uid() = user_id 
  OR 
  (
    public.is_business_sub_account(auth.uid()) 
    AND public.get_business_owner_id(auth.uid()) = user_id
    AND public.has_business_permission(auth.uid(), 'can_edit_transactions')
  )
);

DROP POLICY IF EXISTS "Users can delete own emp_transactions" ON public.emp_transactions;
CREATE POLICY "Users and authorized sub-accounts can delete emp_transactions"
ON public.emp_transactions FOR DELETE
USING (
  auth.uid() = user_id 
  OR 
  (
    public.is_business_sub_account(auth.uid()) 
    AND public.get_business_owner_id(auth.uid()) = user_id
    AND public.has_business_permission(auth.uid(), 'can_delete_transactions')
  )
);

-- Atualizar políticas RLS das tabelas emp_assets
DROP POLICY IF EXISTS "Users can view own emp_assets" ON public.emp_assets;
CREATE POLICY "Users and sub-accounts can view emp_assets"
ON public.emp_assets FOR SELECT
USING (
  auth.uid() = user_id 
  OR 
  (
    public.is_business_sub_account(auth.uid()) 
    AND public.get_business_owner_id(auth.uid()) = user_id
    AND public.has_business_permission(auth.uid(), 'can_view_investments')
  )
);

DROP POLICY IF EXISTS "Users can insert own emp_assets" ON public.emp_assets;
CREATE POLICY "Users and authorized sub-accounts can insert emp_assets"
ON public.emp_assets FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  OR 
  (
    public.is_business_sub_account(auth.uid()) 
    AND public.get_business_owner_id(auth.uid()) = user_id
    AND public.has_business_permission(auth.uid(), 'can_manage_investments')
  )
);

DROP POLICY IF EXISTS "Users can update own emp_assets" ON public.emp_assets;
CREATE POLICY "Users and authorized sub-accounts can update emp_assets"
ON public.emp_assets FOR UPDATE
USING (
  auth.uid() = user_id 
  OR 
  (
    public.is_business_sub_account(auth.uid()) 
    AND public.get_business_owner_id(auth.uid()) = user_id
    AND public.has_business_permission(auth.uid(), 'can_manage_investments')
  )
);

DROP POLICY IF EXISTS "Users can delete own emp_assets" ON public.emp_assets;
CREATE POLICY "Users and authorized sub-accounts can delete emp_assets"
ON public.emp_assets FOR DELETE
USING (
  auth.uid() = user_id 
  OR 
  (
    public.is_business_sub_account(auth.uid()) 
    AND public.get_business_owner_id(auth.uid()) = user_id
    AND public.has_business_permission(auth.uid(), 'can_manage_investments')
  )
);

-- Atualizar políticas RLS das tabelas suppliers
DROP POLICY IF EXISTS "Users can view own suppliers" ON public.suppliers;
CREATE POLICY "Users and sub-accounts can view suppliers"
ON public.suppliers FOR SELECT
USING (
  auth.uid() = user_id 
  OR 
  (
    public.is_business_sub_account(auth.uid()) 
    AND public.get_business_owner_id(auth.uid()) = user_id
    AND public.has_business_permission(auth.uid(), 'can_view_suppliers')
  )
);

DROP POLICY IF EXISTS "Users can insert own suppliers" ON public.suppliers;
CREATE POLICY "Users and authorized sub-accounts can insert suppliers"
ON public.suppliers FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  OR 
  (
    public.is_business_sub_account(auth.uid()) 
    AND public.get_business_owner_id(auth.uid()) = user_id
    AND public.has_business_permission(auth.uid(), 'can_manage_suppliers')
  )
);

DROP POLICY IF EXISTS "Users can update own suppliers" ON public.suppliers;
CREATE POLICY "Users and authorized sub-accounts can update suppliers"
ON public.suppliers FOR UPDATE
USING (
  auth.uid() = user_id 
  OR 
  (
    public.is_business_sub_account(auth.uid()) 
    AND public.get_business_owner_id(auth.uid()) = user_id
    AND public.has_business_permission(auth.uid(), 'can_manage_suppliers')
  )
);

DROP POLICY IF EXISTS "Users can delete own suppliers" ON public.suppliers;
CREATE POLICY "Users and authorized sub-accounts can delete suppliers"
ON public.suppliers FOR DELETE
USING (
  auth.uid() = user_id 
  OR 
  (
    public.is_business_sub_account(auth.uid()) 
    AND public.get_business_owner_id(auth.uid()) = user_id
    AND public.has_business_permission(auth.uid(), 'can_manage_suppliers')
  )
);

-- Atualizar políticas RLS para outras tabelas emp_*
DROP POLICY IF EXISTS "Users can view own emp_liabilities" ON public.emp_liabilities;
CREATE POLICY "Users and sub-accounts can view emp_liabilities"
ON public.emp_liabilities FOR SELECT
USING (
  auth.uid() = user_id 
  OR 
  (
    public.is_business_sub_account(auth.uid()) 
    AND public.get_business_owner_id(auth.uid()) = user_id
    AND public.has_business_permission(auth.uid(), 'can_view_investments')
  )
);

DROP POLICY IF EXISTS "Users can insert own emp_liabilities" ON public.emp_liabilities;
CREATE POLICY "Users and authorized sub-accounts can insert emp_liabilities"
ON public.emp_liabilities FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  OR 
  (
    public.is_business_sub_account(auth.uid()) 
    AND public.get_business_owner_id(auth.uid()) = user_id
    AND public.has_business_permission(auth.uid(), 'can_manage_investments')
  )
);

DROP POLICY IF EXISTS "Users can update own emp_liabilities" ON public.emp_liabilities;
CREATE POLICY "Users and authorized sub-accounts can update emp_liabilities"
ON public.emp_liabilities FOR UPDATE
USING (
  auth.uid() = user_id 
  OR 
  (
    public.is_business_sub_account(auth.uid()) 
    AND public.get_business_owner_id(auth.uid()) = user_id
    AND public.has_business_permission(auth.uid(), 'can_manage_investments')
  )
);

DROP POLICY IF EXISTS "Users can delete own emp_liabilities" ON public.emp_liabilities;
CREATE POLICY "Users and authorized sub-accounts can delete emp_liabilities"
ON public.emp_liabilities FOR DELETE
USING (
  auth.uid() = user_id 
  OR 
  (
    public.is_business_sub_account(auth.uid()) 
    AND public.get_business_owner_id(auth.uid()) = user_id
    AND public.has_business_permission(auth.uid(), 'can_manage_investments')
  )
);

DROP POLICY IF EXISTS "Users can view own emp_goals" ON public.emp_goals;
CREATE POLICY "Users and sub-accounts can view emp_goals"
ON public.emp_goals FOR SELECT
USING (
  auth.uid() = user_id 
  OR 
  (
    public.is_business_sub_account(auth.uid()) 
    AND public.get_business_owner_id(auth.uid()) = user_id
  )
);

DROP POLICY IF EXISTS "Users can insert own emp_goals" ON public.emp_goals;
DROP POLICY IF EXISTS "Users can update own emp_goals" ON public.emp_goals;
DROP POLICY IF EXISTS "Users can delete own emp_goals" ON public.emp_goals;

CREATE POLICY "Only owners can manage emp_goals"
ON public.emp_goals FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own emp_recurring_expenses" ON public.emp_recurring_expenses;
CREATE POLICY "Users and sub-accounts can view emp_recurring_expenses"
ON public.emp_recurring_expenses FOR SELECT
USING (
  auth.uid() = user_id 
  OR 
  (
    public.is_business_sub_account(auth.uid()) 
    AND public.get_business_owner_id(auth.uid()) = user_id
    AND public.has_business_permission(auth.uid(), 'can_view_transactions')
  )
);

DROP POLICY IF EXISTS "Users can insert own emp_recurring_expenses" ON public.emp_recurring_expenses;
CREATE POLICY "Users and authorized sub-accounts can insert emp_recurring_expenses"
ON public.emp_recurring_expenses FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  OR 
  (
    public.is_business_sub_account(auth.uid()) 
    AND public.get_business_owner_id(auth.uid()) = user_id
    AND public.has_business_permission(auth.uid(), 'can_create_transactions')
  )
);

DROP POLICY IF EXISTS "Users can update own emp_recurring_expenses" ON public.emp_recurring_expenses;
CREATE POLICY "Users and authorized sub-accounts can update emp_recurring_expenses"
ON public.emp_recurring_expenses FOR UPDATE
USING (
  auth.uid() = user_id 
  OR 
  (
    public.is_business_sub_account(auth.uid()) 
    AND public.get_business_owner_id(auth.uid()) = user_id
    AND public.has_business_permission(auth.uid(), 'can_edit_transactions')
  )
);

DROP POLICY IF EXISTS "Users can delete own emp_recurring_expenses" ON public.emp_recurring_expenses;
CREATE POLICY "Users and authorized sub-accounts can delete emp_recurring_expenses"
ON public.emp_recurring_expenses FOR DELETE
USING (
  auth.uid() = user_id 
  OR 
  (
    public.is_business_sub_account(auth.uid()) 
    AND public.get_business_owner_id(auth.uid()) = user_id
    AND public.has_business_permission(auth.uid(), 'can_delete_transactions')
  )
);

DROP POLICY IF EXISTS "Users can view own emp_monthly_finance_data" ON public.emp_monthly_finance_data;
CREATE POLICY "Users and sub-accounts can view emp_monthly_finance_data"
ON public.emp_monthly_finance_data FOR SELECT
USING (
  auth.uid() = user_id 
  OR 
  (
    public.is_business_sub_account(auth.uid()) 
    AND public.get_business_owner_id(auth.uid()) = user_id
  )
);

DROP POLICY IF EXISTS "Users can insert own emp_monthly_finance_data" ON public.emp_monthly_finance_data;
DROP POLICY IF EXISTS "Users can update own emp_monthly_finance_data" ON public.emp_monthly_finance_data;
DROP POLICY IF EXISTS "Users can delete own emp_monthly_finance_data" ON public.emp_monthly_finance_data;

CREATE POLICY "Only owners can manage emp_monthly_finance_data"
ON public.emp_monthly_finance_data FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own emp_health_snapshots" ON public.emp_health_snapshots;
CREATE POLICY "Users and sub-accounts can view emp_health_snapshots"
ON public.emp_health_snapshots FOR SELECT
USING (
  auth.uid() = user_id 
  OR 
  (
    public.is_business_sub_account(auth.uid()) 
    AND public.get_business_owner_id(auth.uid()) = user_id
  )
);

DROP POLICY IF EXISTS "Users can insert own emp_health_snapshots" ON public.emp_health_snapshots;
DROP POLICY IF EXISTS "Users can update own emp_health_snapshots" ON public.emp_health_snapshots;
DROP POLICY IF EXISTS "Users can delete own emp_health_snapshots" ON public.emp_health_snapshots;

CREATE POLICY "Only owners can manage emp_health_snapshots"
ON public.emp_health_snapshots FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);