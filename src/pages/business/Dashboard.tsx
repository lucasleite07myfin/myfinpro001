import React from 'react';
import { useAppMode } from '@/contexts/AppModeContext';
import { useBusiness } from '@/contexts/BusinessContext';
import StatsCard from '@/components/StatsCard';
import { Card, CardContent } from '@/components/ui/card';
import { formatPercent } from '@/utils/formatters';
import FinanceChart from '@/components/FinanceChart';
import { Coins, TrendingDown, Wallet, PiggyBank } from 'lucide-react';
import TransactionsTable from '@/components/TransactionsTable';
import RecurringExpensesCard from '@/components/RecurringExpensesCard';
import TooltipHelper from '@/components/TooltipHelper';
import { tooltipContent } from '@/data/tooltipContent';

const BusinessDashboard: React.FC = () => {
  const { mode } = useAppMode();
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
    setMonthlyExpenseValue
  } = useBusiness();
  const { income, expense, balance } = getMonthTotals();

  // Calculate profit margin
  const profitMargin = income > 0 ? ((income - expense) / income) * 100 : 0;

  // Get recent transactions
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <h1 className="text-2xl font-bold dark:text-white">Dashboard Empresarial</h1>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
        <TooltipHelper content={tooltipContent.dashboard.receitasCard}>
          <StatsCard
            title="Receitas do Mês"
            value={income}
            isCurrency
            icon={<Coins className="h-5 w-5 text-income-force" />}
            trend={12}
            description="Comparado ao mês anterior"
          />
        </TooltipHelper>
        
        <TooltipHelper content={tooltipContent.dashboard.despesasCard}>
          <StatsCard
            title="Despesas do Mês"
            value={expense}
            isCurrency
            icon={<TrendingDown className="h-5 w-5 text-expense-force" />}
            trend={-5}
            description="Comparado ao mês anterior"
            trendInverted
          />
        </TooltipHelper>
        
        <TooltipHelper content={tooltipContent.dashboard.lucroCard}>
          <StatsCard
            title="Lucro Operacional"
            value={balance}
            isCurrency
            icon={<Wallet className="h-5 w-5" />}
            trend={15}
            description="Comparado ao mês anterior"
          />
        </TooltipHelper>
        
        <TooltipHelper content={tooltipContent.dashboard.margemCard}>
          <StatsCard
            title="Margem de Lucro"
            value={profitMargin}
            isPercentage
            icon={<PiggyBank className="h-5 w-5" />}
            trend={5}
            description="Comparado ao mês anterior"
          />
        </TooltipHelper>
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
            <h2 className="text-xl font-semibold mb-4 text-neutral-800 dark:text-white">Transações Recentes</h2>
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
