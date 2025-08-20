import React from 'react';
import { PiggyBank, CreditCard, ArrowDown, ArrowUp } from 'lucide-react';
import { useFinance } from '@/contexts/FinanceContext';
import EmptyState from '@/components/EmptyState';
import StatsCard from '@/components/StatsCard';
import FinanceChart from '@/components/FinanceChart';
import MonthSelector from '@/components/MonthSelector';
import TransactionsTable from '@/components/TransactionsTable';
import RecurringExpensesCard from '@/components/RecurringExpensesCard';
import { TooltipProvider } from '@/components/ui/tooltip';
import TooltipHelper from '@/components/TooltipHelper';
import { tooltipContent } from '@/data/tooltipContent';

const Dashboard: React.FC = () => {
  const { 
    monthlyData, 
    currentMonth, 
    setCurrentMonth,
    transactions,
    recurringExpenses,
    getMonthTotals,
    markRecurringExpenseAsPaid,
    isRecurringExpensePaid,
    editRecurringExpense,
    deleteRecurringExpense,
    getMonthlyExpenseValue,
    setMonthlyExpenseValue
  } = useFinance();

  const { income, expense, balance, savingRate } = getMonthTotals();

  // Filtrar transações para o mês atual
  const currentMonthTransactions = transactions.filter(t => {
    const transactionMonth = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
    return transactionMonth === currentMonth;
  });

  // Obter as 5 transações mais recentes
  const recentTransactions = [...currentMonthTransactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <TooltipProvider>
      <div>
        <div className="mb-2 md:mb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <h1 className="text-xl md:text-2xl font-bold text-neutral-800 dark:text-white">Dashboard - Visão Rápida</h1>
          <MonthSelector value={currentMonth} onChange={setCurrentMonth} />
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
                  title="Taxa de Poupança" 
                  value={savingRate} 
                  isPercentage 
                  isPositive={savingRate >= 0}
                  icon={<PiggyBank className="h-4 w-4 md:h-5 md:w-5" />} 
                />
              </div>
            </TooltipHelper>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 mb-4 md:mb-6">
          <TooltipHelper content={tooltipContent.dashboard.chart}>
            <div className="lg:col-span-2">
              <FinanceChart data={monthlyData} transactions={transactions} />
            </div>
          </TooltipHelper>
          
          <TooltipHelper content={tooltipContent.dashboard.recurringExpenses}>
            <div className="lg:col-span-1">
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
        </div>

        <div className="mb-4 md:mb-6">
          <h2 className="text-base md:text-lg font-semibold text-[#EE680D] mb-3 md:mb-4">Transações Recentes</h2>
          <TooltipHelper content={tooltipContent.dashboard.transactionsTable}>
            <div>
              {recentTransactions.length === 0 ? (
                <EmptyState
                  title="Nenhuma transação encontrada"
                  description="Comece adicionando suas primeiras receitas e despesas para acompanhar suas finanças."
                  actionLabel="Adicionar Transação"
                  onAction={() => {/* Implementar navegação para adicionar transação */}}
                />
              ) : (
                <TransactionsTable transactions={recentTransactions} />
              )}
            </div>
          </TooltipHelper>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default Dashboard;
