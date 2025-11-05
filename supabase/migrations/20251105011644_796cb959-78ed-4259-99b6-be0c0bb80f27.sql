-- Add pin_required column to profiles table
ALTER TABLE public.profiles
ADD COLUMN pin_required boolean DEFAULT true NOT NULL;

COMMENT ON COLUMN public.profiles.pin_required IS 'Whether PIN is required for mode switching. Defaults to true for security.';