
# Corrigir scroll em dropdowns e listas com barra de rolagem

## Problema
O dropdown de categorias (e potencialmente outros que usam `CommandList`) nao permite rolar para ver todas as opcoes. A causa raiz esta no componente `CommandGroup` em `src/components/ui/command.tsx`, que aplica `overflow-hidden` e corta o conteudo rolavel do `CommandList`.

## Solucao
Alterar o `CommandGroup` para usar `overflow-visible` em vez de `overflow-hidden`, permitindo que o scroll do `CommandList` funcione corretamente.

## Detalhes tecnicos

**Arquivo:** `src/components/ui/command.tsx`

Na linha 90, dentro do `CommandGroup`, trocar `overflow-hidden` por `overflow-visible`:

```typescript
// ANTES (linha 90)
"overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 ..."

// DEPOIS
"overflow-visible p-1 text-foreground [&_[cmdk-group-heading]]:px-2 ..."
```

Essa unica alteracao resolve o problema em todos os componentes que usam `CommandGroup` dentro de um `CommandList`, incluindo:
- `CategoryCombobox` (dropdown de categorias)
- `CryptoModal` (selecao de criptomoedas)
- Qualquer outro combobox que use o padrao Command do shadcn/ui
