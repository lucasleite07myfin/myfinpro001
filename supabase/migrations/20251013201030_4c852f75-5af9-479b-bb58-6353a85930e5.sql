-- Tabela para armazenar dados da DRE (Demonstração do Resultado do Exercício)
CREATE TABLE public.dre_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  month VARCHAR NOT NULL,
  receita_bruta NUMERIC NOT NULL DEFAULT 0,
  cmv NUMERIC NOT NULL DEFAULT 0,
  receitas_financeiras NUMERIC NOT NULL DEFAULT 0,
  despesas_financeiras NUMERIC NOT NULL DEFAULT 0,
  aliquota_imposto NUMERIC NOT NULL DEFAULT 0.15,
  deducoes_vendas JSONB DEFAULT '[]'::jsonb,
  despesas_operacionais JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, month)
);

-- Enable RLS
ALTER TABLE public.dre_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own dre_data"
ON public.dre_data
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dre_data"
ON public.dre_data
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dre_data"
ON public.dre_data
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dre_data"
ON public.dre_data
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_dre_data_updated_at
BEFORE UPDATE ON public.dre_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();