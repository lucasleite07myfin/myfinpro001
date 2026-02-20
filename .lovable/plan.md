
# Correção: Barras de Rolagem Lateral na Tabela de Transações

## Problema

Barras de rolagem horizontais aparecem em cada linha da tabela de transações recentes. Isso acontece porque cada linha virtualizada cria seu próprio elemento `<Table>`, que pode ter uma largura diferente da tabela do cabeçalho.

## Causa Raiz

A virtualização cria um `<Table>` separado para cada linha visível. Cada tabela independente calcula sua própria largura, gerando overflow horizontal individual — resultando nas barras de rolagem indesejadas.

## Solução

Duas alterações no arquivo `src/components/TransactionsTable.tsx`:

1. Adicionar `overflow-hidden` no div wrapper de cada linha virtualizada (linha 140) para impedir que o conteúdo excedente gere scrollbar.

2. Adicionar `table-fixed w-full` nas tabelas (tanto no header quanto nas linhas) para forçar larguras fixas e consistentes entre cabeçalho e corpo.

## Detalhes Técnicos

**Arquivo:** `src/components/TransactionsTable.tsx`

- **Linha 98 (tabela do header):** Adicionar `className="table-fixed w-full"` no componente `<Table>`.
- **Linha 140 (div wrapper da linha):** Adicionar `overflow-hidden` ao className do div.
- **Linha 151 (tabela de cada linha):** Adicionar `className="table-fixed w-full"` no componente `<Table>`.

Estas mudanças garantem que todas as tabelas usem o mesmo layout fixo e que nenhum overflow horizontal apareça nas linhas.
