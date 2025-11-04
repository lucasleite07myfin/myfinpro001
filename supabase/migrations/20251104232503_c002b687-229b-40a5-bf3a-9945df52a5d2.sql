-- Adicionar coluna para armazenar o hash do PIN de alternância de modos
ALTER TABLE public.profiles 
ADD COLUMN mode_switch_pin_hash TEXT;

-- Comentário explicativo
COMMENT ON COLUMN public.profiles.mode_switch_pin_hash 
IS 'Hash bcrypt do PIN de 4 dígitos para alternar entre modos pessoal e empresarial';