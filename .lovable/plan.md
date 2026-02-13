

## Adicionar mascara de moeda no input de edicao de despesas recorrentes

### Problema
O input de edicao de valor no card de despesas recorrentes nao tem mascara de moeda. O usuario precisa digitar a virgula manualmente e, se nao o fizer, o valor fica errado (ex: digitar "23456" vira R$ 23.456,00 em vez de R$ 234,56).

### Solucao
Aplicar a mesma mascara de moeda (`formatCurrencyInput` / `parseCurrencyToNumber`) ja utilizada em outros formularios do projeto (AddGoalModal, AddAssetModal, AddLiabilityModal).

### Detalhes Tecnicos

**Arquivo:** `src/components/RecurringExpensesCard.tsx`

**1. Importar utilitarios** (linha 2):
Adicionar `formatCurrencyInput` e `parseCurrencyToNumber` ao import de `@/utils/formatters`.

**2. Alterar `handleStartEdit`** (linha 101-104):
Ao iniciar a edicao, formatar o valor existente para exibicao com mascara:
- Converter o valor numerico para centavos (multiplicar por 100), arredondar, e passar para `formatCurrencyInput`
- Ex: valor `3688.50` vira string `"368850"` que o `formatCurrencyInput` formata como `"3.688,50"`

**3. Alterar o `onChange` do Input** (linha 213):
Em vez de `setEditAmount(e.target.value)`, usar:
```text
const inputValue = e.target.value.replace(/[^\d]/g, '');
setEditAmount(formatCurrencyInput(inputValue));
```
Isso remove tudo que nao e digito e reformata automaticamente com virgula decimal.

**4. Alterar `handleSaveEdit`** (linha 111):
Usar `parseCurrencyToNumber(editAmount)` em vez de `parseFloat(editAmount.replace(",", "."))` para converter o valor formatado de volta para numero.

**5. Adicionar prefixo "R$"** no placeholder do Input:
Trocar `placeholder="Valor"` por `placeholder="0,00"` para consistencia visual.

Essas alteracoes seguem exatamente o padrao ja utilizado nos demais formularios do projeto.
