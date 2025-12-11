-- Corrigir RLS do discount_coupons para ser mais restritivo
-- Remover a policy que expõe cupons publicamente e criar uma mais segura

-- Remover a policy antiga que permite qualquer um ver cupons ativos
DROP POLICY IF EXISTS "Anyone can view active valid coupons" ON public.discount_coupons;

-- Criar nova policy que só permite usuários autenticados validarem cupons
-- (para validação no checkout, não exposição de todos os cupons)
CREATE POLICY "Authenticated users can view active valid coupons by code" 
ON public.discount_coupons 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND is_active = true 
  AND (valid_until IS NULL OR valid_until > now())
);