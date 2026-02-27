
# Correcao: Calendario nao responde a cliques dentro de modais

## Problema

O calendario dentro do modal de transacoes (e em todos os outros modais do sistema) nao permite selecionar datas. O usuario ve o calendario aberto mas nao consegue clicar nos dias.

## Causa Raiz

Quando um `Calendar` (DayPicker) e renderizado dentro de um `Dialog` ou `Popover` do Radix UI, os eventos de ponteiro (cliques) sao bloqueados pelo overlay do componente pai. A solucao padrao e adicionar `pointer-events-auto` ao calendario.

O componente `Calendar` em `src/components/ui/calendar.tsx` usa apenas `cn("p-3", className)` -- faltando `pointer-events-auto`. Nenhum dos 5 arquivos que usam o Calendar passa essa classe manualmente.

## Solucao

Adicionar `pointer-events-auto` diretamente no componente base `Calendar`, corrigindo o problema em todo o sistema de uma vez.

## Locais afetados (corrigidos automaticamente)

- `AddTransactionModal.tsx` - datepicker de transacoes
- `PatrimonyModal.tsx` - datas de avaliacao e aquisicao
- `BatchUpdateModal.tsx` - data de avaliacao em lote
- `AddInvestmentModal.tsx` - data do investimento
- `CalendarWithDropdown.tsx` - calendario standalone

## Detalhes Tecnicos

### Arquivo: `src/components/ui/calendar.tsx`

**Linha 21:**
```tsx
// ANTES
className={cn("p-3", className)}

// DEPOIS
className={cn("p-3 pointer-events-auto", className)}
```

Essa unica alteracao garante que o calendario sempre receba eventos de clique, independentemente de estar dentro de um Dialog, Popover ou qualquer outro componente com overlay.
