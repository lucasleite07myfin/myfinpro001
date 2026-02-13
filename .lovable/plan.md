

## Despesas Pagas vão para o Final da Fila

### O que muda
Quando uma despesa recorrente for marcada como "Paga", ela desce automaticamente para o final da lista no card, mantendo a cor verde. As despesas pendentes ficam no topo, ordenadas por dia de vencimento.

### Detalhe Tecnico

**Arquivo:** `src/components/RecurringExpensesCard.tsx`

Alterar a logica de ordenacao na linha 146. Atualmente:

```text
const sortedExpenses = [...expenses].sort((a, b) => a.dueDay - b.dueDay);
```

A nova logica vai:
1. Mover para dentro do bloco de renderizacao (apos o `filter`) para ter acesso ao `selectedMonth` e `isPaid`
2. Ordenar primeiro por status de pagamento (nao pagas primeiro, pagas por ultimo)
3. Dentro de cada grupo, manter a ordenacao por dia de vencimento

A ordenacao ficara assim:
- Primeiro criterio: `isPaid(a.id, selectedMonth)` vs `isPaid(b.id, selectedMonth)` -- nao pagas vem antes
- Segundo criterio: `a.dueDay - b.dueDay` -- ordem crescente de vencimento

Nenhuma outra alteracao e necessaria. O estilo verde (`bg-green-50`) ja esta implementado para itens pagos.

