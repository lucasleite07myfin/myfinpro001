

# Migrar BusinessContext.tsx e businessService.ts para centavos

## Resumo

Aplicar o mesmo padrao ja implementado no FinanceContext/financeService ao lado empresarial: formatters populam campos `*Cents`, calculos usam inteiros, persistencia converte de volta para decimal.

## Alteracoes

### 1. `src/services/businessService.ts` -- Formatters e persistencia

**Import** (linha 5): adicionar `centsFromUnknownDbValue`

```typescript
import { parseDateFromDB, formatDateToDB, centsFromUnknownDbValue } from '@/utils/formatters';
```

**Helper local** (apos linha 7): adicionar `centsToDbDecimal`

```typescript
function centsToDbDecimal(cents: number): string {
  return (cents / 100).toFixed(2);
}
```

**`formatTransaction`** (linhas 11-26): computar `amountCents` via `centsFromUnknownDbValue(t.amount)`, derivar `amount: amountCents / 100`

**`formatRecurringExpense`** (linhas 28-40): computar `amountCents`, converter `monthlyValues` para `monthlyValuesCents` (loop idêntico ao financeService)

**`formatGoal`** (linhas 42-49): adicionar `targetAmountCents` e `currentAmountCents`

**`formatAsset`** (linhas 51-67): adicionar `valueCents`, `acquisitionValueCents`, `lastPriceBrlCents`

**`formatLiability`** (linhas 69-74): adicionar `valueCents`

**`formatMonthlyData`** (linhas 76-80): adicionar `incomeTotalCents` e `expenseTotalCents`

**`insertTransaction`** (linha 140): trocar `amount: transaction.amount` por `amount: centsToDbDecimal(transaction.amountCents ?? Math.round(transaction.amount * 100))`

**`updateTransaction`** (linha 165): idem

**`insertRecurringExpense`** (linha 205): idem para `amount`

**`updateRecurringExpense`** (linha 226): idem para `amount`

**`insertTransaction` retorno** (linha 155): retornar via `formatTransaction(data)` em vez de spread manual, garantindo campos Cents populados

### 2. `src/contexts/BusinessContext.tsx` -- Calculos em centavos

**`generateMonthlyDataFromTransactions`** (linhas 83-98):
- Trocar `sum + t.amount` por `sum + (t.amountCents ?? 0)` nos dois reduces
- Popular `incomeTotalCents` e `expenseTotalCents` nos objetos retornados
- Derivar `incomeTotal` e `expenseTotal` legados como `cents / 100`

**`addTransaction` -- atualizacao de monthlyData** (linhas 175-184):
- Trocar `m.incomeTotal + newTransaction.amount` por operacoes em centavos
- Atualizar tanto `*Cents` quanto campos legado

**`getMonthTotals`** (linhas 508-518):
- Trocar `sum + t.amount` por `sum + (t.amountCents ?? 0)` nos reduces
- Calcular `savingRate` com inteiros
- Retornar em reais (centavos / 100) -- temporario ate migrar componentes

**`markRecurringExpenseAsPaid`** (linhas 270-284):
- Popular `amountCents` junto com `amount` na transacao criada
- Usar `centsFromUnknownDbValue` ou calcular a partir do valor em reais

**`getMonthlyExpenseValue`** (linhas 227-232):
- Manter retorno em reais por enquanto (compatibilidade com componentes)

**`addGoalContribution`** (linha 332-334):
- Atualizar `currentAmountCents` junto com `currentAmount`

## O que NAO muda

- Componentes de UI continuam recebendo `amount` (float)
- Colunas do banco continuam como `numeric` (decimal)
- Suppliers e Investments nao tem campos monetarios padrao (usam `value` em Asset, ja coberto pelo formatter)
- `setMonthlyExpenseValue` continua operando em reais (valor vindo de input do usuario, sera migrado com os componentes)

## Detalhes tecnicos

- Todos os `setState` ja usam `prev =>` no BusinessContext -- apenas confirmar e manter
- O padrao e identico ao aplicado em `financeService.ts` / `FinanceContext.tsx`
- Campos `*Cents` sao opcionais nos tipos, entao usamos `?? 0` como fallback
- `insertTransaction` passa a retornar `formatTransaction(data)` para garantir consistencia dos campos Cents

