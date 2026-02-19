# Migração: Colunas em Centavos (BIGINT)

## 1. Introdução e Estratégia

### Padrão dual-column

Mantemos a coluna decimal antiga (`amount`, `value`, etc.) e adicionamos uma nova coluna BIGINT em centavos (`amount_cents`, `value_cents`, etc.). Isso garante compatibilidade total durante a transição.

### Comportamento do app

O app já lê `amount_cents` primeiro. Se o valor for `0` (ou a coluna não existir), faz fallback para `ROUND(amount * 100)` via `centsFromUnknownDbValue` em `src/utils/money.ts`.

### Etapas

1. **Esta etapa**: Adicionar colunas `*_cents`, backfill dados existentes
2. **Etapa futura**: Após estabilização, remover colunas decimais antigas

---

## 2. Tabelas Pessoais — DDL + Backfill

> Execute cada bloco separadamente no SQL Editor.

### 2.1 transactions

```sql
-- DDL
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS amount_cents BIGINT NOT NULL DEFAULT 0;

-- Backfill
UPDATE public.transactions
  SET amount_cents = ROUND(amount * 100)
  WHERE amount_cents = 0 AND amount IS NOT NULL AND amount <> 0;

-- Index
CREATE INDEX IF NOT EXISTS idx_transactions_user_date
  ON public.transactions(user_id, date DESC);
```

### 2.2 recurring_expenses

```sql
-- DDL
ALTER TABLE public.recurring_expenses
  ADD COLUMN IF NOT EXISTS amount_cents BIGINT NOT NULL DEFAULT 0;

-- Backfill
UPDATE public.recurring_expenses
  SET amount_cents = ROUND(amount * 100)
  WHERE amount_cents = 0 AND amount IS NOT NULL AND amount <> 0;
```

### 2.3 goals

```sql
-- DDL
ALTER TABLE public.goals
  ADD COLUMN IF NOT EXISTS target_amount_cents BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_amount_cents BIGINT NOT NULL DEFAULT 0;

-- Backfill
UPDATE public.goals SET
  target_amount_cents = ROUND(target_amount * 100),
  current_amount_cents = ROUND(COALESCE(current_amount, 0) * 100)
  WHERE target_amount_cents = 0;
```

### 2.4 assets

```sql
-- DDL
ALTER TABLE public.assets
  ADD COLUMN IF NOT EXISTS value_cents BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS acquisition_value_cents BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_price_brl_cents BIGINT NOT NULL DEFAULT 0;

-- Backfill
UPDATE public.assets SET
  value_cents = ROUND(value * 100),
  acquisition_value_cents = ROUND(COALESCE(acquisition_value, 0) * 100),
  last_price_brl_cents = ROUND(COALESCE(last_price_brl, 0) * 100)
  WHERE value_cents = 0;
```

### 2.5 liabilities

```sql
-- DDL
ALTER TABLE public.liabilities
  ADD COLUMN IF NOT EXISTS value_cents BIGINT NOT NULL DEFAULT 0;

-- Backfill
UPDATE public.liabilities
  SET value_cents = ROUND(value * 100)
  WHERE value_cents = 0 AND value IS NOT NULL AND value <> 0;
```

### 2.6 monthly_finance_data

```sql
-- DDL
ALTER TABLE public.monthly_finance_data
  ADD COLUMN IF NOT EXISTS income_total_cents BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS expense_total_cents BIGINT NOT NULL DEFAULT 0;

-- Backfill
UPDATE public.monthly_finance_data SET
  income_total_cents = ROUND(COALESCE(income_total, 0) * 100),
  expense_total_cents = ROUND(COALESCE(expense_total, 0) * 100)
  WHERE income_total_cents = 0 AND expense_total_cents = 0;
```

---

## 3. Tabelas Empresariais (emp_*) — DDL + Backfill

### 3.1 emp_transactions

```sql
ALTER TABLE public.emp_transactions
  ADD COLUMN IF NOT EXISTS amount_cents BIGINT NOT NULL DEFAULT 0;

UPDATE public.emp_transactions
  SET amount_cents = ROUND(amount * 100)
  WHERE amount_cents = 0 AND amount IS NOT NULL AND amount <> 0;

CREATE INDEX IF NOT EXISTS idx_emp_transactions_user_date
  ON public.emp_transactions(user_id, date DESC);
```

### 3.2 emp_recurring_expenses

```sql
ALTER TABLE public.emp_recurring_expenses
  ADD COLUMN IF NOT EXISTS amount_cents BIGINT NOT NULL DEFAULT 0;

UPDATE public.emp_recurring_expenses
  SET amount_cents = ROUND(amount * 100)
  WHERE amount_cents = 0 AND amount IS NOT NULL AND amount <> 0;
```

