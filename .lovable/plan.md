

# Corrigir scroll em dropdowns - Parte 2: overflow-hidden no Command raiz

## Problema
A correção anterior (`overflow-hidden` -> `overflow-visible` no `CommandGroup`) não resolveu completamente porque o componente raiz `Command` também aplica `overflow-hidden`. Este corta a área rolável do `CommandList`, impedindo o scroll de funcionar mesmo com `overflow-y-auto` aplicado.

## Hierarquia do problema

```text
PopoverContent (portal, sem altura fixa)
  Command (overflow-hidden + h-full)  <-- BLOQUEIA SCROLL
    CommandInput (altura fixa)
    CommandList (max-h-[300px] overflow-y-auto)  <-- deveria rolar
      CommandGroup (overflow-visible - ja corrigido)
        items...
  div (botao gerenciar categorias)
```

O `overflow-hidden` no `Command` combinado com `h-full` (que resolve para `auto` quando o pai não tem altura explicita) cria um contexto que impede o scroll interno do `CommandList`.

## Solução

Alterar o `Command` para usar `overflow-visible` em vez de `overflow-hidden`.

## Detalhes técnicos

**Arquivo:** `src/components/ui/command.tsx`

Na linha 16, dentro do componente `Command`, trocar `overflow-hidden` por `overflow-visible`:

```typescript
// ANTES (linha 16)
"flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground"

// DEPOIS
"flex h-full w-full flex-col overflow-visible rounded-md bg-popover text-popover-foreground"
```

Combinada com a correção já aplicada no `CommandGroup` (linha 90), esta alteração resolve o bloqueio de scroll em cascata. O `CommandList` com `max-h-[300px] overflow-y-auto` poderá finalmente funcionar como esperado.

Componentes afetados positivamente:
- CategoryCombobox (dropdown de categorias)
- CryptoModal (seleção de criptomoedas)
- Qualquer outro combobox baseado no Command do shadcn/ui
