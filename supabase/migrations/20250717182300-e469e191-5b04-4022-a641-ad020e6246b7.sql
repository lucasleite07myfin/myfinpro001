-- Inserir badges padrão para o sistema de gamificação
INSERT INTO public.badges (code, name, description, icon) VALUES
('first_transaction', 'Primeira Transação', 'Registrou sua primeira transação financeira', 'receipt'),
('week_streak', 'Semana Completa', 'Registrou transações por 7 dias consecutivos', 'calendar'),
('goal_achiever', 'Realizador de Metas', 'Alcançou sua primeira meta financeira', 'target'),
('saver_100', 'Poupador Iniciante', 'Economizou R$ 100 em um mês', 'piggy-bank'),
('saver_1000', 'Poupador Avançado', 'Economizou R$ 1.000 em um mês', 'trophy'),
('investor', 'Investidor', 'Fez seu primeiro investimento', 'trending-up'),
('budget_master', 'Mestre do Orçamento', 'Não ultrapassou o orçamento por 3 meses consecutivos', 'shield-check'),
('crypto_enthusiast', 'Entusiasta Crypto', 'Adicionou sua primeira criptomoeda', 'bitcoin'),
('asset_builder', 'Construtor de Patrimônio', 'Cadastrou mais de 5 ativos', 'building'),
('debt_free', 'Livre de Dívidas', 'Quitou todos os passivos', 'check-circle');

-- Configurar alguns dados padrão para facilitar testes
-- (Essas categorias são sugestões padrão, usuários podem criar suas próprias)

-- Adicionar função para lidar com triggers de timestamp que podem estar faltando
-- Atualizar a função handle_new_user para verificar se o perfil já existe
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, user_id, full_name, app_mode)
  VALUES (NEW.id, NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email), 'personal')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;