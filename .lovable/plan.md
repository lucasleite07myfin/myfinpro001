

## Correção: Despesas Recorrentes não mantêm status "Pago" após recarregar

### Problema Identificado

No `BusinessContext.tsx`, existem **duas funções** para marcar despesas como pagas:

1. `markRecurringAsPaid` (linha 527) -- persiste corretamente no banco de dados, mas **não é usada**
2. `markRecurringExpenseAsPaid` (linha 570) -- é a função exportada e usada pelo componente, mas **apenas atualiza o estado local** sem salvar no banco

Quando você clica em "Pagar", a mudança aparece na tela, mas ao recarregar a página, os dados são lidos do banco onde o `paid_months` nunca foi atualizado.

### Correção

Reescrever `markRecurringExpenseAsPaid` no `BusinessContext.tsx` para:

1. Persistir o `paid_months` no banco de dados via `supabase.from('emp_recurring_expenses').update({ paid_months })` **antes** de atualizar o estado local
2. Criar a transação de despesa ao marcar como paga (comportamento atual mantido)
3. Remover a transação ao desmarcar (comportamento atual mantido)
4. Remover a função duplicada `markRecurringAsPaid` que não é utilizada

### Detalhes Técnicos

**Arquivo modificado:** `src/contexts/BusinessContext.tsx`

A nova implementação seguirá o padrão já existente no `FinanceContext.tsx` (linhas 694-752), que:
- Atualiza `paid_months` no banco primeiro
- Só atualiza o estado local após confirmação do banco
- Cria/remove transação conforme necessário
- Usa `try/catch` para tratamento de erros
- Usa `silent=true` no `addTransaction` para evitar toast duplicado

A função `markRecurringAsPaid` (linhas 527-557) será removida por ser código morto.

