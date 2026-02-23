
# Correcao: Lista de Despesas Recorrentes Cortada

## Problema

A lista de despesas recorrentes dentro do card tem uma altura fixa de 320px (`h-80`), o que corta os itens no meio e forca um scroll desnecessario. O card deveria expandir e a lista deveria ocupar todo o espaco disponivel.

## Causa Raiz

Na linha 193 do `RecurringExpensesCard.tsx`, o container da lista usa `h-80` (altura fixa de 320px). O card ja usa `h-full flex flex-col` e o `CardContent` ja usa `flex-1`, mas o `div` interno ignora isso por ter altura fixa.

## Solucao

Trocar `h-80` por `h-full` no container da lista, para que ele ocupe todo o espaco disponivel dentro do `CardContent`. Manter o `overflow-y-auto` para os casos em que o conteudo exceda o espaco do card.

## Detalhes Tecnicos

### Arquivo: `src/components/RecurringExpensesCard.tsx`

**Linha 193:**
```tsx
// ANTES
<div className="h-80 overflow-y-auto space-y-2">

// DEPOIS
<div className="h-full overflow-y-auto space-y-2">
```

Essa unica alteracao faz a lista preencher todo o espaco vertical disponivel no card, eliminando o corte prematuro dos itens.
