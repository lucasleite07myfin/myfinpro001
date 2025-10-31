-- Add additional_info column to business_invites table
ALTER TABLE public.business_invites
ADD COLUMN additional_info JSONB;

-- Add employee information columns to business_sub_accounts table
ALTER TABLE public.business_sub_accounts
ADD COLUMN department TEXT,
ADD COLUMN position TEXT,
ADD COLUMN employee_code TEXT,
ADD COLUMN phone TEXT,
ADD COLUMN admission_date DATE,
ADD COLUMN notes TEXT;