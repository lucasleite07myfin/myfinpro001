

# Refatorar State Updates para Evitar Stale State

## Problema

Varias funcoes em `FinanceContext.tsx` e `BusinessContext.tsx` usam variaveis do closure (`transactions`, `goals`, `assets`, `liabilities`, `monthlyData`) diretamente nos setters de estado. Isso causa bugs de stale state quando multiplas atualizacoes acontecem rapidamente.

## Arquivos Afetados

- `src/contexts/FinanceContext.tsx` (maioria dos problemas)
- `src/contexts/BusinessContext.tsx` (poucos problemas restantes)

## Secao Tecnica

### FinanceContext.tsx - Correcoes

**Transactions (3 ocorrencias):**
- Linha 290: `setTransactions([newTransaction, ...transactions])` -> `setTransactions(prev => [newTransaction, ...prev])`
- Linha 323: `setTransactions(transactions.map(t => ...))` -> `setTransactions(prev => prev.map(t => ...))`
- Linha 339: `setTransactions(transactions.filter(t => ...))` -> `setTransactions(prev => prev.filter(t => ...))`

**editRecurringExpense - transactions closure (linhas 629-648):**
- Linhas 629, 635: Usa `transactions` diretamente para filtrar e mapear. Trocar por `setTransactions(prev => { ... })` com toda a logica dentro do callback.

**deleteRecurringExpense (linha 681):**
- `setTransactions(transactions.filter(...))` -> `setTransactions(prev => prev.filter(...))`

**Goals (4 ocorrencias):**
- Linha 784: `setGoals([...goals, newGoal])` -> `setGoals(prev => [...prev, newGoal])`
- Linha 807: `setGoals(goals.map(...))` -> `setGoals(prev => prev.map(...))`
- Linha 835: `setGoals(goals.map(...))` -> `setGoals(prev => prev.map(...))`
- Linha 855: `setGoals(goals.filter(...))` -> `setGoals(prev => prev.filter(...))`

**Assets (3 ocorrencias):**
- Linha 908: `setAssets([...assets, newAsset])` -> `setAssets(prev => [...prev, newAsset])`
- Linha 940: `setAssets(assets.map(...))` -> `setAssets(prev => prev.map(...))`
- Linha 957: `setAssets(assets.filter(...))` -> `setAssets(prev => prev.filter(...))`

**Liabilities (3 ocorrencias):**
- Linha 990: `setLiabilities([...liabilities, newLiability])` -> `setLiabilities(prev => [...prev, newLiability])`
- Linha 1011: `setLiabilities(liabilities.map(...))` -> `setLiabilities(prev => prev.map(...))`
- Linha 1028: `setLiabilities(liabilities.filter(...))` -> `setLiabilities(prev => prev.filter(...))`

**updateMonthlyData (linhas 1042-1079):**
- Usa `monthlyData` e `transactions` do closure. Refatorar para usar `setMonthlyData(prev => ...)` e obter `transactions` via `setTransactions` ou mover o calculo para um useEffect reativo (que ja existe na linha 1108).

### BusinessContext.tsx - Correcoes

A maioria ja usa `prev =>`, mas restam:

**updateTransaction (linhas 403-406):**
- `generateMonthlyDataFromTransactions(transactions.map(...))` usa `transactions` do closure. Trocar por `setTransactions(prev => { const updated = prev.map(...); setMonthlyData(generateMonthlyDataFromTransactions(updated)); return updated; })` -- porem ja existe useEffect na linha 149 que recalcula monthlyData quando transactions muda, entao basta remover o calculo manual.

**deleteTransaction (linhas 427-430):**
- Mesmo problema: `transactions.filter(...)` no calculo de monthlyData. Remover calculo manual, confiar no useEffect existente.

**editGoal (linha 681):**
- `setGoals(goals.map(...))` -> `setGoals(prev => prev.map(...))`

**editLiability (linha 954):**
- `setLiabilities(liabilities.map(...))` -> `setLiabilities(prev => prev.map(...))`

**deleteLiability (linha 971):**
- `setLiabilities(liabilities.filter(...))` -> `setLiabilities(prev => prev.filter(...))`

## Resumo de Mudancas

| Arquivo | Ocorrencias | Tipo |
|---------|-------------|------|
| FinanceContext.tsx | ~16 | transactions, goals, assets, liabilities, monthlyData |
| BusinessContext.tsx | ~5 | transactions (monthlyData calc), goals, liabilities |

Total: ~21 state updates corrigidos para usar o padrao funcional `prev => ...`.

