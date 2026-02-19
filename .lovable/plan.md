

# Criar AdminRoute para Proteger Painel Administrativo

## Problema Atual

As rotas `/admin/*` no `App.tsx` usam apenas `ProtectedRoute`, que verifica se o usuario esta autenticado, mas **nao verifica se e admin**. A verificacao de admin esta duplicada dentro de cada pagina individualmente (`Dashboard`, `Users`, `Subscriptions`, `AdminCoupons`), o que:

- Permite que qualquer usuario autenticado acesse brevemente o layout admin durante o carregamento
- Duplica logica de protecao em 4 arquivos
- Cria risco de exposicao se um novo admin page for criado sem a verificacao

## Solucao

Criar um componente `AdminRoute` centralizado que verifica `useUserRole()` no nivel da rota, bloqueando acesso antes de renderizar qualquer conteudo admin.

## Implementacao

### Passo 1: Criar componente AdminRoute

Novo arquivo: `src/components/AdminRoute.tsx`

- Usa `useAuth()` para verificar autenticacao
- Usa `useUserRole()` para verificar role admin
- Mostra loading enquanto verifica
- Redireciona para `/` se nao for admin
- Redireciona para `/auth` se nao estiver autenticado

### Passo 2: Atualizar App.tsx

Substituir `ProtectedRoute` por `AdminRoute` nas 4 rotas admin:

```text
/admin         -> AdminRoute + AdminDashboard
/admin/users   -> AdminRoute + AdminUsers  
/admin/subscriptions -> AdminRoute + AdminSubscriptions
/admin/coupons -> AdminRoute + AdminCoupons
```

### Passo 3: Remover verificacao duplicada das paginas admin

Nos 4 arquivos de paginas admin, remover:
- Import e uso de `useUserRole`
- Import e uso de `useAuth` (quando usado apenas para protecao)
- Logica de loading/redirect por role
- Simplificar para renderizar diretamente o conteudo

Arquivos afetados:
- `src/pages/admin/Dashboard.tsx`
- `src/pages/admin/Users.tsx`
- `src/pages/admin/Subscriptions.tsx`
- `src/pages/admin/AdminCoupons.tsx`

## Secao Tecnica

### AdminRoute Component

```typescript
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();

  if (authLoading || roleLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
```

### App.tsx Route Changes

```typescript
// Antes:
<Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />

// Depois:
<Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
```

A verificacao de admin acontece no nivel da rota, antes de qualquer conteudo admin ser renderizado, eliminando o risco de exposicao.

