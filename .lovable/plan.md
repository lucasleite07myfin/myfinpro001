

# Analise Completa do Sistema MyFin - Bugs e Problemas Encontrados

## Problemas Identificados

### 1. Bug Critico: Hook Condicional no Header (Viola Regras do React)

No arquivo `src/components/Header.tsx`, linha 26:
```typescript
const business = mode === 'business' ? useBusiness() : null;
```
Hooks do React **nunca** podem ser chamados condicionalmente. Isso viola as regras dos Hooks e pode causar crashes intermitentes, comportamento imprevisivel e erros de renderizacao.

**Correcao:** Sempre chamar o hook e usar o valor condicionalmente.

---

### 2. Arquivo Duplicado Desnecessario

O arquivo `src/pages/business/CashFlow 2.tsx` (609 linhas) e uma copia antiga de `CashFlow.tsx`. Nao e importado em nenhum lugar, mas polui o projeto e pode confundir durante manutencao.

**Correcao:** Remover o arquivo.

---

### 3. CORS Headers Incompletos nas Edge Functions

Todas as edge functions usam:
```typescript
"Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
```
Faltam os headers do Supabase client que sao enviados automaticamente: `x-supabase-client-platform`, `x-supabase-client-platform-version`, `x-supabase-client-runtime`, `x-supabase-client-runtime-version`. Isso pode causar falhas CORS em alguns navegadores.

**Correcao:** Atualizar os CORS headers em todas as edge functions.

---

### 4. Chamadas Excessivas a `supabase.auth.getUser()`

Os contextos `FinanceContext` e `BusinessContext` ja recebem o `user` via `useUser()`, mas em cada operacao de CRUD chamam `supabase.auth.getUser()` novamente (encontrado em 150+ ocorrencias). Isso gera requisicoes desnecessarias ao backend de autenticacao, causando lentidao.

**Correcao:** Usar o `user` ja disponivel do contexto `UserContext` em vez de chamar `getUser()` repetidamente.

---

### 5. RLS Permissiva nas Tabelas `rate_limit_attempts` e `subscriptions`

As tabelas `rate_limit_attempts` e `subscriptions` possuem politicas com `USING (true)` e `WITH CHECK (true)` para o comando `ALL`. Embora sejam destinadas ao service role, na pratica qualquer usuario autenticado consegue ler/escrever nessas tabelas.

**Correcao:** Restringir as politicas para que apenas o service role (via edge functions) possa manipular esses dados, e usuarios so possam ler seus proprios registros.

---

### 6. Falta de autocomplete nos campos de senha

O console reporta que inputs de senha nao possuem atributo `autocomplete`, o que afeta acessibilidade e UX.

**Correcao:** Adicionar `autoComplete="current-password"` e `autoComplete="new-password"` nos inputs adequados.

---

## Plano de Implementacao

### Passo 1: Corrigir Hook Condicional no Header
- Arquivo: `src/components/Header.tsx`
- Chamar `useBusiness()` sempre e usar o resultado condicionalmente
- Isso requer que `useBusiness` nao lance erro quando chamado fora do modo business (ja esta dentro do `BusinessProvider`)

### Passo 2: Remover Arquivo Duplicado
- Deletar `src/pages/business/CashFlow 2.tsx`

### Passo 3: Atualizar CORS Headers
- Atualizar todos os 18 arquivos em `supabase/functions/*/index.ts`
- Usar os headers completos recomendados

### Passo 4: Adicionar autocomplete nos inputs de Auth
- Arquivo: `src/pages/Auth.tsx`
- Adicionar atributos `autoComplete` nos campos de email e senha

### Passo 5: Corrigir RLS das tabelas `rate_limit_attempts` e `subscriptions`
- Criar migracao SQL para restringir as politicas permissivas
- `rate_limit_attempts`: bloquear acesso direto para usuarios (apenas service role)
- `subscriptions`: manter SELECT para o proprio usuario, bloquear INSERT/UPDATE/DELETE direto

### Passo 6: Reduzir chamadas `getUser()` redundantes
- Nos contextos `FinanceContext` e `BusinessContext`, usar o `user` ja disponivel em vez de chamar `getUser()` em cada operacao

---

## Secao Tecnica - Detalhes

### Header.tsx - Hook Fix
```typescript
// ANTES (bug):
const business = mode === 'business' ? useBusiness() : null;

// DEPOIS (correto):
const business = useBusiness();
// usar business.companyName apenas quando mode === 'business'
```

### CORS Headers Atualizados
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};
```

### RLS Migration
```sql
-- rate_limit_attempts: bloquear acesso direto
DROP POLICY "Service role can manage rate limits" ON rate_limit_attempts;
CREATE POLICY "No direct access" ON rate_limit_attempts FOR ALL USING (false);

-- subscriptions: restringir escrita
DROP POLICY "Service role can manage subscriptions" ON subscriptions;
CREATE POLICY "No direct write" ON subscriptions FOR INSERT WITH CHECK (false);
CREATE POLICY "No direct update" ON subscriptions FOR UPDATE USING (false);
CREATE POLICY "No direct delete" ON subscriptions FOR DELETE USING (false);
```

