

# Correcao: Botao "Gerenciar Categorias" Nao Funciona

## Problema Real

O problema nao e apenas timing/delays. A causa raiz e que o **Popover dentro do Dialog** portala seu conteudo para o `<body>`. Quando o usuario clica em qualquer item do Popover (incluindo "Gerenciar minhas categorias"), o Radix UI Dialog interpreta isso como um clique **fora** do Dialog e fecha o modal inteiro antes que o handler do botao execute.

## Causa Raiz

1. O `PopoverContent` e renderizado via portal no `<body>` (comportamento padrao do Radix)
2. O `DialogContent` detecta cliques fora de si e fecha o Dialog
3. O clique no Popover e interpretado como "fora do Dialog"
4. O Dialog fecha, desmonta o Popover, e o `onClick` do botao nunca executa completamente

## Solucao

Adicionar `onInteractOutside` no `DialogContent` do `AddTransactionModal` para prevenir que o Dialog feche quando o usuario interage com conteudo portalado (como o Popover de categorias).

## Detalhes Tecnicos

### Arquivo: `src/components/AddTransactionModal.tsx`

**Linha 486 - Adicionar handler no DialogContent:**

```tsx
// ANTES
<DialogContent className="sm:max-w-[520px] max-h-[85vh] overflow-y-auto">

// DEPOIS
<DialogContent 
  className="sm:max-w-[520px] max-h-[85vh] overflow-y-auto"
  onInteractOutside={(e) => e.preventDefault()}
>
```

Essa unica alteracao impede que o Dialog feche ao clicar em conteudo portalado (Popover, Select, etc.), mantendo o botao "Gerenciar minhas categorias" funcional.

Os delays adicionados anteriormente (150ms no CategoryCombobox e 300ms no AddTransactionModal) continuam uteis para a transicao entre o fechamento intencional do Dialog e a abertura do ManageCategoriesModal.

