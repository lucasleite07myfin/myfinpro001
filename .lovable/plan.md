

# Correcao: Colunas Desalinhadas na Tabela de Transacoes

## Problema

As colunas do corpo da tabela nao estao alinhadas com o cabecalho. Isso acontece em todas as paginas que usam o componente `TransactionsTable`: Despesas, Receitas, Dashboard pessoal e Dashboard empresarial.

## Causa Raiz

O componente `Table` (em `src/components/ui/table.tsx`) envolve cada `<table>` em um `<div className="relative w-full overflow-auto">`. Como a virtualizacao cria um `<Table>` separado para cada linha, cada linha ganha seu proprio wrapper com `overflow-auto`, calculando larguras independentemente do cabecalho.

## Solucao

Remover o wrapper `overflow-auto` do componente `Table` e controlar o overflow externamente. Isso garante que cabecalho e linhas compartilhem o mesmo contexto de layout.

## Detalhes Tecnicos

### Arquivo 1: `src/components/ui/table.tsx`

Remover o `<div>` wrapper do componente `Table`, fazendo com que ele renderize apenas o `<table>` diretamente:

```tsx
// ANTES
const Table = React.forwardRef(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table ref={ref} className={cn("w-full caption-bottom text-sm", className)} {...props} />
  </div>
))

// DEPOIS
const Table = React.forwardRef(({ className, ...props }, ref) => (
  <table ref={ref} className={cn("w-full caption-bottom text-sm", className)} {...props} />
))
```

### Arquivo 2: `src/components/TransactionsTable.tsx`

Ja possui `overflow-x-auto` no container externo (linha 94) e `overflow-hidden` no container principal (linha 95), entao o controle de overflow esta garantido externamente. Nenhuma mudanca necessaria neste arquivo.

### Verificacao em outros locais

O componente `TransactionsTable` e o unico que usa virtualizacao com multiplas instancias de `<Table>`. Outros usos de `<Table>` no projeto (como tabelas simples em paginas admin) nao sao afetados negativamente pela remocao do wrapper, pois seus containers pai ja controlam o overflow.

**Paginas afetadas (todas corrigidas automaticamente):**
- Despesas (`src/pages/Expenses.tsx`)
- Receitas (`src/pages/Incomes.tsx`)
- Dashboard pessoal (`src/pages/Dashboard.tsx`)
- Dashboard empresarial (`src/pages/business/Dashboard.tsx`)

