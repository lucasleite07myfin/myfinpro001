

# Separar Logica do Supabase dos Contexts

## Objetivo

Extrair todas as chamadas ao banco de dados dos contexts (`FinanceContext.tsx` com 1221 linhas e `BusinessContext.tsx` com 1423 linhas) para arquivos de servico dedicados. Os contexts passam a cuidar apenas de state, loading, toasts e cache.

## Arquivos a Criar

### 1. `src/services/financeService.ts`

Contera todas as funcoes que fazem chamadas ao Supabase para o modo pessoal. Cada funcao retorna `{ data, error }` padronizado, sem toasts nem manipulacao de estado.

**Funcoes extraidas:**

| Funcao | Tabela | Operacao |
|--------|--------|----------|
| `fetchTransactions(userId)` | transactions | SELECT |
| `insertTransaction(userId, transaction)` | transactions | INSERT |
| `updateTransaction(transaction)` | transactions | UPDATE |
| `removeTransaction(id)` | transactions | DELETE |
| `fetchRecurringExpenses(userId)` | recurring_expenses | SELECT |
| `insertRecurringExpense(userId, expense)` | recurring_expenses | INSERT |
| `updateRecurringExpense(expense)` | recurring_expenses | UPDATE |
| `removeRecurringExpense(id)` | recurring_expenses | DELETE |
| `updatePaidMonths(id, paidMonths)` | recurring_expenses | UPDATE |
| `updateMonthlyValues(id, values)` | recurring_expenses | UPDATE |
| `fetchGoals(userId)` | goals | SELECT |
| `insertGoal(userId, goal)` | goals | INSERT |
| `updateGoal(goal)` | goals | UPDATE |
| `removeGoal(id, userId)` | goals | DELETE |
| `fetchAssets(userId)` | assets | SELECT |
| `insertAsset(userId, asset)` | assets | INSERT |
| `updateAsset(asset)` | assets | UPDATE |
| `removeAsset(id)` | assets | DELETE |
| `fetchLiabilities(userId)` | liabilities | SELECT |
| `insertLiability(userId, liability)` | liabilities | INSERT |
| `updateLiability(liability)` | liabilities | UPDATE |
| `removeLiability(id)` | liabilities | DELETE |
| `fetchCustomCategories(userId)` | custom_categories | SELECT |
| `insertCustomCategory(userId, type, name)` | custom_categories | INSERT |
| `updateCustomCategoryName(userId, oldName, newName)` | custom_categories | UPDATE |
| `removeCustomCategory(userId, type, name)` | custom_categories | DELETE |
| `fetchMonthlyData(userId)` | monthly_finance_data | SELECT |
| `upsertMonthlyData(userId, month, income, expense)` | monthly_finance_data | UPSERT |
| `checkExistingRecurringTransaction(userId, recurringId, monthStart, monthEnd)` | transactions | SELECT |
| `checkCategoryInUse(userId, categoryName)` | transactions + recurring_expenses | SELECT |
| `updateCategoryInTransactions(userId, oldName, newName)` | transactions | UPDATE |
| `updateCategoryInRecurring(userId, oldName, newName)` | recurring_expenses | UPDATE |
| `deleteTransactionsByRecurringId(recurringExpenseId)` | transactions | DELETE |

### 2. `src/services/businessService.ts`

Mesmo padrao, mas usando tabelas `emp_*` e recebendo `effectiveUserId`.

**Funcoes extraidas (mesmas do finance + extras):**

Todas as funcoes equivalentes ao financeService, mas operando nas tabelas `emp_transactions`, `emp_recurring_expenses`, `emp_goals`, `emp_assets`, `emp_liabilities`, `emp_monthly_finance_data`.

**Funcoes exclusivas do business:**

| Funcao | Tabela | Operacao |
|--------|--------|----------|
| `fetchCompanyName(userId)` | profiles | SELECT |
| `fetchSuppliers(userId)` | suppliers | SELECT |
| `insertSupplier(userId, supplier)` | suppliers | INSERT |
| `updateSupplier(supplier)` | suppliers | UPDATE |
| `removeSupplier(id)` | suppliers | DELETE |
| `insertInvestment(userId, investment)` | emp_assets | INSERT |
| `updateInvestment(investment)` | emp_assets | UPDATE |
| `removeInvestment(id)` | emp_assets | DELETE |
| `updateInvestmentInstallments(id, investment, paidInstallments)` | emp_assets | UPDATE |

## Padrao de Retorno

Todas as funcoes dos services seguem o padrao:

```typescript
type ServiceResult<T> = { data: T; error: null } | { data: null; error: string };
```

Exemplo:

```typescript
export const fetchTransactions = async (userId: string): Promise<ServiceResult<Transaction[]>> => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId);

  if (error) return { data: null, error: error.message };

  const formatted = data.map(t => ({
    id: t.id,
    date: parseDateFromDB(t.date),
    description: t.description,
    // ... formatacao
  }));

  return { data: formatted, error: null };
};
```

## Refatoracao dos Contexts

### FinanceContext.tsx (de ~1221 para ~500 linhas)

O context passa a importar funcoes do `financeService` e fica responsavel apenas por:

- Declarar estados (`useState`)
- Chamar services e atualizar estados com o resultado
- Exibir toasts de sucesso/erro
- Gerenciar loading e debounce
- Lock de duplo-clique (`markingPaidRef`)

Exemplo de como ficara `addTransaction`:

```typescript
const addTransaction = async (transaction: Omit<Transaction, 'id'>, silent = false) => {
  if (!user) return;
  const result = await financeService.insertTransaction(user.id, transaction);
  if (result.error) {
    toast.error('Erro ao adicionar transacao');
    return;
  }
  setTransactions(prev => [result.data, ...prev]);
  if (!silent) toast.success('Transacao adicionada com sucesso!');
};
```

### BusinessContext.tsx (de ~1423 para ~600 linhas)

Mesmo padrao do FinanceContext. Importa funcoes do `businessService`.

## Ordem de Implementacao

1. Criar `src/services/financeService.ts` com todas as funcoes de banco
2. Criar `src/services/businessService.ts` com todas as funcoes de banco
3. Refatorar `FinanceContext.tsx` para usar financeService
4. Refatorar `BusinessContext.tsx` para usar businessService

## O que NAO muda

- Interfaces e tipos exportados dos contexts
- API publica dos hooks (`useFinance()`, `useBusiness()`)
- Componentes que consomem os contexts
- Logica de lazy loading por modo (implementada anteriormente)
- Lock de duplo-clique no `markRecurringExpenseAsPaid`

## Beneficios

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Linhas por context | ~1200-1400 | ~500-600 |
| Testabilidade | Dificil (acoplado ao React) | Services testaveis isoladamente |
| Reutilizacao | Nenhuma | Services compartilhaveis |
| Manutencao | Mistura estado + DB + UI | Camadas separadas |

