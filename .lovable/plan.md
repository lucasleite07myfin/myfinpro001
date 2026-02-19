

# Migrar FinanceContext.tsx e financeService.ts para centavos

## Resumo

Migrar os calculos financeiros do FinanceContext para usar `amountCents` (inteiros) como fonte de verdade, mantendo `amount` (float) apenas para compatibilidade temporaria. A migracao tambem atualiza os formatters do financeService.ts para popular os novos campos `*Cents`.

## Alteracoes

### 1. `src/services/financeService.ts` -- Formatters populam campos Cents

Atualizar os formatters para incluir os novos campos:

- **`formatTransaction`**: adicionar `amountCents: centsFromUnknownDbValue(t.amount)` e manter `amount: amountCents / 100`
- **`formatRecurringExpense`**: adicionar `amountCents` e `monthlyValuesCents` (converter cada valor do record)
- **`formatGoal`**: adicionar `targetAmountCents` e `currentAmountCents`
- **`formatAsset`**: adicionar `valueCents`, `acquisitionValueCents`, `lastPriceBrlCents`
- **`formatLiability`**: adicionar `valueCents`
- **`formatMonthlyData`**: adicionar `incomeTotalCents` e `expenseTotalCents`

Adicionar import de `centsFromUnknownDbValue` de `@/utils/formatters`.

Adicionar helper local:
```typescript
function centsToDbDecimal(cents: number): string {
  return (cents / 100).toFixed(2);
}
```

Atualizar `insertTransaction` e `updateTransaction` para usar `centsToDbDecimal(transaction.amountCents)` ao enviar `amount` ao banco.

Atualizar `insertRecurringExpense` e `updateRecurringExpense` similarmente.

### 2. `src/contexts/FinanceContext.tsx` -- Calculos usam centavos

**Imports**: adicionar `centsFromUnknownDbValue` de `@/utils/formatters`.

**`updateMonthlyData`** (linha 447-464):
- Trocar `sum + t.amount` por `sum + (t.amountCents ?? 0)` nos reduces
- Computar `incomeTotalCents` e `expenseTotalCents`
- Enviar ao banco convertido: `currentMonthData.incomeTotalCents / 100` (compatibilidade com coluna decimal)

**`getMonthTotals`** (linha 467-476):
- Usar `t.amountCents ?? 0` nos reduces
- Retornar valores em centavos divididos por 100 para a interface (temporario ate migrar componentes)

**`markRecurringExpenseAsPaid`** (linhas 266-280):
- Na criacao da transacao, popular `amountCents` junto com `amount`

**`editRecurringExpense`** (linha 204):
- Atualizar `amountCents` junto com `amount` ao mapear transacoes relacionadas

**`getMonthlyExpenseValue`**: manter retornando em reais por enquanto (usado por varios componentes)

### 3. Garantir padrao funcional de state

Todos os `setTransactions`, `setRecurringExpenses`, `setGoals`, `setAssets`, `setLiabilities` ja usam `prev =>` -- verificado no codigo atual. Manter esse padrao.

## O que NAO muda nesta etapa

- Componentes de UI continuam recebendo `amount` (float) -- serao migrados em etapa futura
- Colunas do banco continuam como `numeric` (decimal) -- sem alteracao de schema
- Interface `FinanceContextType` mantem `getMonthTotals` retornando em reais (temporario)
- `getMonthlyExpenseValue` continua retornando em reais

## Detalhes tecnicos

- `centsToDbDecimal` usa divisao por 100 + `.toFixed(2)` -- seguro porque o resultado e apenas para persistencia, nao para calculo
- `centsFromUnknownDbValue` ja existe em `formatters.ts` e trata `number` (Math.round(value*100)), `string` (decimalStringToCents) e `null` (0)
- Os campos `*Cents` sao opcionais nos tipos (`?`), entao usamos `?? 0` como fallback nos calculos

