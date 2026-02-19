
# Evitar Duplicacao de Transacao ao Marcar Despesa Recorrente como Paga

## Problema

Quando o usuario clica rapidamente no botao de marcar despesa recorrente como paga, a funcao `markRecurringExpenseAsPaid` pode ser chamada multiplas vezes antes que o estado `transactions` atualize, criando transacoes duplicadas.

## Solucao

### Frente 1: Guard no front-end (FinanceContext.tsx)

Antes de chamar `addTransaction` dentro de `markRecurringExpenseAsPaid`, consultar o banco para verificar se ja existe uma transacao com `recurring_expense_id = id` no mes em questao. Se existir, pular a criacao.

Alem disso, adicionar um flag `useRef` de "em processamento" para bloquear chamadas concorrentes na mesma despesa.

### Frente 2: Unique index no banco (protecao definitiva)

Criar um indice parcial unico para garantir que, mesmo com race conditions, o banco rejeite duplicatas.

## Secao Tecnica

### Arquivo: `src/contexts/FinanceContext.tsx`

**1. Adicionar ref de lock (junto aos outros useRef):**

```typescript
const markingPaidRef = useRef<Set<string>>(new Set());
```

**2. Refatorar `markRecurringExpenseAsPaid` (linhas 686-745):**

No bloco `if (paid && !isAlreadyPaid)` (linha 714), antes de chamar `addTransaction`:

```typescript
// Lock para evitar duplo-clique
const lockKey = `${id}_${month}`;
if (markingPaidRef.current.has(lockKey)) return;
markingPaidRef.current.add(lockKey);

try {
  // ... logica existente de paidMonths ...

  if (paid && !isAlreadyPaid) {
    // Verificar no banco se ja existe transacao para este recurring+mes
    const monthStart = `${month}-01`;
    const monthEnd = month.split('-')[1] === '12' 
      ? `${parseInt(month.split('-')[0]) + 1}-01-01`
      : `${month.split('-')[0]}-${String(parseInt(month.split('-')[1]) + 1).padStart(2, '0')}-01`;

    const { data: existing } = await supabase
      .from('transactions')
      .select('id')
      .eq('user_id', user.id)
      .eq('recurring_expense_id', id)
      .gte('date', monthStart)
      .lt('date', monthEnd)
      .limit(1);

    if (!existing || existing.length === 0) {
      // Criar transacao apenas se nao existir
      const amount = getMonthlyExpenseValue(id, month) || expense.amount;
      if (amount > 0) {
        // ... addTransaction como ja esta ...
      }
    }
  }
  // ... resto da logica (desmarcar) ...
} finally {
  markingPaidRef.current.delete(lockKey);
}
```

**3. Mover o lock para o inicio da funcao**, antes de qualquer operacao, e o `finally` ao final do bloco try/catch principal.

### Migracao SQL: Unique index parcial

```sql
CREATE UNIQUE INDEX idx_unique_recurring_transaction_per_month
ON public.transactions (user_id, recurring_expense_id, date_trunc('month', date::timestamp))
WHERE recurring_expense_id IS NOT NULL;
```

Isso garante que mesmo com race conditions no front, o banco rejeita a segunda insercao.

### Resumo

| Camada | Protecao |
|--------|----------|
| Front-end (ref lock) | Bloqueia duplo-clique na mesma sessao |
| Front-end (query check) | Verifica no banco antes de inserir |
| Banco (unique index) | Rejeita duplicata mesmo com concorrencia |
