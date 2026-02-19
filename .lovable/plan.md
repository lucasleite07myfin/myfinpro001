
# Migrar tipos em `src/types/finance.ts` para centavos

## Objetivo

Adicionar campos `*Cents` (tipo `MoneyCents`) em todas as interfaces que possuem valores monetarios, mantendo os campos legado intactos para nao quebrar o codigo existente.

## Alteracoes

### 1. Novo tipo (apos linha 1)

```typescript
export type MoneyCents = number;
```

### 2. Interface `Transaction` (linha 17)

Adicionar apos `amount`:

```typescript
amount: number;        // legado (reais)
amountCents: MoneyCents; // novo padrao (centavos)
```

### 3. Interface `RecurringExpense` (linha 33)

Adicionar apos `amount`:

```typescript
amount: number;        // legado (reais)
amountCents: MoneyCents; // novo padrao (centavos)
```

Tambem adicionar campo para `monthlyValues`:

```typescript
monthlyValues?: Record<string, number>;        // legado
monthlyValuesCents?: Record<string, MoneyCents>; // novo padrao
```

### 4. Interface `Goal` (linhas 47-48)

Adicionar apos cada campo monetario:

```typescript
targetAmount: number;            // legado
targetAmountCents: MoneyCents;   // novo
currentAmount: number;           // legado
currentAmountCents: MoneyCents;  // novo
```

### 5. Interface `Asset` (linhas 56, 58, 66)

Adicionar apos cada campo monetario:

```typescript
value: number;                      // legado
valueCents: MoneyCents;             // novo
acquisitionValue?: number;          // legado
acquisitionValueCents?: MoneyCents; // novo
lastPriceBrl?: number;              // legado
lastPriceBrlCents?: MoneyCents;     // novo
```

### 6. Interface `Liability` (linha 72)

Adicionar apos `value`:

```typescript
value: number;          // legado
valueCents: MoneyCents;  // novo
```

### 7. Interface `MonthlyFinanceData` (linhas 79-80)

Adicionar:

```typescript
incomeTotal: number;            // legado
incomeTotalCents: MoneyCents;   // novo
expenseTotal: number;           // legado
expenseTotalCents: MoneyCents;  // novo
```

## O que NAO muda

- Nenhum campo existente e removido
- `FinanceContextType` e `BusinessContextType` nao precisam de alteracao nesta etapa (os tipos das interfaces ja sao atualizados por referencia)
- Nenhum componente ou service e modificado

## Detalhes tecnicos

- O tipo `MoneyCents` e declarado localmente em `finance.ts` (alem do que ja existe em `money.ts`) para que os tipos de dominio nao dependam de utils
- Todos os novos campos sao obrigatorios nas interfaces de dados (exceto os que espelham campos opcionais como `acquisitionValue?`)
- Os contexts (`FinanceContextType`, `BusinessContextType`) usam `Transaction`, `Goal`, etc. por referencia, entao automaticamente verao os novos campos -- mas precisarao ser populados na proxima etapa de migracao dos services
