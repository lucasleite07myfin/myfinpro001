
# Migrar formularios de componentes para centavos (amountCents)

## Resumo

Substituir o estado `amount: number` (float) por `amountInput: string` (exibicao formatada) + `amountCents: number` (fonte de verdade inteira) em 7 componentes de formulario. Elimina `parseFloat`, `parseCurrencyToNumber` e `formatNumberToCurrency` dos formularios, usando exclusivamente funcoes de `src/utils/money.ts`.

## Componentes a migrar

### 1. `src/components/AddTransactionModal.tsx`

**Estado atual:** `amount: string` (float como string) + `formattedAmount: string`
**Novo estado:** remover `amount`, renomear `formattedAmount` para `amountInput`, adicionar `amountCents: number`

- **Import**: trocar `formatNumberToCurrency` por `{ currencyStringToCents, formatNumberFromCentsForInput }` de `@/utils/money`
- **State** (linhas 77-78): `const [amountInput, setAmountInput] = useState('')` e `const [amountCents, setAmountCents] = useState(0)`
- **handleAmountChange** (linhas 127-132): extrair digitos, montar centavos via `parseInt(digits, 10)`, formatar display via `formatNumberFromCentsForInput(cents)`
- **useEffect edit mode** (linhas 98-109): preencher `amountCents` via `(initialData.amountCents ?? Math.round(initialData.amount * 100))` e `amountInput` via `formatNumberFromCentsForInput(amountCents)`
- **handleSubmitTransaction** (linhas 158-212): validar `amountCents > 0` e `amountCents <= 99999999999`, passar `amount: amountCents / 100` e `amountCents` no payload
- **handleSubmitRecurring** (linhas 214-241): idem, usar `amountCents` no payload
- **handleSubmitGoalContribution** (linhas 244-270): idem
- **resetForm** (linhas 112-125): `setAmountInput('')`, `setAmountCents(0)`
- **JSX**: trocar `formattedAmount` por `amountInput` nos inputs

### 2. `src/components/AddGoalContributionModal.tsx`

**Estado atual:** `amount: string` (float como string) + `formattedAmount: string`
**Novo estado:** `amountInput: string` + `amountCents: number`

- **Import**: adicionar `{ currencyStringToCents, formatNumberFromCentsForInput, formatBRLFromCents }` de `@/utils/money`
- **State** (linhas 33-34): substituir por `amountInput` + `amountCents`
- **handleAmountChange** (linhas 38-43): extrair digitos -> `parseInt` -> centavos
- **handleSubmit** (linhas 45-110): validar `amountCents > 0`, converter `amountCents / 100` para `amount` legado, comparar com `goal.currentAmount` usando centavos se disponivel (`goal.currentAmountCents`)
- **Preview** (linhas 121-125): calcular `newAmountCents` em inteiros, `newPercentage` com centavos
- **Exibicao**: usar `formatBRLFromCents` no toast e no preview

### 3. `src/components/AddGoalModal.tsx`

**Estado atual:** `targetAmount: string` + `currentAmount: string` (formatados com `formatCurrencyInput`)
**Novo estado:** `targetAmountInput/currentAmountInput: string` + `targetAmountCents/currentAmountCents: number`

- **Import**: trocar `formatCurrencyInput, parseCurrencyToNumber` por `{ currencyStringToCents, formatNumberFromCentsForInput }` de `@/utils/money`
- **State** (linhas 58-59): 4 variaveis (2 input string + 2 cents number)
- **useEffect edit** (linhas 74-93): preencher via `initialData.targetAmountCents ?? Math.round(initialData.targetAmount * 100)` e `formatNumberFromCentsForInput`
- **onChange handlers** (linhas 291-294, 315-318): extrair digitos -> centavos -> formatar input
- **handleSubmit** (linhas 95-158): validar usando centavos, passar `targetAmount: cents/100` e `targetAmountCents` no goalData
- **Preview** (linhas 172-174): calcular `percentage` com centavos

### 4. `src/components/AddAssetModal.tsx`

**Estado atual:** `value: string` (formatado com `formatCurrencyInput`)
**Novo estado:** `valueInput: string` + `valueCents: number`

