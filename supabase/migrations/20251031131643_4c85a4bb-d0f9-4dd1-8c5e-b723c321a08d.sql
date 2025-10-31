-- Add biometric authentication support to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS biometric_public_key TEXT,
ADD COLUMN IF NOT EXISTS biometric_credential_id TEXT,
ADD COLUMN IF NOT EXISTS biometric_enabled BOOLEAN DEFAULT false;

-- Create index for faster credential lookups
CREATE INDEX IF NOT EXISTS idx_profiles_credential_id 
ON public.profiles(biometric_credential_id) 
WHERE biometric_credential_id IS NOT NULL;