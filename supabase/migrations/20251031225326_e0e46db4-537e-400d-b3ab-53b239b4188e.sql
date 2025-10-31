-- Mover extensão uuid-ossp para o schema extensions (se existir no public)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM pg_extension 
    WHERE extname = 'uuid-ossp' 
    AND extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    ALTER EXTENSION "uuid-ossp" SET SCHEMA extensions;
  END IF;
END $$;

-- Mover extensão pgcrypto para o schema extensions (se existir no public)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM pg_extension 
    WHERE extname = 'pgcrypto' 
    AND extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    ALTER EXTENSION "pgcrypto" SET SCHEMA extensions;
  END IF;
END $$;

-- Adicionar o schema extensions ao search_path para que as funções continuem funcionando
ALTER DATABASE postgres SET search_path TO public, extensions;