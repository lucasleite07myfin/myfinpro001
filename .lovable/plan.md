

# Criar docs/migrations_money_cents.md com SQL de migracao para centavos

## Resumo

Criar um arquivo de documentacao contendo todos os comandos SQL necessarios para adicionar colunas `*_cents BIGINT` nas tabelas monetarias do banco, com backfill, indices e estrategia de rollback. O arquivo serve como guia para execucao manual no SQL editor.

## Arquivo a criar

`docs/migrations_money_cents.md`

## Conteudo do arquivo

O documento tera as seguintes secoes:

### 1. Introducao e estrategia

- Explicar o padrao dual-column: manter coluna decimal antiga + nova coluna BIGINT em centavos
- App ja le `amount_cents` primeiro com fallback para `ROUND(amount * 100)` via `centsFromUnknownDbValue`
- Remocao das colunas antigas sera uma etapa futura apos estabilizacao

### 2. Tabelas pessoais - DDL + Backfill

Para cada tabela, gerar blocos SQL com:
- `ALTER TABLE ... ADD COLUMN ... BIGINT NOT NULL DEFAULT 0`
- `UPDATE ... SET *_cents = ROUND(amount * 100)` (backfill)
- `CREATE INDEX` quando aplicavel

Tabelas cobertas:
- **transactions**: `amount_cents`
- **recurring_expenses**: `amount_cents`
- **goals**: `target_amount_cents`, `current_amount_cents`
- **assets**: `value_cents`, `acquisition_value_cents`, `last_price_brl_cents`
- **liabilities**: `value_cents`
- **monthly_finance_data**: `income_total_cents`, `expense_total_cents`

### 3. Tabelas empresariais (emp_*) - DDL + Backfill

Mesma estrutura para:
- **emp_transactions**: `amount_cents`
- **emp_recurring_expenses**: `amount_cents`
- **emp_goals**: `target_amount_cents`, `current_amount_cents`
- **emp_assets**: `value_cents`, `acquisition_value_cents`, `last_price_brl_cents`
- **emp_liabilities**: `value_cents`
- **emp_monthly_finance_data**: `income_total_cents`, `expense_total_cents`

### 4. Indices adicionais

- `CREATE INDEX idx_transactions_user_date ON transactions(user_id, date DESC)` (se nao existir)
- Equivalente para `emp_transactions`

### 5. Secao de rollback

SQL para reverter cada alteracao:
- `ALTER TABLE ... DROP COLUMN *_cents`
- `DROP INDEX IF EXISTS ...`

### 6. Notas de seguranca

- Executar em horario de baixo uso
- Fazer backup antes
- Testar em ambiente de staging primeiro
- Backfill e idempotente (pode rodar varias vezes)
- `DEFAULT 0` garante que inserts antigos nao quebram

## Impacto no app

Nenhuma mudanca de codigo nesta etapa. O app ja possui fallback via `centsFromUnknownDbValue` que faz `ROUND(amount * 100)` quando `amount_cents` nao existe ou e 0. Apos rodar as migracoes:
- Inserts futuros do app ja populam ambas colunas (feito nas migracoes anteriores de businessService/financeService)
- Dados historicos serao backfillados pelo SQL

