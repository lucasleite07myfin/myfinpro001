

# Corrigir BusinessContext para Suportar Subcontas

## Resumo

O `BusinessContext` atualmente usa `user.id` em todas as queries e inserts. Quando um funcionario (subconta) acessa o sistema, ele precisa carregar e manipular os dados do **dono** (`ownerId`), nao os seus proprios. A correcao introduz um `effectiveUserId` que aponta para o owner quando o usuario e subconta.

## O que muda

O arquivo `src/contexts/BusinessContext.tsx` sera o unico modificado:

1. Importar `useSubAccount` do `SubAccountContext`
2. Criar a variavel `effectiveUserId` baseada no estado de subconta
3. Substituir **todas** as ocorrencias de `user.id` por `effectiveUserId` nas queries e inserts

## Secao Tecnica

### Nova variavel (apos linha 137)

```typescript
import { useSubAccount } from '@/contexts/SubAccountContext';

// Dentro do provider, apos const { user } = useUser();
const { isSubAccount, ownerId } = useSubAccount();
const effectiveUserId = isSubAccount && ownerId ? ownerId : user?.id;
```

### Substituicoes de `user.id` por `effectiveUserId`

Todas as ocorrencias em `BusinessContext.tsx` onde `user.id` e usado para queries ou inserts serao substituidas. Sao aproximadamente 25 ocorrencias em:

**Queries (SELECT/loadData) - linhas 158-187:**
- `profiles` query: manter `user.id` (perfil e do usuario logado, nao do owner) -- EXCECAO
- `emp_transactions`: `user.id` -> `effectiveUserId`
- `emp_recurring_expenses`: `user.id` -> `effectiveUserId`
- `emp_goals`: `user.id` -> `effectiveUserId`
- `emp_assets`: `user.id` -> `effectiveUserId`
- `suppliers`: `user.id` -> `effectiveUserId`
- `emp_liabilities`: `user.id` -> `effectiveUserId`
- `emp_monthly_finance_data`: `user.id` -> `effectiveUserId`
- `custom_categories`: `user.id` -> `effectiveUserId`

**Inserts (CREATE) - substituir `user_id: user.id` por `user_id: effectiveUserId`:**
- `addTransaction` (linha 326)
- `addRecurringExpense` (linha 444)
- `addGoal` (linha 612)
- `addAsset` (linha 690)
- `addSupplier` (linha 797)
- `addLiability` (linha 913)
- `addInvestment` (linha 984)
- `addCustomCategory` (linha 1115)

**Updates com filtro `user_id` - substituir `.eq('user_id', user.id)` por `.eq('user_id', effectiveUserId)`:**
- `deleteGoal` (linha 653)
- `editCustomCategory` (linhas 1172, 1183, 1192)
- `deleteCustomCategory` (linhas 1225, 1233, 1247)

**Excecao importante:** A query do `profiles` (linha 161) deve continuar usando `user.id` pois o perfil exibido e do usuario logado.

### Atualizacao do useEffect

O `useEffect` que dispara `loadData` precisa reagir tambem a mudancas em `effectiveUserId`:

```typescript
useEffect(() => {
  if (user && effectiveUserId) {
    loadData();
  }
}, [user?.id, effectiveUserId]);
```

### Guard nas funcoes de escrita

Substituir `if (!user) throw new Error(...)` por `if (!user || !effectiveUserId) throw new Error(...)` nas funcoes de criacao.

