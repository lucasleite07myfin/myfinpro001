

# Correcao: Acesso ao Gerenciador de Categorias

## Problema

Ao clicar em "Gerenciar minhas categorias" no dropdown de categorias, o modal de gerenciamento nao aparece. Isso acontece porque o `ManageCategoriesModal` (um Dialog Radix) tenta abrir enquanto o `AddTransactionModal` (outro Dialog Radix) ainda esta aberto. O overlay do primeiro Dialog bloqueia/esconde o segundo.

## Causa Raiz

O Radix UI tem um comportamento conhecido onde dois `Dialog` abertos simultaneamente causam conflito de foco e sobreposicao de overlays. O `ManageCategoriesModal` renderiza atras do overlay do `AddTransactionModal`, ficando inacessivel.

## Solucao

Ao clicar em "Gerenciar minhas categorias", **fechar primeiro o AddTransactionModal** e so entao abrir o ManageCategoriesModal. Quando o ManageCategoriesModal fechar, reabrir o AddTransactionModal.

## Detalhes Tecnicos

**Arquivo:** `src/components/AddTransactionModal.tsx`

### Alteracoes:

1. **Fechar o Dialog pai ao abrir o gerenciador** - Modificar o callback `onManageCategories` para fechar o modal de transacao antes de abrir o gerenciador:

```tsx
onManageCategories={() => {
  onOpenChange(false); // fecha o AddTransactionModal
  setTimeout(() => setShowManageModal(true), 150); // abre o gerenciador apos animacao
}}
```

2. **Reabrir o AddTransactionModal ao fechar o gerenciador** - Alterar o `onOpenChange` do `ManageCategoriesModal` para reabrir o modal pai quando o gerenciador fechar:

```tsx
<ManageCategoriesModal
  open={showManageModal}
  onOpenChange={(open) => {
    setShowManageModal(open);
    if (!open) {
      setTimeout(() => onOpenChange(true), 150); // reabre o modal de transacao
    }
  }}
  ...
/>
```

3. **Preservar o estado do formulario** - Ajustar o `useEffect` de reset para nao limpar o formulario quando o modal fecha temporariamente para abrir o gerenciador. Adicionar uma flag `isManagingCategories`:

```tsx
const [isManagingCategories, setIsManagingCategories] = useState(false);

useEffect(() => {
  if (!open && !isManagingCategories) {
    resetForm();
  }
}, [open, isManagingCategories]);
```

4. **Aplicar a mesma correcao** nas duas instancias do `CategoryCombobox` dentro do componente (transacao normal na linha 330 e despesa recorrente na linha 379).

Estas mudancas garantem que o gerenciador de categorias sempre sera visivel e acessivel, sem conflito de Dialogs sobrepostos, e que o formulario do usuario nao sera perdido durante a navegacao.