### 3.3 emp_goals

```sql
ALTER TABLE public.emp_goals
  ADD COLUMN IF NOT EXISTS target_amount_cents BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_amount_cents BIGINT NOT NULL DEFAULT 0;

UPDATE public.emp_goals SET
  target_amount_cents = ROUND(target_amount * 100),
  current_amount_cents = ROUND(COALESCE(current_amount, 0) * 100)
  WHERE target_amount_cents = 0;
```

### 3.4 emp_assets

```sql
ALTER TABLE public.emp_assets
  ADD COLUMN IF NOT EXISTS value_cents BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS acquisition_value_cents BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_price_brl_cents BIGINT NOT NULL DEFAULT 0;

UPDATE public.emp_assets SET
  value_cents = ROUND(value * 100),
  acquisition_value_cents = ROUND(COALESCE(acquisition_value, 0) * 100),
  last_price_brl_cents = ROUND(COALESCE(last_price_brl, 0) * 100)
  WHERE value_cents = 0;
```

### 3.5 emp_liabilities

```sql
ALTER TABLE public.emp_liabilities
  ADD COLUMN IF NOT EXISTS value_cents BIGINT NOT NULL DEFAULT 0;

UPDATE public.emp_liabilities
  SET value_cents = ROUND(value * 100)
  WHERE value_cents = 0 AND value IS NOT NULL AND value <> 0;
```

### 3.6 emp_monthly_finance_data

```sql
ALTER TABLE public.emp_monthly_finance_data
  ADD COLUMN IF NOT EXISTS income_total_cents BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS expense_total_cents BIGINT NOT NULL DEFAULT 0;

UPDATE public.emp_monthly_finance_data SET
  income_total_cents = ROUND(COALESCE(income_total, 0) * 100),
  expense_total_cents = ROUND(COALESCE(expense_total, 0) * 100)
  WHERE income_total_cents = 0 AND expense_total_cents = 0;
```

---

## 4. Índices Adicionais

```sql
-- Já criados nas seções acima, mas listados aqui para referência:
CREATE INDEX IF NOT EXISTS idx_transactions_user_date
  ON public.transactions(user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_emp_transactions_user_date
  ON public.emp_transactions(user_id, date DESC);
```

---

## 5. Rollback

> Caso precise reverter as alterações:

```sql
-- Tabelas pessoais
ALTER TABLE public.transactions DROP COLUMN IF EXISTS amount_cents;
ALTER TABLE public.recurring_expenses DROP COLUMN IF EXISTS amount_cents;
ALTER TABLE public.goals DROP COLUMN IF EXISTS target_amount_cents, DROP COLUMN IF EXISTS current_amount_cents;
ALTER TABLE public.assets DROP COLUMN IF EXISTS value_cents, DROP COLUMN IF EXISTS acquisition_value_cents, DROP COLUMN IF EXISTS last_price_brl_cents;
ALTER TABLE public.liabilities DROP COLUMN IF EXISTS value_cents;
ALTER TABLE public.monthly_finance_data DROP COLUMN IF EXISTS income_total_cents, DROP COLUMN IF EXISTS expense_total_cents;

-- Tabelas empresariais
ALTER TABLE public.emp_transactions DROP COLUMN IF EXISTS amount_cents;
ALTER TABLE public.emp_recurring_expenses DROP COLUMN IF EXISTS amount_cents;
ALTER TABLE public.emp_goals DROP COLUMN IF EXISTS target_amount_cents, DROP COLUMN IF EXISTS current_amount_cents;
ALTER TABLE public.emp_assets DROP COLUMN IF EXISTS value_cents, DROP COLUMN IF EXISTS acquisition_value_cents, DROP COLUMN IF EXISTS last_price_brl_cents;
ALTER TABLE public.emp_liabilities DROP COLUMN IF EXISTS value_cents;
ALTER TABLE public.emp_monthly_finance_data DROP COLUMN IF EXISTS income_total_cents, DROP COLUMN IF EXISTS expense_total_cents;

-- Índices
DROP INDEX IF EXISTS idx_transactions_user_date;
DROP INDEX IF EXISTS idx_emp_transactions_user_date;
```

---

## 6. Notas de Segurança

- **Backup**: Faça backup do banco antes de executar
- **Horário**: Execute em horário de baixo uso
- **Staging**: Teste em ambiente de staging primeiro
- **Idempotência**: O backfill usa `WHERE *_cents = 0`, pode ser executado múltiplas vezes sem duplicar
- **DEFAULT 0**: Garante que inserts antigos (sem centavos) não quebram
- **Sem mudança no app**: O app já tem fallback via `centsFromUnknownDbValue`. Após o backfill, leituras passam a usar a coluna BIGINT diretamente
