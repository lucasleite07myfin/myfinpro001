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
  company_name VARCHAR(255), -- Para modo business
  theme VARCHAR(20) DEFAULT 'light', -- 'light' ou 'dark'
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

## 10. HISTÓRICO DE PATRIMÔNIO

### patrimony_history
**Funcionalidade**: Hook usePatrimonyHistory - histórico de evolução patrimonial
```sql
CREATE TABLE patrimony_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_assets_value DECIMAL(15,2) NOT NULL,
  total_liabilities_value DECIMAL(15,2) DEFAULT 0,
  net_worth DECIMAL(15,2) NOT NULL, -- total_assets - total_liabilities
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, date)
);
```

## 11. CONFIGURAÇÕES DE INTERFACE

### user_preferences
**Funcionalidade**: Preferências do usuário (tooltips, filtros, visualizações)
```sql
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  preference_key VARCHAR(100) NOT NULL, -- 'show_high_value_crypto', 'default_month_view', etc.
  preference_value TEXT, -- valor da preferência (JSON se necessário)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, preference_key)
);
```

## 12. DADOS DE MERCADO (CRYPTO)

### crypto_prices
**Funcionalidade**: Cache de preços de criptomoedas do CoinGecko
```sql
CREATE TABLE crypto_prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  symbol VARCHAR(20) NOT NULL, -- BTC, ETH, etc.
  price_brl DECIMAL(15,2) NOT NULL,
  price_usd DECIMAL(15,2) NOT NULL,
  percent_change_24h DECIMAL(5,2),
  last_updated TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### crypto_history
**Funcionalidade**: Histórico de preços para gráficos sparkline
```sql
CREATE TABLE crypto_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  symbol VARCHAR(20) NOT NULL, -- BTC, ETH, etc.
  timestamp TIMESTAMP NOT NULL,
  price_usd DECIMAL(15,2) NOT NULL,
  price_brl DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 13. DADOS MENSAIS AGREGADOS

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
  profit_margin DECIMAL(5,2) DEFAULT 0, -- Para modo business
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, month)
);
```

## 14. INVESTIMENTOS (BUSINESS)

### investments
**Funcionalidade**: Módulo Business - Controle de investimentos empresariais
```sql
CREATE TABLE investments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL, -- 'fixed_income', 'variable_income', 'real_estate', etc.
  amount DECIMAL(15,2) NOT NULL,
  expected_return DECIMAL(5,2), -- Taxa de retorno esperado %
  risk_level VARCHAR(20), -- 'low', 'medium', 'high'
  maturity_date DATE,
  auto_invest BOOLEAN DEFAULT FALSE,
  installments_total INTEGER,
  installments_paid INTEGER DEFAULT 0,
  installment_value DECIMAL(15,2),
  next_installment_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
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
- Campo company_name para empresas
- Todos os dados são filtrados por usuário e modo

### 5. Alertas → Regras
- alert_logs referencia alert_rules
- Permite histórico completo de notificações

### 6. Badges → Usuários
- Sistema many-to-many entre users e badges
- Rastreia conquistas do usuário

### 7. Patrimônio → Histórico
- patrimony_history calculado automaticamente quando assets/liabilities mudam
- Permite gráficos de evolução patrimonial

### 8. Criptomoedas → Preços de Mercado
- assets com type='crypto' referenciam crypto_prices via symbol
- crypto_history para gráficos sparkline

### 9. Investimentos → Business Context
- investments table específica para modo business
- Diferente dos assets que são patrimônio geral

### 10. Categorias → Personalizadas
- custom_categories extends INCOME_CATEGORIES e EXPENSE_CATEGORIES
- Usuários podem criar categorias próprias por tipo

## ÍNDICES RECOMENDADOS

