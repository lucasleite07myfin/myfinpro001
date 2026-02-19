
# Deduplicar updateMonthlyData com Debounce

## Problema

`updateMonthlyData()` e chamada multiplas vezes por operacao:

- `addTransaction`: chamada direta (linha 294) + useEffect (linha 1109) = **2x**
- `editTransaction`: chamada direta (linha 324) + useEffect = **2x**
- `deleteTransaction`: chamada direta (linha 341) + useEffect = **2x**
- `markRecurringExpenseAsPaid`: chama addTransaction/deleteTransaction (que ja chamam updateMonthlyData) + chamada propria (linha 744) + useEffect = **ate 3x**

Isso gera writes desnecessarios no banco e lag na UI.

## Solucao

1. Remover todas as 4 chamadas diretas de `updateMonthlyData()` apos CRUD
2. Manter somente o `useEffect` (linha 1109) como unico ponto de atualizacao
3. Adicionar debounce de 500ms no useEffect, com cancelamento se `transactions` mudar novamente
4. Nao executar durante `loading === true`

## Secao Tecnica

### Passo 1: Remover chamadas diretas

Remover `updateMonthlyData();` nas linhas:
- 294 (apos addTransaction)
- 324 (apos editTransaction)
- 341 (apos deleteTransaction)
- 744 (apos markRecurringExpenseAsPaid)

### Passo 2: Adicionar useRef para debounce e refatorar useEffect

```typescript
import { useRef } from 'react';

// Dentro do provider, junto com os outros estados:
const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

// Substituir o useEffect atual (linhas 1108-1111):
useEffect(() => {
  if (loading) return;

  if (debounceTimerRef.current) {
    clearTimeout(debounceTimerRef.current);
  }

  debounceTimerRef.current = setTimeout(() => {
    updateMonthlyData();
  }, 500);

  return () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  };
}, [transactions, currentMonth]);
```

### Passo 3: Cleanup no unmount

O `return` do useEffect ja cuida do cleanup. Nenhuma acao adicional necessaria.

### Resultado

| Antes | Depois |
|-------|--------|
| 2-3 chamadas por operacao | 1 chamada com debounce de 500ms |
| Writes duplicados no banco | Write unico apos estabilizacao |
| Lag na UI por reprocessamento | UI responsiva |

### Arquivo afetado

- `src/contexts/FinanceContext.tsx`
