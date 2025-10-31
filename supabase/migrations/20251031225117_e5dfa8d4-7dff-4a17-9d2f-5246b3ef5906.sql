-- Criar schema extensions se não existir
CREATE SCHEMA IF NOT EXISTS extensions;

-- Mover extensões do schema public para extensions
-- Nota: Esta migration pode falhar se houver dependências, nesse caso o admin
-- deve fazer manualmente via dashboard do Supabase

-- Comentário: Esta é uma correção de segurança recomendada pelo Supabase linter.
-- Extensões não devem estar no schema public para evitar conflitos e problemas de segurança.

-- As extensões comuns do Supabase são:
-- - uuid-ossp (geração de UUIDs)
-- - pgcrypto (criptografia)
-- - pg_stat_statements (estatísticas)

-- Se você tiver extensões específicas instaladas, adicione comandos ALTER EXTENSION aqui
-- Exemplo: ALTER EXTENSION "uuid-ossp" SET SCHEMA extensions;

-- IMPORTANTE: Após esta migration, você deve:
-- 1. Verificar se todas as funções/triggers que usam as extensões ainda funcionam
-- 2. Atualizar referências se necessário