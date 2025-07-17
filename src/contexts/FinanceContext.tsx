import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Transaction, Goal, Asset, Liability, MonthlyFinanceData, RecurringExpense, CustomCategories, PaymentMethod } from '@/types/finance';
import { getCurrentMonth } from '@/utils/formatters';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

// Gerar dados de 12 meses para o gráfico
const generateMonthlyData = (): MonthlyFinanceData[] => {
  const data: MonthlyFinanceData[] = [];
  const now = new Date();
  
  for (let i = 11; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStr = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
    
    data.push({
      month: monthStr,
      incomeTotal: 0,
      expenseTotal: 0
    });
  }
  
  return data;
};

interface FinanceContextType {
  transactions: Transaction[];
  recurringExpenses: RecurringExpense[];
  goals: Goal[];
  assets: Asset[];
  liabilities: Liability[];
  monthlyData: MonthlyFinanceData[];
  currentMonth: string;
  setCurrentMonth: (month: string) => void;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  editTransaction: (transaction: Transaction) => void;
  deleteTransaction: (id: string) => void;
  addRecurringExpense: (expense: Omit<RecurringExpense, 'id' | 'isPaid' | 'paidMonths' | 'createdAt'>) => void;
  editRecurringExpense: (expense: RecurringExpense) => void;
  deleteRecurringExpense: (id: string) => void;
  markRecurringExpenseAsPaid: (id: string, month: string, paid: boolean) => void;
  isRecurringExpensePaid: (id: string, month: string) => boolean;
  getMonthlyExpenseValue: (expenseId: string, month: string) => number | null;
  setMonthlyExpenseValue: (expenseId: string, month: string, value: number | null) => void;
  addGoal: (goal: Omit<Goal, 'id'>) => void;
  editGoal: (goal: Goal) => void;
  deleteGoal: (id: string) => void;
  addAsset: (asset: Omit<Asset, 'id'>) => void;
  editAsset: (asset: Asset) => void;
  deleteAsset: (id: string) => void;
  addLiability: (liability: Omit<Liability, 'id'>) => void;
  editLiability: (liability: Liability) => void;
  deleteLiability: (id: string) => void;
  getMonthTotals: () => { income: number; expense: number; balance: number; savingRate: number };
  customCategories: CustomCategories;
  addCustomCategory: (type: 'income' | 'expense', category: string) => void;
}

const FinanceContext = createContext<FinanceContextType | null>(null);

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};

interface FinanceProviderProps {
  children: ReactNode;
}

