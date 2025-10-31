-- Remove biometric authentication support from profiles table

-- Remove index
DROP INDEX IF EXISTS public.idx_profiles_credential_id;

-- Remove policy
DROP POLICY IF EXISTS "Users can update their own biometric credentials" ON public.profiles;

-- Remove columns
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS biometric_public_key,
DROP COLUMN IF EXISTS biometric_credential_id,
DROP COLUMN IF EXISTS biometric_enabled;

-- Comment
COMMENT ON TABLE public.profiles IS 'User profiles table - biometric support removed';