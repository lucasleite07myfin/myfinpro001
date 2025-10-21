-- Fix discount_coupons RLS policies for public coupon validation

-- Remove old restrictive policy
DROP POLICY IF EXISTS "Users can view active coupons" ON public.discount_coupons;

-- Create new policy that allows anonymous/public read access to active valid coupons
CREATE POLICY "Anyone can view active valid coupons"
  ON public.discount_coupons 
  FOR SELECT
  TO public
  USING (
    is_active = true 
    AND (valid_until IS NULL OR valid_until > now())
  );

-- Create index for optimized coupon lookups
CREATE INDEX IF NOT EXISTS idx_discount_coupons_code_active 
  ON public.discount_coupons(code, is_active) 
  WHERE is_active = true;

-- Keep admin management policy (already exists)
-- "Only admins can manage coupons" - allows admins to INSERT, UPDATE, DELETE