-- Atualizar apenas a função handle_new_user para melhor tratamento
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, user_id, full_name, app_mode)
  VALUES (NEW.id, NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email), 'personal')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;