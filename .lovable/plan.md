

## Adicionar Forma de Pagamento nas Despesas Recorrentes

### Problema
O formulario de despesas recorrentes nao inclui o campo "Forma de Pagamento", embora o estado (`paymentMethod`) ja exista e ja seja enviado ao salvar.

### Solucao
Adicionar o campo de selecao de forma de pagamento no formulario de despesas recorrentes (`renderRecurringForm`) dentro do `AddTransactionModal.tsx`.

### Detalhes Tecnicos

**Arquivo:** `src/components/AddTransactionModal.tsx`

Na funcao `renderRecurringForm()`, adicionar o componente `Select` de forma de pagamento logo apos o campo "Dia de Vencimento". O componente sera identico ao ja utilizado no formulario de transacoes normais (`renderTransactionForm`), reutilizando:
- O estado `paymentMethod` ja existente
- A constante `PAYMENT_METHODS` ja importada
- O mesmo estilo visual com `TooltipHelper`

Nenhuma alteracao de banco de dados e necessaria -- a coluna `payment_method` ja existe na tabela `recurring_expenses` e `emp_recurring_expenses`, e o valor ja e enviado pelo `handleSubmitRecurring`.