```sql
-- Performance em consultas frequentes
CREATE INDEX idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX idx_transactions_user_type ON transactions(user_id, type);
CREATE INDEX idx_transactions_user_month ON transactions(user_id, date_part('year', date), date_part('month', date));
CREATE INDEX idx_recurring_expenses_user ON recurring_expenses(user_id);
CREATE INDEX idx_goals_user ON goals(user_id);
CREATE INDEX idx_assets_user ON assets(user_id);
CREATE INDEX idx_assets_crypto ON assets(user_id, type) WHERE type = 'crypto';
CREATE INDEX idx_liabilities_user ON liabilities(user_id);
CREATE INDEX idx_suppliers_user ON suppliers(user_id);
CREATE INDEX idx_suppliers_document ON suppliers(user_id, document);
CREATE INDEX idx_investments_user ON investments(user_id);
CREATE INDEX idx_alert_logs_user_unread ON alert_logs(user_id, read) WHERE read = FALSE;
CREATE INDEX idx_badges_user ON user_badges(user_id);
CREATE INDEX idx_health_snapshots_user_date ON health_snapshots(user_id, snapshot_date DESC);
CREATE INDEX idx_patrimony_history_user_date ON patrimony_history(user_id, date DESC);
CREATE INDEX idx_crypto_prices_symbol ON crypto_prices(symbol, last_updated DESC);
CREATE INDEX idx_crypto_history_symbol_time ON crypto_history(symbol, timestamp DESC);
CREATE INDEX idx_custom_categories_user_type ON custom_categories(user_id, type);
CREATE INDEX idx_monthly_data_user_month ON monthly_finance_data(user_id, month DESC);
```

## FUNCIONALIDADES ESPECÍFICAS IDENTIFICADAS

### Sistema de Tooltips
- Arquivo `src/data/tooltipContent.ts` com conteúdo organizado
- Componente `TooltipHelper` usado em toda aplicação
- Pode ser armazenado como configuração estática ou em `user_preferences`

### Categorias Padrão do Sistema
```sql
-- Categorias de receita padrão
INCOME_CATEGORIES = ['Salário', 'Freelance', 'Investimentos', 'Presente', 'Reembolso', 'Outros']

-- Categorias de despesa padrão  
EXPENSE_CATEGORIES = ['Alimentação', 'Moradia', 'Transporte', 'Saúde', 'Educação', 'Lazer', 'Vestuário', 'Serviços', 'Impostos', 'Poupança para Metas', 'Investimentos', 'Outros']

-- Métodos de pagamento padrão
PAYMENT_METHODS = ['cash', 'credit_card', 'debit_card', 'bank_transfer', 'pix', 'other']
```

### Tipos de Assets Suportados
- real_estate, vehicle, crypto, stocks, fixed_income, etc.
- Campos específicos para crypto: symbol, quantity, wallet, lastPriceBrl

### Sistema de Badges Identificado
- Códigos: STREAK_30, GOAL_DONE, EMERGENCY_6M, GROWTH_POSITIVE, FIRST_INVESTMENT, BUDGET_MASTER
- Icons customizados por código
- Sistema de conquistas baseado em métricas

## MIGRAÇÃO DO MOCK

Para migrar do sistema atual:

1. **Contextos FinanceContext/BusinessContext** → Substituir por chamadas à API/Supabase
2. **localStorage (app_mode, theme)** → Campos em users table
3. **Arrays em memória** → Queries SQL com paginação e cache
4. **usePatrimonyHistory hook** → Triggers automáticos na patrimony_history
5. **BTCNowCard API calls** → Cache em crypto_prices/crypto_history
6. **Categorias customizadas** → Migrar para custom_categories table
7. **Cálculos em tempo real** → Cache em monthly_finance_data para performance
8. **Validações client-side** → Manter + adicionar validações server-side
9. **Badges mock data** → Popular badges table com dados reais
10. **Tooltips estáticos** → Considerar armazenar em user_preferences se personalizáveis

## PRÓXIMOS PASSOS

1. Configurar Supabase com todas essas tabelas
2. Implementar autenticação com users (incluindo app_mode e company_name)
3. Criar seeds para badges, categorias padrão e crypto_prices
4. Migrar contexts para hooks que consomem Supabase
5. Implementar RLS (Row Level Security) para isolamento por usuário
6. Criar triggers para:
   - Calcular monthly_finance_data automaticamente
   - Atualizar patrimony_history quando assets/liabilities mudam
   - Verificar conquistas de badges automaticamente
7. Implementar cache/sync para crypto_prices via CoinGecko API
8. Migrar sistema de tooltips e preferências do usuário