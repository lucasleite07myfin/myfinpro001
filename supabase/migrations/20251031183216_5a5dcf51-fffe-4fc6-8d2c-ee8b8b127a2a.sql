-- Adicionar coluna company_name na tabela profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS company_name text;

-- Comentário explicativo
COMMENT ON COLUMN public.profiles.company_name IS 'Nome da empresa do usuário no modo business';