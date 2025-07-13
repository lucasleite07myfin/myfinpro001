# MyFin - Estrutura de Banco de Dados

Este documento define as tabelas necessárias para migrar o sistema MyFin do mock atual para um banco de dados real, baseado nas funcionalidades existentes.

## 1. AUTENTICAÇÃO E USUÁRIOS

### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  app_mode VARCHAR(20) DEFAULT 'personal', -- 'personal' ou 'business'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 2. TRANSAÇÕES FINANCEIRAS

### transactions
**Funcionalidade**: Dashboard, Receitas, Despesas, DRE, Fluxo de Caixa
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  description VARCHAR(500) NOT NULL,
  category VARCHAR(100) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  type VARCHAR(20) NOT NULL, -- 'income' ou 'expense'
  payment_method VARCHAR(50), -- 'cash', 'credit_card', 'debit_card', 'bank_transfer', 'pix', 'other'
  is_recurring_payment BOOLEAN DEFAULT FALSE,
  recurring_expense_id UUID REFERENCES recurring_expenses(id),
  is_goal_contribution BOOLEAN DEFAULT FALSE,
  goal_id UUID REFERENCES goals(id),
  is_investment_contribution BOOLEAN DEFAULT FALSE,
  investment_id UUID REFERENCES assets(id),
  source VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### recurring_expenses
**Funcionalidade**: Dashboard, Despesas recorrentes, DRE
```sql
CREATE TABLE recurring_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  description VARCHAR(500) NOT NULL,
  category VARCHAR(100) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  due_day INTEGER NOT NULL CHECK (due_day >= 1 AND due_day <= 31),
  payment_method VARCHAR(50),
  is_paid BOOLEAN DEFAULT FALSE,
  paid_months TEXT[], -- Array de strings no formato "YYYY-MM"
  repeat_months INTEGER, -- NULL = infinito
  monthly_values JSONB, -- {"2024-01": 100.50, "2024-02": 105.00}
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 3. METAS E POUPANÇA

### goals
**Funcionalidade**: Metas, Dashboard (contribuições)
```sql
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  target_amount DECIMAL(15,2) NOT NULL,
  current_amount DECIMAL(15,2) DEFAULT 0,
  target_date DATE NOT NULL,
  saving_location VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 4. PATRIMÔNIO

### assets
**Funcionalidade**: Patrimônio, Investimentos, Crypto
```sql
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL, -- 'real_estate', 'vehicle', 'crypto', 'stocks', etc.
  value DECIMAL(15,2) NOT NULL,
  evaluation_date DATE,
  acquisition_value DECIMAL(15,2),
  acquisition_date DATE,
  location VARCHAR(255),
  insured BOOLEAN DEFAULT FALSE,
  notes TEXT,
  -- Campos específicos para cripto/investimentos
  symbol VARCHAR(20), -- BTC, ETH, PETR4, etc.
  quantity DECIMAL(20,8),
  wallet VARCHAR(255),
  last_price_brl DECIMAL(15,2),
  last_updated TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### liabilities
**Funcionalidade**: Patrimônio (passivos)
```sql
CREATE TABLE liabilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  value DECIMAL(15,2) NOT NULL,
  type VARCHAR(100) NOT NULL, -- 'loan', 'financing', 'credit_card', etc.
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 5. FORNECEDORES (BUSINESS)

### suppliers
**Funcionalidade**: Módulo Business - Fornecedores
```sql
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  document VARCHAR(20) NOT NULL, -- CNPJ ou CPF
  is_company BOOLEAN NOT NULL, -- true para CNPJ, false para CPF
  state_registration VARCHAR(50),
  -- Endereço (JSONB para flexibilidade)
  address JSONB, -- {"street": "", "number": "", "city": "", etc.}
  phone VARCHAR(20),
  email VARCHAR(255),
  contact_person VARCHAR(255),
  product_type VARCHAR(100) NOT NULL,
  other_product_type VARCHAR(255),
  payment_terms VARCHAR(500),
  -- Informações bancárias
  bank_info JSONB, -- {"bank": "", "agency": "", "account": ""}
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 6. ALERTAS E NOTIFICAÇÕES

### alert_rules
**Funcionalidade**: Página de Alertas, configuração de regras
```sql
CREATE TABLE alert_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  rule_type VARCHAR(50) NOT NULL, -- 'overspend', 'low_balance', 'unusual_tx', 'bill_due'
  category_id VARCHAR(100), -- categoria da transação
  account_id UUID, -- pode referenciar assets no futuro
  threshold_value DECIMAL(15,2),
  threshold_percent DECIMAL(5,2),
  days_before_due INTEGER,
  notification_channel TEXT[], -- ['email', 'push', 'sms']
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### alert_logs
**Funcionalidade**: Histórico de alertas disparados
```sql
CREATE TABLE alert_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_rule_id UUID REFERENCES alert_rules(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  triggered_at TIMESTAMP DEFAULT NOW(),
  read BOOLEAN DEFAULT FALSE
);
```

