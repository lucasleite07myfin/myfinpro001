# Migration Guide: Leaving Supabase

Este documento oferece um guia completo para migrar do Supabase para outras soluções, mantendo a funcionalidade do MyFin.

## 🎯 Alternativas por Categoria

### 🗂️ Gerenciamento de Estado Global

#### **Zustand** (Recomendado - Simples)
```bash
npm install zustand
```

```typescript
// store/financeStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FinanceState {
  transactions: Transaction[];
  goals: Goal[];
  assets: Asset[];
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (id: string, data: Partial<Transaction>) => void;
}

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, get) => ({
      transactions: [],
      goals: [],
      assets: [],
      addTransaction: (transaction) =>
        set((state) => ({
          transactions: [...state.transactions, transaction],
        })),
      updateTransaction: (id, data) =>
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === id ? { ...t, ...data } : t
          ),
        })),
    }),
    {
      name: 'finance-storage',
    }
  )
);
```

#### **Redux Toolkit + RTK Query** (Para apps complexos)
```bash
npm install @reduxjs/toolkit react-redux
```

```typescript
// store/financeSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface FinanceState {
  transactions: Transaction[];
  loading: boolean;
}

const financeSlice = createSlice({
  name: 'finance',
  initialState: {
    transactions: [],
    loading: false,
  } as FinanceState,
  reducers: {
    addTransaction: (state, action: PayloadAction<Transaction>) => {
      state.transactions.push(action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const { addTransaction, setLoading } = financeSlice.actions;
export default financeSlice.reducer;
```

### 🔄 Cache de Dados + API Calls

#### **TanStack Query (React Query)** (Recomendado)
```bash
npm install @tanstack/react-query
```

```typescript
// hooks/useTransactions.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

export const useTransactions = () => {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: api.getTransactions,
  });
};

export const useAddTransaction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
};

// Provider setup em main.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Sua app */}
    </QueryClientProvider>
  );
}
```

#### **SWR** (Alternativa simples)
```bash
npm install swr
```

```typescript
// hooks/useTransactions.ts
import useSWR from 'swr';
import { api } from '../services/api';

export const useTransactions = () => {
  const { data, error, mutate } = useSWR('transactions', api.getTransactions);
  
  return {
    transactions: data,
    loading: !error && !data,
    error,
    refetch: mutate,
  };
};
```

### 💾 Persistência de Dados

#### **localStorage/sessionStorage** (Simples)
```typescript
// utils/storage.ts
export const storage = {
  get: <T>(key: string): T | null => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },
  
  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Storage error:', error);
    }
  },
  
  remove: (key: string): void => {
    localStorage.removeItem(key);
  },
};
```

#### **IndexedDB com Dexie.js** (Para dados maiores)
```bash
npm install dexie
```

```typescript
// db/database.ts
import Dexie, { Table } from 'dexie';

export interface Transaction {
  id?: number;
  description: string;
  amount: number;
  date: string;
  category: string;
}

export class MyFinDatabase extends Dexie {
  transactions!: Table<Transaction>;
  goals!: Table<Goal>;
  assets!: Table<Asset>;

  constructor() {
    super('MyFinDatabase');
    this.version(1).stores({
      transactions: '++id, description, amount, date, category',
      goals: '++id, name, targetAmount, currentAmount',
      assets: '++id, name, type, value',
    });
  }
}

export const db = new MyFinDatabase();
```

### 🔐 Autenticação

#### **Clerk** (SaaS - Simples)
```bash
npm install @clerk/clerk-react
```

```typescript
// main.tsx
import { ClerkProvider } from '@clerk/clerk-react';

const PUBLISHABLE_KEY = "pk_test_...";

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
    <App />
  </ClerkProvider>
);
```

#### **Auth0** (Enterprise)
```bash
npm install @auth0/auth0-react
```

#### **Firebase Auth** (Google)
```bash
npm install firebase
```

### 🗄️ Backend/Database

#### **Próprio Backend + PostgreSQL**
- **Node.js + Express + Prisma**
- **Python + FastAPI + SQLAlchemy**
- **Go + Gin + GORM**

