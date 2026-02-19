

# Lazy Loading dos Providers por Modo

## Problema

`FinanceProvider` e `BusinessProvider` carregam todos os dados do banco ao montar, independente do modo ativo. Se o usuario esta no modo pessoal, o `BusinessProvider` faz queries desnecessarias (transacoes, fornecedores, investimentos, etc), e vice-versa.

## Restricao Importante

24 componentes chamam `useFinance()` e `useBusiness()` incondicionalmente (regra de hooks do React). Remover um provider da arvore quebraria esses hooks. Por isso, os dois providers continuam montados, mas so carregam dados quando o modo correspondente esta ativo.

## Solucao: Providers Lazy por Modo

### Arquivo: `src/contexts/FinanceContext.tsx`

1. Importar `useAppMode` de `@/contexts/AppModeContext`
2. No `useEffect` de `loadData` (linha ~95), adicionar condicao: so carregar se `mode === 'personal'`
3. Quando `mode` mudar para `personal`, disparar `loadData`
4. Quando `mode` mudar para `business`, limpar estado (reset arrays para `[]`, `loading` para `true`)

```typescript
const { mode } = useAppMode();

useEffect(() => {
  if (user && mode === 'personal') {
    loadData();
    const timer = setTimeout(() => loadSecondaryData(), 500);
    return () => clearTimeout(timer);
  } else if (mode !== 'personal') {
    // Reset state quando sai do modo pessoal
    setTransactions([]);
    setRecurringExpenses([]);
    setGoals([]);
    setAssets([]);
    setLiabilities([]);
    setMonthlyData(generateMonthlyData());
    setLoading(true);
    setSecondaryDataLoaded(false);
  }
}, [user?.id, mode]);
```

### Arquivo: `src/contexts/BusinessContext.tsx`

1. Importar `useAppMode` de `@/contexts/AppModeContext`
2. No `useEffect` de `loadData` (linha ~142), adicionar condicao: so carregar se `mode === 'business'`
3. Quando `mode` mudar para `business`, disparar `loadData`
4. Quando `mode` mudar para `personal`, limpar estado

```typescript
const { mode } = useAppMode();

useEffect(() => {
  if (user && effectiveUserId && mode === 'business') {
    loadData();
  } else if (mode !== 'business') {
    setTransactions([]);
    setRecurringExpenses([]);
    setGoals([]);
    setAssets([]);
    setLiabilities([]);
    setSuppliers([]);
    setInvestments([]);
    setMonthlyData([]);
    setLoading(true);
  }
}, [user?.id, effectiveUserId, mode]);
```

### Debounce existente no FinanceContext

O `useEffect` com debounce que chama `updateMonthlyData` (ja implementado) precisa tambem respeitar o modo. Adicionar guard `if (mode !== 'personal') return;` antes do debounce.

## Resultado

| Cenario | Antes | Depois |
|---------|-------|--------|
| Modo pessoal | 2 providers carregam dados | Apenas FinanceProvider carrega |
| Modo empresarial | 2 providers carregam dados | Apenas BusinessProvider carrega |
| Troca de modo | Dados ja carregados (mas stale) | Recarrega dados frescos do banco |
| Memoria | 2x dados em RAM | 1x dados em RAM |

## Arquivos Afetados

- `src/contexts/FinanceContext.tsx`
- `src/contexts/BusinessContext.tsx`

