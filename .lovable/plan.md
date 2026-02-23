
# Correcao: Gerenciamento de Categorias Nao Abre

## Problema

Ao clicar em "Gerenciar minhas categorias" no dropdown de categorias, o modal de gerenciamento nao abre. O fluxo envolve fechar 3 componentes em sequencia rapida (Popover -> Dialog -> abrir novo Dialog), causando conflitos de foco e eventos no Radix UI.

## Causa Raiz

No `CategoryCombobox`, o click handler fecha o Popover (`setOpen(false)`) e chama `onManageCategories()` no mesmo ciclo sincrono. O Popover ao fechar pode interferir na propagacao do callback, pois o Radix UI gerencia foco e eventos internamente. Alem disso, o delay de 150ms pode nao ser suficiente para o Radix UI completar suas animacoes e liberacao de focus trap.

## Solucao

Duas alteracoes:

### Arquivo 1: `src/components/CategoryCombobox.tsx`

Adicionar um delay entre fechar o Popover e chamar `onManageCategories()`, garantindo que o Popover finalize sua limpeza antes do callback ser executado.

**Linha ~207-210 (onClick do botao Gerenciar):**
```tsx
// ANTES
onClick={() => {
  setOpen(false);
  onManageCategories();
}}

// DEPOIS
onClick={() => {
  setOpen(false);
  setTimeout(() => {
    onManageCategories?.();
  }, 150);
}}
```

### Arquivo 2: `src/components/AddTransactionModal.tsx`

Aumentar o delay para abrir o ManageCategoriesModal (de 150ms para 300ms) para garantir que o Dialog principal tenha completado seu fechamento antes de abrir o novo Dialog.

**Linhas ~334 e ~387 (onManageCategories callbacks, ambos):**
```tsx
// ANTES
setTimeout(() => setShowManageModal(true), 150);

// DEPOIS
setTimeout(() => setShowManageModal(true), 300);
```

**Linha ~588 (reabrir modal principal apos fechar gerenciador):**
```tsx
// ANTES
setTimeout(() => onOpenChange(true), 150);

// DEPOIS
setTimeout(() => onOpenChange(true), 300);
```

## Resumo dos Delays

O fluxo completo fica:
1. Click em "Gerenciar" -> fecha o Popover
2. Apos 150ms -> fecha o Dialog principal e agenda abertura do gerenciador
3. Apos 300ms do passo 2 -> abre o ManageCategoriesModal

Isso garante que cada componente Radix UI tenha tempo suficiente para completar sua animacao de saida e liberar seu focus trap antes do proximo componente ser manipulado.