- **Import**: trocar `formatCurrencyInput, parseCurrencyToNumber` por `{ currencyStringToCents, formatNumberFromCentsForInput }` de `@/utils/money`
- **State** (linha 56): `valueInput: string` + `valueCents: number`
- **onChange** (linhas 174-177): extrair digitos -> centavos -> formatar
- **handleSubmit** (linhas 60-77): passar `value: valueCents / 100` no payload
- **JSX**: trocar `value ? \`R$ \${value}\`` por `valueInput ? \`R$ \${valueInput}\`` 

### 5. `src/components/AddLiabilityModal.tsx`

**Estado atual:** `value: string` (formatado com `formatCurrencyInput`)
**Novo estado:** `valueInput: string` + `valueCents: number`

- **Import**: trocar `formatCurrencyInput, parseCurrencyToNumber` por `{ currencyStringToCents, formatNumberFromCentsForInput }` de `@/utils/money`
- **State** (linha 41): `valueInput` + `valueCents`
- **onChange** (linhas 127-129): extrair digitos -> centavos -> formatar
- **handleSubmit** (linhas 48-62): `value: valueCents / 100`

### 6. `src/components/PatrimonyModal.tsx`

**Estado atual:** `formData.value: number` + `formattedValue: string` + `formattedAcquisitionValue: string`
**Novo estado:** adicionar `valueCents` e `acquisitionValueCents` ao formData, manter `formattedValue`/`formattedAcquisitionValue` como inputs formatados

- **Import**: trocar `formatNumberToCurrency, parseCurrencyToNumber, formatCurrencyInput` por `{ currencyStringToCents, formatNumberFromCentsForInput }` de `@/utils/money`
- **formData** (linhas 67-78): adicionar `valueCents: 0` e `acquisitionValueCents: 0`
- **useEffect load** (linhas 91-133): preencher `valueCents` via `asset.valueCents ?? Math.round(asset.value * 100)`, formatar input via `formatNumberFromCentsForInput`
- **handleCurrencyChange** (linhas 183-194): extrair digitos -> centavos -> formatar input, atualizar `formData.valueCents` e derivar `formData.value = cents/100`
- **handleSubmit** (linhas 145-171): manter `value: formData.value` (legado)
- **Preview gainLoss** (linhas 206-209): calcular com centavos para precisao

### 7. `src/components/RecurringExpensesCard.tsx`

**Estado atual:** `editAmount: string` (formatado com `formatCurrencyInput`)
**Novo estado:** `editAmountInput: string` + `editAmountCents: number`

- **Import**: trocar `formatCurrencyInput, parseCurrencyToNumber` por `{ currencyStringToCents, formatNumberFromCentsForInput }` de `@/utils/money`
- **State** (linha 46): `editAmountInput` + `editAmountCents`
- **handleStartEdit** (linhas 101-105): preencher via centavos do expense existente
- **handleSaveEdit** (linhas 107-120): converter `editAmountCents / 100` para o valor em reais passado a `setMonthlyExpenseValue`
- **JSX inline edit** (linha 213): trocar `editAmount` por `editAmountInput` e onChange para centavos

## Padrao de onChange unificado

Todos os campos de valor seguirao este padrao:

```typescript
const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const digits = e.target.value.replace(/\D/g, '');
  const cents = digits ? parseInt(digits, 10) : 0;
  setAmountCents(cents);
  setAmountInput(cents > 0 ? formatNumberFromCentsForInput(cents) : '');
};
```

## Componente NAO migrado nesta etapa

- **AddInvestmentModal.tsx**: usa `react-hook-form` + `zod` com `type="number"` nativo. Migracao requer reestruturacao do schema zod. Sera tratado em etapa futura.

## O que NAO muda

- Payloads enviados aos contexts continuam incluindo `amount` (float) para compatibilidade
- Colunas do banco nao mudam
- `formatCurrencyInput` e `parseCurrencyToNumber` em `formatters.ts` nao sao removidos (podem ter outros usos), apenas deixam de ser usados nestes componentes
