-- Criar política RLS específica para atualização de credenciais biométricas
-- Permite que usuários autenticados atualizem seus próprios campos biométricos
CREATE POLICY "Users can update their own biometric credentials"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);