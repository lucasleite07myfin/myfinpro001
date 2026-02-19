

# Migrar FinanceContext.tsx e financeService.ts para centavos

## Status: ✅ CONCLUÍDO

## Resumo

Migrados os calculos financeiros do FinanceContext e formatters do financeService para usar `amountCents` (inteiros) como fonte de verdade, mantendo `amount` (float) apenas para compatibilidade temporaria.

## Alteracoes realizadas

### 1. `src/services/financeService.ts`

- Todos os formatters (`formatTransaction`, `formatRecurringExpense`, `formatGoal`, `formatAsset`, `formatLiability`, `formatMonthlyData`) agora populam campos `*Cents` usando `centsFromUnknownDbValue`
- Campo `amount` legado derivado de `amountCents / 100`
- Helper `centsToDbDecimal` adicionado para persistencia
- `insertTransaction`, `updateTransaction`, `insertRecurringExpense`, `updateRecurringExpense` usam `centsToDbDecimal` ao enviar ao banco
- `insertTransaction` e `updateTransaction` retornam dados via `formatTransaction` (consistente)

### 2. `src/contexts/FinanceContext.tsx`

- `updateMonthlyData`: reduces usam `t.amountCents ?? 0`
- `getMonthTotals`: calcula em centavos, retorna em reais (temporario)
- `savingRate`: calculado com inteiros para evitar erro de ponto flutuante
- `markRecurringExpenseAsPaid`: popula `amountCents` na transacao criada
- `editRecurringExpense`: popula `amountCents` ao atualizar transacoes relacionadas

### 3. `src/types/finance.ts` (etapa anterior)

- Campos `*Cents` opcionais adicionados a todas as interfaces monetarias
- Tipo `MoneyCents` exportado

## O que NAO mudou

- Componentes de UI continuam recebendo `amount` (float)
- Colunas do banco continuam como `numeric` (decimal)
- `getMonthTotals` retorna em reais (temporario)
- `getMonthlyExpenseValue` retorna em reais

## Proximas etapas

1. Migrar `BusinessContext.tsx` e `businessService.ts` similarmente
2. Migrar componentes de UI para usar `amountCents` e `formatCurrencyFromCents`
3. Tornar campos `*Cents` obrigatorios nos tipos e remover campos legado
