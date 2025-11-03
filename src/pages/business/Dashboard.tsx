import React, { useMemo } from 'react';
import { useAppMode } from '@/contexts/AppModeContext';
import { useBusiness } from '@/contexts/BusinessContext';
import { useAuth } from '@/hooks/useAuth';
import StatsCard from '@/components/StatsCard';
import { Card, CardContent } from '@/components/ui/card';
import { formatPercent } from '@/utils/formatters';
import FinanceChart from '@/components/FinanceChart';
import { ArrowUp, ArrowDown, CreditCard, PiggyBank } from 'lucide-react';
import TransactionsTable from '@/components/TransactionsTable';
import RecurringExpensesCard from '@/components/RecurringExpensesCard';
import TooltipHelper from '@/components/TooltipHelper';
import { tooltipContent } from '@/data/tooltipContent';

const BusinessDashboard: React.FC = () => {
  const { mode } = useAppMode();
  const { user } = useAuth();
  const { 
    transactions, 
    monthlyData, 
    getMonthTotals, 
    currentMonth,
    setCurrentMonth,
    recurringExpenses,
    markRecurringExpenseAsPaid,
    isRecurringExpensePaid,
    editRecurringExpense,
    deleteRecurringExpense,
    getMonthlyExpenseValue,
    setMonthlyExpenseValue,
    companyName
  } = useBusiness();
  const { income, expense, balance } = getMonthTotals();

  // Calculate profit margin
  const profitMargin = income > 0 ? ((income - expense) / income) * 100 : 0;

  // Obter nome da empresa ou primeiro nome do usuário como fallback
  const getGreeting = () => {
    // Prioridade 1: Nome da empresa do contexto
    if (companyName && companyName !== 'Minha Empresa') {
      return companyName;
    }
    
    // Prioridade 2: Primeiro nome do usuário
    const fullName = user?.user_metadata?.full_name;
    if (fullName) {
      return fullName.split(' ')[0];
    }
    
    // Fallback: Email
    return user?.email?.split('@')[0] || 'Usuário';
  };

  // Get recent transactions (memoizado)
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [transactions]);

  return (
    <div className="space-y-4">
      <div className="mb-2 md:mb-3 flex justify-between items-start">
        <h1 className="text-xl md:text-2xl font-bold text-neutral-800">Olá, {getGreeting()}</h1>
      </div>

      <div className="mb-4 md:mb-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
          <TooltipHelper content={tooltipContent.dashboard.receitasCard}>
            <div className="w-full">
              <StatsCard 
                title="Receitas" 
                value={income} 
                isCurrency 
                isPositive
                icon={<ArrowUp className="h-4 w-4 md:h-5 md:w-5 text-income-force" />} 
              />
            </div>
          </TooltipHelper>
          
          <TooltipHelper content={tooltipContent.dashboard.despesasCard}>
            <div className="w-full">
              <StatsCard 
                title="Despesas" 
                value={expense} 
                isCurrency 
                isPositive={false}
                icon={<ArrowDown className="h-4 w-4 md:h-5 md:w-5 text-expense-force" />} 
              />
            </div>
          </TooltipHelper>
          
          <TooltipHelper content={tooltipContent.dashboard.lucroCard}>
            <div className="w-full">
              <StatsCard 
                title="Fluxo de Caixa" 
                value={balance} 
                isCurrency 
                isPositive={balance >= 0}
                icon={<CreditCard className="h-4 w-4 md:h-5 md:w-5" />} 
              />
            </div>
          </TooltipHelper>
          
          <TooltipHelper content={tooltipContent.dashboard.margemCard}>
            <div className="w-full">
              <StatsCard 
                title="Margem de Lucro" 
                value={profitMargin} 
                isPercentage 
                isPositive={profitMargin >= 0}
                icon={<PiggyBank className="h-4 w-4 md:h-5 md:w-5" />} 
              />
            </div>
          </TooltipHelper>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna esquerda: Despesas Recorrentes */}
        <TooltipHelper content={tooltipContent.dashboard.recurringExpenses}>
          <div className="lg:col-span-1 h-full">
            <RecurringExpensesCard 
              expenses={recurringExpenses}
              currentMonth={currentMonth}
              isPaid={isRecurringExpensePaid}
              onMarkAsPaid={markRecurringExpenseAsPaid}
              onEdit={editRecurringExpense}
              onDelete={deleteRecurringExpense}
              getMonthlyExpenseValue={getMonthlyExpenseValue}
              setMonthlyExpenseValue={setMonthlyExpenseValue}
            />
          </div>
        </TooltipHelper>
        
        {/* Coluna direita: Evolução Financeira e Transações Recentes */}
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          {/* Evolução Financeira */}
          <TooltipHelper content={tooltipContent.dashboard.chart}>
            <div>
              <FinanceChart data={monthlyData} transactions={transactions} />
            </div>
          </TooltipHelper>
          
          {/* Transações Recentes */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-neutral-800">Transações Recentes</h2>
            <TooltipHelper content={tooltipContent.dashboard.transactionsTable}>
              <TransactionsTable transactions={recentTransactions} />
            </TooltipHelper>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessDashboard;
