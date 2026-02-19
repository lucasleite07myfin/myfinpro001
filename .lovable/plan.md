

# Corrigir scroll no dropdown - Solucao via inline styles

## Problema
A barra de rolagem aparece mas nao rola. Isso indica que o CSS `overflow-y: auto` esta sendo reconhecido (a barra e renderizada), porem a interacao de scroll esta sendo bloqueada. As classes Tailwind podem nao estar gerando o CSS correto devido a conflitos entre a configuracao Tailwind v3 (tailwind.config.ts com `require("tailwindcss-animate")`) e diretivas v4 (`@custom-variant`) presentes no `index.css`.

## Causa raiz
As classes utilitarias Tailwind (`overflow-y-auto`, `max-h-[300px]`) aplicadas via `className` no `CommandList` podem nao estar gerando as propriedades CSS corretas ou estao sendo sobrepostas. A regra global `[cmdk-list]` com `!important` mostra a barra mas o container pode nao estar configurado corretamente para permitir scroll interativo.

## Solucao
Aplicar estilos diretamente via prop `style` do React (inline styles) no componente `CommandList`. Inline styles tem a maior prioridade no CSS e nao dependem de nenhum framework de CSS para funcionar.

## Alteracoes

### 1. Alterar CommandList em `src/components/ui/command.tsx`
Adicionar inline styles diretamente no componente para garantir scroll:

```typescript
const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, style, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)}
    style={{
      maxHeight: '300px',
      overflowY: 'auto',
      overflowX: 'hidden',
      ...style,
    }}
    {...props}
  />
))
```

### 2. Manter o CSS global como fallback
A regra `[cmdk-list]` no `index.css` permanece como camada extra de seguranca.

## Por que isso resolve
- Inline styles do React sao aplicados diretamente no atributo `style` do elemento DOM
- Nao dependem do Tailwind, PostCSS, ou qualquer processamento de CSS
- Tem a maior especificidade possivel (exceto `!important`)
- Garantem que `overflow-y: auto` e `max-height: 300px` sejam aplicados corretamente para permitir scroll interativo
