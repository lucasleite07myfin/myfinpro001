

# Corrigir scroll no dropdown de categorias - Solucao definitiva

## Problema
As alteracoes anteriores (overflow-visible no Command e CommandGroup) nao resolveram o problema de scroll. As classes Tailwind `overflow-y-auto` e `max-h-[300px]` no `CommandList` nao estao sendo aplicadas efetivamente ao elemento `[cmdk-list]` renderizado pela biblioteca cmdk. O conteudo e cortado sem barra de rolagem.

## Causa raiz
A biblioteca cmdk renderiza internamente um wrapper `[cmdk-list-sizer]` dentro do `[cmdk-list]`. A combinacao do setup CSS do projeto (Tailwind v3 config + diretivas v4) com as classes utilitarias pode gerar conflitos de especificidade, fazendo com que o `overflow-y: auto` nao seja aplicado corretamente.

## Solucao
Aplicar estilos CSS diretamente via seletores de atributo no `index.css` com `!important`, garantindo que o scroll funcione independente de conflitos de especificidade. Tambem reverter as mudancas anteriores no `Command` que nao surtiram efeito.

## Alteracoes

### 1. Adicionar CSS global para cmdk-list (`src/index.css`)
Adicionar regras CSS usando o seletor de atributo `[cmdk-list]` com `!important` para garantir o scroll:

```css
/* Fix scroll in cmdk dropdowns */
[cmdk-list] {
  max-height: 300px !important;
  overflow-y: auto !important;
}
```

### 2. Reverter overflow-visible no Command (`src/components/ui/command.tsx`)
Reverter a mudanca na linha 16 de volta para `overflow-hidden`, pois a alteracao anterior nao resolveu e pode causar efeitos colaterais visuais:

```typescript
// Reverter para overflow-hidden (linha 16)
"flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground"
```

O `CommandGroup` pode permanecer com `overflow-visible` (linha 90) pois isso e correto para nao cortar itens internos.

## Componentes beneficiados
- CategoryCombobox (dropdown de categorias)
- CryptoModal (selecao de criptomoedas)
- Qualquer combobox baseado no Command do shadcn/ui

