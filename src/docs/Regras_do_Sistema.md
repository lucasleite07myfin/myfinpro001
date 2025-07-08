
# Regras do Sistema de Finanças Familiares

## 1. Estrutura de Dados

### Transações
- **Tipos**: Receitas (entradas) e Despesas (saídas)
- **Atributos**:
  - ID (único, gerado automaticamente)
  - Data (default = data atual)
  - Descrição (obrigatório)
  - Categoria (obrigatório, selecionado de uma lista pré-definida)
  - Valor (obrigatório, sempre positivo)
  - Forma de pagamento (opcional)

### Categorias
- **Receitas**: Salário, Freelance, Investimentos, Presente, Reembolso, Outros
- **Despesas**: Alimentação, Moradia, Transporte, Saúde, Educação, Lazer, Vestuário, Serviços, Impostos, Outros

### Metas & Poupança
- **Atributos**:
  - ID (único, gerado automaticamente)
  - Nome (obrigatório)
  - Valor-alvo (obrigatório)
  - Saldo atual (inicialmente zero)
  - Data-meta (opcional)

### Patrimônio
- **Tipos**: Ativos e Passivos
- **Atributos**:
  - ID (único, gerado automaticamente)
  - Nome (obrigatório)
  - Valor (obrigatório)
  - Tipo (obrigatório: imóvel, veículo, investimento, etc.)

## 2. Lógicas de Negócio

### Cálculo de Totais
- **Total de Receitas**: Soma de todas as receitas no período selecionado
- **Total de Despesas**: Soma de todas as despesas no período selecionado
- **Fluxo de Caixa**: Total de Receitas - Total de Despesas
- **Taxa de Poupança**: (Total de Receitas - Total de Despesas) / Total de Receitas * 100

### Filtros e Ordenação
- As transações podem ser filtradas por:
  - Período (mês/ano)
  - Categoria
  - Descrição (busca textual)
- As transações são ordenadas por data (mais recentes primeiro)

### Exportação
- É possível exportar as despesas em formato CSV, contendo:
  - Data
  - Descrição
  - Categoria
  - Valor
  - Forma de pagamento

## 3. Gatilhos e Automações

### Ao Adicionar/Editar Transação
- Recalcula totais de receitas e despesas
- Atualiza o fluxo de caixa
- Recalcula a taxa de poupança
- Atualiza os dados do gráfico de receitas x despesas

### Provisão Mensal para Despesas Anuais
- Para despesas que ocorrem anualmente, o sistema calcula o valor mensal equivalente (Valor ÷ 12)
- Este valor é incluído nas projeções mensais

## 4. Validações

### Transações
- Data: Não pode ser vazia
- Descrição: Não pode ser vazia
- Categoria: Deve ser selecionada de uma lista predefinida
- Valor: Deve ser maior que zero
- Forma de pagamento: Opcional, mas deve ser válida se informada

### Metas
- Nome: Não pode ser vazio
- Valor-alvo: Deve ser maior que zero
- Saldo atual: Não pode ser negativo
- Data-meta: Se informada, deve ser uma data futura

## 5. Segurança

### Autenticação
- Login por e-mail e senha
- Opção de autenticação de dois fatores (2FA)

### Backup
- Backup automático diário dos dados financeiros
- Possibilidade de exportação manual dos dados

## 6. Considerações Futuras

### Integrações
- Importação de extratos bancários
- Conexão com aplicativos de bancos e cartões de crédito
- Sincronização com serviços de contabilidade

### Funcionalidades Adicionais
- Previsão de gastos com base no histórico
- Alertas de orçamento excedido
- Recomendações de economia
- Compartilhamento de gestão financeira com membros da família