export const FinanceProvider: React.FC<FinanceProviderProps> = ({ children }) => {
  // Estado principal da aplicação
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyFinanceData[]>(generateMonthlyData());
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth());
  const [customCategories, setCustomCategories] = useState<CustomCategories>({ income: [], expense: [] });
  const [loading, setLoading] = useState(true);

  // Carregar dados do Supabase
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Carregar todos os dados em paralelo
      const [
        transactionsResult,
        recurringResult,
        goalsResult,
        assetsResult,
        liabilitiesResult,
        categoriesResult,
        monthlyResult
      ] = await Promise.all([
        supabase.from('transactions').select('*').eq('user_id', user.id),
        supabase.from('recurring_expenses').select('*').eq('user_id', user.id),
        supabase.from('goals').select('*').eq('user_id', user.id),
        supabase.from('assets').select('*').eq('user_id', user.id),
        supabase.from('liabilities').select('*').eq('user_id', user.id),
        supabase.from('custom_categories').select('*').eq('user_id', user.id),
        supabase.from('monthly_finance_data').select('*').eq('user_id', user.id)
      ]);

      if (transactionsResult.data) {
        const formattedTransactions = transactionsResult.data.map(t => ({
          id: t.id,
          date: new Date(t.date),
          description: t.description,
          category: t.category,
          amount: Number(t.amount),
          type: t.type as 'income' | 'expense',
          paymentMethod: t.payment_method as PaymentMethod,
          source: t.source,
          isRecurringPayment: t.is_recurring_payment || false,
          isGoalContribution: t.is_goal_contribution || false,
          isInvestmentContribution: t.is_investment_contribution || false,
          goalId: t.goal_id,
          investmentId: t.investment_id,
          recurringExpenseId: t.recurring_expense_id
        }));
        setTransactions(formattedTransactions);
      }

      if (recurringResult.data) {
        const formattedExpenses = recurringResult.data.map(e => ({
          id: e.id,
          description: e.description,
          category: e.category,
          amount: Number(e.amount),
          dueDay: e.due_day,
          paymentMethod: e.payment_method as PaymentMethod,
          repeatMonths: e.repeat_months,
          monthlyValues: (e.monthly_values as Record<string, number>) || {},
          isPaid: e.is_paid || false,
          paidMonths: (e.paid_months as string[]) || [],
          createdAt: new Date(e.created_at || new Date())
        }));
        setRecurringExpenses(formattedExpenses);
      }

      if (goalsResult.data) {
        const formattedGoals = goalsResult.data.map(g => ({
          id: g.id,
          name: g.name,
          targetAmount: Number(g.target_amount),
          currentAmount: Number(g.current_amount || 0),
          targetDate: new Date(g.target_date),
          savingLocation: g.saving_location
        }));
        setGoals(formattedGoals);
      }

      if (assetsResult.data) {
        const formattedAssets = assetsResult.data.map(a => ({
          id: a.id,
          name: a.name,
          type: a.type,
          value: Number(a.value),
          evaluationDate: a.evaluation_date ? new Date(a.evaluation_date) : null,
          acquisitionValue: a.acquisition_value ? Number(a.acquisition_value) : undefined,
          acquisitionDate: a.acquisition_date ? new Date(a.acquisition_date) : null,
          insured: a.insured || false,
          wallet: a.wallet,
          symbol: a.symbol,
          notes: a.notes,
          location: a.location,
          lastUpdated: a.last_updated ? new Date(a.last_updated) : null,
          lastPriceBrl: a.last_price_brl ? Number(a.last_price_brl) : undefined,
          quantity: a.quantity ? Number(a.quantity) : undefined
        }));
        setAssets(formattedAssets);
      }

      if (liabilitiesResult.data) {
        const formattedLiabilities = liabilitiesResult.data.map(l => ({
          id: l.id,
          name: l.name,
          type: l.type,
          value: Number(l.value)
        }));
        setLiabilities(formattedLiabilities);
      }

      if (categoriesResult.data) {
        const customCats: CustomCategories = { income: [], expense: [] };
        categoriesResult.data.forEach(cat => {
          if (cat.type === 'income' || cat.type === 'expense') {
            customCats[cat.type].push(cat.category_name);
          }
        });
        setCustomCategories(customCats);
      }

      if (monthlyResult.data) {
        const formattedMonthly = monthlyResult.data.map(m => ({
          month: m.month,
          incomeTotal: Number(m.income_total),
          expenseTotal: Number(m.expense_total)
        }));
        setMonthlyData(formattedMonthly);
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  // Funções para manipular transações
  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          date: transaction.date.toISOString().split('T')[0],
          description: transaction.description,
          category: transaction.category,
          amount: transaction.amount,
          type: transaction.type,
          payment_method: transaction.paymentMethod,
          source: transaction.source,
          is_recurring_payment: transaction.isRecurringPayment || false,
          is_goal_contribution: transaction.isGoalContribution || false,
          is_investment_contribution: transaction.isInvestmentContribution || false,
          goal_id: transaction.goalId,
          investment_id: transaction.investmentId,
          recurring_expense_id: transaction.recurringExpenseId
        })
        .select()
        .single();

      if (error) throw error;

      const newTransaction = {
        ...transaction,
        id: data.id,
        date: new Date(data.date)
      };

      setTransactions([...transactions, newTransaction]);
      toast.success('Transação adicionada com sucesso!');
      updateMonthlyData();
    } catch (error) {
      console.error('Erro ao adicionar transação:', error);
      toast.error('Erro ao adicionar transação');
    }
  };

  const editTransaction = async (transaction: Transaction) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .update({
          date: transaction.date.toISOString().split('T')[0],
          description: transaction.description,
          category: transaction.category,
          amount: transaction.amount,
          type: transaction.type,
          payment_method: transaction.paymentMethod,
          source: transaction.source,
          is_recurring_payment: transaction.isRecurringPayment || false,
          is_goal_contribution: transaction.isGoalContribution || false,
          is_investment_contribution: transaction.isInvestmentContribution || false,
          goal_id: transaction.goalId,
          investment_id: transaction.investmentId,
          recurring_expense_id: transaction.recurringExpenseId
        })
        .eq('id', transaction.id);

      if (error) throw error;

      setTransactions(transactions.map(t => t.id === transaction.id ? transaction : t));
      toast.success('Transação atualizada com sucesso!');
      updateMonthlyData();
    } catch (error) {
      console.error('Erro ao atualizar transação:', error);
      toast.error('Erro ao atualizar transação');
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTransactions(transactions.filter(t => t.id !== id));
      toast.success('Transação excluída com sucesso!');
      updateMonthlyData();
    } catch (error) {
      console.error('Erro ao excluir transação:', error);
      toast.error('Erro ao excluir transação');
    }
  };

  // Funções para manipular categorias customizadas
  const addCustomCategory = async (type: 'income' | 'expense', category: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const categoryToAdd = category.startsWith('Outros: ') ? category : `Outros: ${category}`;
      
      // Verifica se a categoria já existe
      if (customCategories[type].includes(categoryToAdd)) {
        return;
      }

      const { error } = await supabase
        .from('custom_categories')
        .insert({
          user_id: user.id,
          type,
          category_name: categoryToAdd
        });

      if (error) throw error;

      setCustomCategories(prev => ({
        ...prev,
        [type]: [...prev[type], categoryToAdd]
      }));

      toast.success('Categoria personalizada adicionada!');
    } catch (error) {
      console.error('Erro ao adicionar categoria:', error);
      toast.error('Erro ao adicionar categoria');
    }
  };

  // Funções para manipular despesas recorrentes
  const addRecurringExpense = async (expense: Omit<RecurringExpense, 'id' | 'isPaid' | 'paidMonths' | 'createdAt'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('recurring_expenses')
        .insert({
          user_id: user.id,
          description: expense.description,
          category: expense.category,
          amount: expense.amount,
          due_day: expense.dueDay,
          payment_method: expense.paymentMethod,
          repeat_months: expense.repeatMonths || 12,
          monthly_values: {},
          is_paid: false,
          paid_months: []
        })
        .select()
        .single();

      if (error) throw error;

      const newExpense: RecurringExpense = {
        id: data.id,
        description: expense.description,
        category: expense.category,
        amount: expense.amount,
        dueDay: expense.dueDay,
        paymentMethod: expense.paymentMethod,
        repeatMonths: expense.repeatMonths || 12,
        monthlyValues: {},
        isPaid: false,
        paidMonths: [],
        createdAt: new Date(data.created_at)
      };

      setRecurringExpenses([...recurringExpenses, newExpense]);
      toast.success('Despesa fixa adicionada com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar despesa recorrente:', error);
      toast.error('Erro ao adicionar despesa recorrente');
    }
  };

  // Nova função para obter o valor mensal de uma despesa
  const getMonthlyExpenseValue = (expenseId: string, month: string): number | null => {
    const expense = recurringExpenses.find(e => e.id === expenseId);
    if (!expense) return null;
    
    // Se existe um valor específico para este mês, retorna ele
    if (expense.monthlyValues && expense.monthlyValues[month] !== undefined) {
      return expense.monthlyValues[month];
    }
    
    // Se não tem valor específico e o valor base é 0, retorna null (valor não definido)
    if (expense.amount === 0) {
      return null;
    }
    
    // Caso contrário, retorna o valor padrão
    return expense.amount;
  };

  // Nova função para definir o valor mensal de uma despesa
  const setMonthlyExpenseValue = (expenseId: string, month: string, value: number | null) => {
    setRecurringExpenses(recurringExpenses.map(e => {
      if (e.id === expenseId) {
        const monthlyValues = { ...(e.monthlyValues || {}) };
        
        if (value === null) {
          // Remove o valor específico para este mês
          delete monthlyValues[month];
        } else {
          // Define o valor específico para este mês
          monthlyValues[month] = value;
        }
        
        return { ...e, monthlyValues };
      }
      return e;
    }));
  };

  const editRecurringExpense = (expense: RecurringExpense) => {
    setRecurringExpenses(recurringExpenses.map(e => e.id === expense.id ? expense : e));
    
    // Se o valor principal foi alterado (não para um valor mensal específico)
    // e há transações associadas a esta despesa, atualize apenas as futuras
    const relatedTransactions = transactions.filter(t => 
      t.description === `${expense.description} (Despesa Fixa)` &&
      t.isRecurringPayment
    );
    
    if (relatedTransactions.length > 0) {
      // Aqui só atualizamos as transações do mês atual em diante
      // para não afetar os valores históricos
      const updatedTransactions = transactions.map(t => {
        const transactionMonth = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
        const isCurrentOrFutureMonth = transactionMonth >= currentMonth;
        
        if (t.description === `${expense.description} (Despesa Fixa)` && 
            t.isRecurringPayment && 
            isCurrentOrFutureMonth) {
          // Para transações futuras, usamos o valor específico do mês se existir
          // ou o valor padrão se não existir um valor específico
          const monthValue = getMonthlyExpenseValue(expense.id, transactionMonth);
          return { ...t, amount: monthValue !== null ? monthValue : expense.amount };
        }
        return t;
      });
      
      setTransactions(updatedTransactions);
    }
    
    toast.success('Despesa fixa atualizada com sucesso!');
  };

  const deleteRecurringExpense = (id: string) => {
    // Obter a despesa antes de removê-la
    const expenseToDelete = recurringExpenses.find(e => e.id === id);
    
    if (expenseToDelete) {
      // Remover a despesa recorrente
      setRecurringExpenses(recurringExpenses.filter(e => e.id !== id));
      
      // Remover todas as transações associadas a esta despesa recorrente
      const updatedTransactions = transactions.filter(t => 
        !(t.description === `${expenseToDelete.description} (Despesa Fixa)` && t.isRecurringPayment)
      );
      
      if (updatedTransactions.length !== transactions.length) {
        setTransactions(updatedTransactions);
      }
    }
    
    toast.success('Despesa fixa excluída com sucesso!');
  };

  const markRecurringExpenseAsPaid = (id: string, month: string, paid: boolean) => {
    setRecurringExpenses(recurringExpenses.map(e => {
      if (e.id === id) {
        const paidMonths = [...(e.paidMonths || [])];
        
        if (paid && !paidMonths.includes(month)) {
          paidMonths.push(month);
          
          // Adiciona uma transação correspondente
          const date = new Date();
          const [year, monthNum] = month.split('-');
          date.setFullYear(parseInt(year));
          date.setMonth(parseInt(monthNum) - 1);
          date.setDate(e.dueDay);
          
          // Determina o valor a ser usado: valor específico do mês ou valor padrão
          const amount = getMonthlyExpenseValue(e.id, month) || e.amount;
          
          // Só adiciona a transação se houver um valor definido
          if (amount > 0) {
            // Adiciona a transação de pagamento
            const transaction: Omit<Transaction, 'id'> = {
              date,
              description: `${e.description} (Despesa Fixa)`,
              category: e.category,
              amount,
              type: 'expense',
              paymentMethod: e.paymentMethod,
              isRecurringPayment: true
            };
            
            addTransaction(transaction);
          }
        } else if (!paid && paidMonths.includes(month)) {
          // Remove o mês da lista de pagos
          const index = paidMonths.indexOf(month);
          if (index > -1) {
            paidMonths.splice(index, 1);
          }
          
          // Remove a transação correspondente, se existir
          const transactionsToRemove = transactions.filter(t => 
            t.description === `${e.description} (Despesa Fixa)` &&
            t.isRecurringPayment &&
            `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}` === month
          );
          
          transactionsToRemove.forEach(t => {
            deleteTransaction(t.id);
          });
        }
        
        return { ...e, isPaid: paid, paidMonths };
      }
      return e;
    }));
    
    toast.success(`Despesa fixa marcada como ${paid ? 'paga' : 'não paga'}!`);
    updateMonthlyData();
  };

  const isRecurringExpensePaid = (id: string, month: string) => {
    const expense = recurringExpenses.find(e => e.id === id);
    return expense ? (expense.paidMonths || []).includes(month) : false;
  };

  // Funções para manipular metas
  const addGoal = async (goal: Omit<Goal, 'id'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('goals')
        .insert({
          user_id: user.id,
          name: goal.name,
          target_amount: goal.targetAmount,
          current_amount: goal.currentAmount || 0,
          target_date: goal.targetDate.toISOString().split('T')[0],
          saving_location: goal.savingLocation
        })
        .select()
        .single();

      if (error) throw error;

      const newGoal: Goal = {
        id: data.id,
        name: goal.name,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount || 0,
        targetDate: goal.targetDate,
        savingLocation: goal.savingLocation
      };

      setGoals([...goals, newGoal]);
      toast.success('Meta adicionada com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar meta:', error);
      toast.error('Erro ao adicionar meta');
    }
  };

  const editGoal = async (goal: Goal) => {
    try {
      const { error } = await supabase
        .from('goals')
        .update({
          name: goal.name,
          target_amount: goal.targetAmount,
          current_amount: goal.currentAmount,
          target_date: goal.targetDate.toISOString().split('T')[0],
          saving_location: goal.savingLocation
        })
        .eq('id', goal.id);

      if (error) throw error;

      setGoals(goals.map(g => g.id === goal.id ? goal : g));
      toast.success('Meta atualizada com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar meta:', error);
      toast.error('Erro ao atualizar meta');
    }
  };

  const deleteGoal = async (id: string) => {
    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setGoals(goals.filter(g => g.id !== id));
      toast.success('Meta excluída com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir meta:', error);
      toast.error('Erro ao excluir meta');
    }
  };

  // Funções para manipular ativos
  const addAsset = async (asset: Omit<Asset, 'id'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('assets')
        .insert({
          user_id: user.id,
          name: asset.name,
          type: asset.type,
          value: asset.value,
          evaluation_date: asset.evaluationDate?.toISOString().split('T')[0],
          acquisition_value: asset.acquisitionValue,
          acquisition_date: asset.acquisitionDate?.toISOString().split('T')[0],
          insured: asset.insured || false,
          wallet: asset.wallet,
          symbol: asset.symbol,
          notes: asset.notes,
          location: asset.location,
          last_price_brl: asset.lastPriceBrl,
          quantity: asset.quantity
        })
        .select()
        .single();

      if (error) throw error;

      const newAsset: Asset = {
        id: data.id,
        name: asset.name,
        type: asset.type,
        value: asset.value,
        evaluationDate: asset.evaluationDate,
        acquisitionValue: asset.acquisitionValue,
        acquisitionDate: asset.acquisitionDate,
        insured: asset.insured || false,
        wallet: asset.wallet,
        symbol: asset.symbol,
        notes: asset.notes,
        location: asset.location,
        lastUpdated: new Date(),
        lastPriceBrl: asset.lastPriceBrl,
        quantity: asset.quantity
      };

      setAssets([...assets, newAsset]);
      toast.success('Ativo adicionado com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar ativo:', error);
      toast.error('Erro ao adicionar ativo');
    }
  };

  const editAsset = async (asset: Asset) => {
    try {
      const { error } = await supabase
        .from('assets')
        .update({
          name: asset.name,
          type: asset.type,
          value: asset.value,
          evaluation_date: asset.evaluationDate?.toISOString().split('T')[0],
          acquisition_value: asset.acquisitionValue,
          acquisition_date: asset.acquisitionDate?.toISOString().split('T')[0],
          insured: asset.insured,
          wallet: asset.wallet,
          symbol: asset.symbol,
          notes: asset.notes,
          location: asset.location,
          last_price_brl: asset.lastPriceBrl,
          quantity: asset.quantity,
          last_updated: new Date().toISOString()
        })
        .eq('id', asset.id);

      if (error) throw error;

      setAssets(assets.map(a => a.id === asset.id ? asset : a));
      toast.success('Ativo atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar ativo:', error);
      toast.error('Erro ao atualizar ativo');
    }
  };

  const deleteAsset = async (id: string) => {
    try {
      const { error } = await supabase
        .from('assets')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setAssets(assets.filter(a => a.id !== id));
      toast.success('Ativo excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir ativo:', error);
      toast.error('Erro ao excluir ativo');
    }
  };

  // Funções para manipular passivos
  const addLiability = async (liability: Omit<Liability, 'id'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('liabilities')
        .insert({
          user_id: user.id,
          name: liability.name,
          type: liability.type,
          value: liability.value
        })
        .select()
        .single();

      if (error) throw error;

      const newLiability: Liability = {
        id: data.id,
        name: liability.name,
        type: liability.type,
        value: liability.value
      };

      setLiabilities([...liabilities, newLiability]);
      toast.success('Passivo adicionado com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar passivo:', error);
      toast.error('Erro ao adicionar passivo');
    }
  };

  const editLiability = async (liability: Liability) => {
    try {
      const { error } = await supabase
        .from('liabilities')
        .update({
          name: liability.name,
          type: liability.type,
          value: liability.value
        })
        .eq('id', liability.id);

      if (error) throw error;

      setLiabilities(liabilities.map(l => l.id === liability.id ? liability : l));
      toast.success('Passivo atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar passivo:', error);
      toast.error('Erro ao atualizar passivo');
    }
  };

  const deleteLiability = async (id: string) => {
    try {
      const { error } = await supabase
        .from('liabilities')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setLiabilities(liabilities.filter(l => l.id !== id));
      toast.success('Passivo excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir passivo:', error);
      toast.error('Erro ao excluir passivo');
    }
  };

  // Função auxiliar para atualizar dados mensais
  const updateMonthlyData = () => {
    // Na implementação real, você calcularia isso com base nas transações reais
    // Para este exemplo, manteremos os dados gerados aleatoriamente
    const currentMonthTransactions = transactions.filter(t => {
      const transactionMonth = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
      return transactionMonth === currentMonth;
    });

    const currentMonthIncome = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const currentMonthExpense = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // Atualiza o mês atual nos dados mensais
    setMonthlyData(prevData => {
      return prevData.map(d => {
        if (d.month === currentMonth) {
          return {
            ...d,
            incomeTotal: currentMonthIncome,
            expenseTotal: currentMonthExpense
          };
        }
        return d;
      });
    });
  };

  // Calcula os totais do mês atual
  const getMonthTotals = () => {
    const currentMonthTransactions = transactions.filter(t => {
      const transactionMonth = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
      return transactionMonth === currentMonth;
    });

    const income = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = income - expense;
    const savingRate = income > 0 ? ((income - expense) / income) * 100 : 0;

    return { income, expense, balance, savingRate };
  };

  // Atualiza os dados quando as transações mudam
  useEffect(() => {
    updateMonthlyData();
  }, [transactions, currentMonth]);

  const value = {
    transactions,
    recurringExpenses,
    goals,
    assets,
    liabilities,
    monthlyData,
    currentMonth,
    setCurrentMonth,
    addTransaction,
    editTransaction,
    deleteTransaction,
    addRecurringExpense,
    editRecurringExpense,
    deleteRecurringExpense,
    markRecurringExpenseAsPaid,
    isRecurringExpensePaid,
    getMonthlyExpenseValue,
    setMonthlyExpenseValue,
    addGoal,
    editGoal,
    deleteGoal,
    addAsset,
    editAsset,
    deleteAsset,
    addLiability,
    editLiability,
    deleteLiability,
    getMonthTotals,
    customCategories,
    addCustomCategory
  };

  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  );
};