#### **Backend as a Service**
- **Firebase** (Google)
- **AWS Amplify**
- **Railway**
- **PlanetScale** (MySQL)

## 🐳 Compatibilidade com Docker

### ✅ Funciona Perfeitamente
- **TanStack Query, SWR** - Client-side, transparente
- **Zustand, Redux** - Estado local, sem problemas
- **localStorage** - Funciona, mas dados não persistem entre containers
- **IndexedDB** - Roda no browser, Docker não afeta

### 🔧 Dockerfile Exemplo
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "dev"]
```

### 🐙 docker-compose.yml
```yaml
version: '3.8'
services:
  frontend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - API_URL=http://backend:8000
      - NODE_ENV=development
    volumes:
      - .:/app
      - /app/node_modules

  backend:
    image: postgres:15
    environment:
      - POSTGRES_DB=myfin
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## 🛠️ Estratégia de Migração

### Fase 1: Preparação
1. **Audit atual**: Liste todas as funcionalidades que usam Supabase
2. **Escolha ferramentas**: Defina stack alternativo
3. **Setup ambiente**: Configure novas dependências

### Fase 2: Migração Gradual
1. **Estado local primeiro**: Migre contexts para Zustand/Redux
2. **API calls**: Substitua por TanStack Query/SWR
3. **Autenticação**: Implemente nova solução auth
4. **Persistência**: Configure storage alternativo

### Fase 3: Limpeza
1. **Remove Supabase**: Desinstale dependências
2. **Update tipos**: Ajuste interfaces TypeScript
3. **Testes**: Valide todas as funcionalidades

## 📋 Checklist de Migração

### Pre-Migration
- [ ] Backup completo dos dados atuais
- [ ] Lista de todas as queries/mutations Supabase
- [ ] Identificação de dependências auth
- [ ] Plan de rollback

### Durante Migração
- [ ] Context → Estado global (Zustand/Redux)
- [ ] useSupabase → TanStack Query/SWR
- [ ] Auth Supabase → Clerk/Auth0/Firebase
- [ ] RLS policies → Validações client/server
- [ ] Real-time → WebSockets/Polling

### Pós-Migration
- [ ] Testes de todas as funcionalidades
- [ ] Performance benchmarking
- [ ] Monitoramento de erros
- [ ] Documentação atualizada

## 💡 Recomendações por Cenário

### 🏠 **App Pessoal/Pequeno**
- **Estado**: Zustand + localStorage
- **API**: TanStack Query + fetch/axios
- **Auth**: Clerk
- **Deploy**: Vercel/Netlify

### 🏢 **App Empresarial/Médio**
- **Estado**: Redux Toolkit + RTK Query
- **Backend**: Node.js + Express + PostgreSQL
- **Auth**: Auth0
- **Deploy**: AWS/Railway

### 🚀 **App Grande/Escalável**
- **Estado**: Redux Toolkit + RTK Query
- **Backend**: Microservices + PostgreSQL
- **Auth**: Custom JWT + Refresh tokens
- **Deploy**: Kubernetes/Docker Swarm

## ⚠️ Considerações Importantes

### Performance
- **localStorage**: ~5-10MB limite
- **IndexedDB**: Sem limite prático
- **Estado global**: Evite objetos muito grandes

### SEO
- **SSR**: Next.js/Remix para SEO crítico
- **Client-only**: SPA adequado para dashboards

### Segurança
- **Nunca**: API keys no frontend
- **Sempre**: Validação server-side
- **HTTPS**: Obrigatório em produção

## 🔗 Links Úteis

- [Zustand Docs](https://zustand-demo.pmnd.rs/)
- [TanStack Query](https://tanstack.com/query)
- [Dexie.js](https://dexie.org/)
- [Clerk Auth](https://clerk.com/)
- [Auth0](https://auth0.com/)
- [Docker Best Practices](https://docs.docker.com/develop/best-practices/)

---

**Última atualização**: 2025-01-17
**Versão**: 1.0