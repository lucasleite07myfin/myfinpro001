-- Permitir que funcionários possam se auto-desativar
CREATE POLICY "Sub-accounts can deactivate themselves"
ON public.business_sub_accounts
FOR UPDATE
TO authenticated
USING (
  auth.uid() = sub_user_id 
  AND is_active = true
)
WITH CHECK (
  auth.uid() = sub_user_id 
  AND is_active = false
);