## 7. GAMIFICAÇÃO

### badges
**Funcionalidade**: Sistema de conquistas
```sql
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### user_badges
**Funcionalidade**: Badges conquistadas pelo usuário
```sql
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);
```

## 8. SAÚDE FINANCEIRA

### health_snapshots
**Funcionalidade**: Histórico de saúde financeira
```sql
CREATE TABLE health_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  savings_rate_pct DECIMAL(5,2), -- taxa de poupança %
  debt_income_pct DECIMAL(5,2), -- dívida/renda %
  months_emergency_fund DECIMAL(5,2), -- meses de reserva
  net_worth_growth_12m DECIMAL(5,2), -- crescimento patrimônio 12m %
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, snapshot_date)
);
```

## 9. CATEGORIAS PERSONALIZADAS

### custom_categories
**Funcionalidade**: Categorias personalizadas do usuário
```sql
CREATE TABLE custom_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL, -- 'income' ou 'expense'
  category_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, type, category_name)
);
```

## 10. DADOS MENSAIS AGREGADOS

### monthly_finance_data
**Funcionalidade**: Cache de dados mensais para performance
```sql
CREATE TABLE monthly_finance_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  month VARCHAR(7) NOT NULL, -- formato "YYYY-MM"
  income_total DECIMAL(15,2) DEFAULT 0,
  expense_total DECIMAL(15,2) DEFAULT 0,
  balance DECIMAL(15,2) DEFAULT 0,
  savings_rate DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, month)
);
```

## RELACIONAMENTOS PRINCIPAIS

### 1. Transações → Metas
- Uma transação pode ser contribuição para uma meta (goal_id)
- Permite rastrear progresso das metas através das transações

### 2. Transações → Despesas Recorrentes
- Transações geradas automaticamente de despesas recorrentes (recurring_expense_id)
- Permite controle de pagamentos mensais

### 3. Transações → Investimentos
- Transações de investimento referenciam assets (investment_id)
- Permite rastrear aportes em investimentos

### 4. Usuário → Modo Aplicativo
- Campo app_mode em users define contexto (pessoal/empresarial)
- Todos os dados são filtrados por usuário e modo

### 5. Alertas → Regras
- alert_logs referencia alert_rules
- Permite histórico completo de notificações

### 6. Badges → Usuários
- Sistema many-to-many entre users e badges
- Rastreia conquistas do usuário

## ÍNDICES RECOMENDADOS

```sql
-- Performance em consultas frequentes
CREATE INDEX idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX idx_transactions_user_type ON transactions(user_id, type);
CREATE INDEX idx_transactions_user_month ON transactions(user_id, date_part('year', date), date_part('month', date));
CREATE INDEX idx_recurring_expenses_user ON recurring_expenses(user_id);
CREATE INDEX idx_goals_user ON goals(user_id);
CREATE INDEX idx_assets_user ON assets(user_id);
CREATE INDEX idx_alert_logs_user_unread ON alert_logs(user_id, read) WHERE read = FALSE;
```

## MIGRAÇÃO DO MOCK

Para migrar do sistema atual:

1. **Contextos FinanceContext/BusinessContext** → Substituir por chamadas à API/Supabase
2. **localStorage** → Dados persistidos no banco
3. **Arrays em memória** → Queries SQL com paginação
4. **Cálculos em tempo real** → Cache em monthly_finance_data para performance
5. **Validações client-side** → Manter + adicionar validações server-side

## PRÓXIMOS PASSOS

1. Configurar Supabase com essas tabelas
2. Implementar autenticação com users
3. Migrar contexts para hooks que consomem Supabase
4. Implementar RLS (Row Level Security) para isolamento por usuário
5. Criar triggers para calcular monthly_finance_data automaticamente