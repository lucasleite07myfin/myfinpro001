

## Corrigir exibicao de centavos ao editar valor de despesa recorrente

### Problema
Ao editar o valor de uma despesa recorrente pelo icone de lapis, o `parseFloat()` nao reconhece a virgula como separador decimal (padrao brasileiro). O valor `3688,50` e interpretado como `3688`, descartando os centavos.

### Solucao
No arquivo `src/components/RecurringExpensesCard.tsx`, na funcao `handleSaveEdit`, substituir a virgula por ponto antes de fazer o `parseFloat`:

```text
// De:
const amount = editAmount.trim() === "" ? null : parseFloat(editAmount);

// Para:
const amount = editAmount.trim() === "" ? null : parseFloat(editAmount.replace(",", "."));
```

Essa alteracao de uma unica linha resolve o problema sem afetar nenhum outro comportamento do componente.

### Arquivo alterado
- `src/components/RecurringExpensesCard.tsx` (linha 117, funcao `handleSaveEdit`)

