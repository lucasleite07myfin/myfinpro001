import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Transaction, Goal, Asset, Liability, MonthlyFinanceData, RecurringExpense, CustomCategories, PaymentMethod } from '@/types/finance';
import { getCurrentMonth, parseDateFromDB, formatDateToDB } from '@/utils/formatters';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/contexts/UserContext';
import { logger } from '@/utils/logger';

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
  updateGoal: (id: string, goal: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  addAsset: (asset: Omit<Asset, 'id'>) => void;
  editAsset: (asset: Asset) => void;
  deleteAsset: (id: string) => void;
  addLiability: (liability: Omit<Liability, 'id'>) => void;
  editLiability: (liability: Liability) => void;
  deleteLiability: (id: string) => void;
  getMonthTotals: () => { income: number; expense: number; balance: number; savingRate: number };
  customCategories: CustomCategories;
  addCustomCategory: (type: 'income' | 'expense', category: string) => Promise<boolean>;
  editCustomCategory: (id: string, type: 'income' | 'expense', oldName: string, newName: string) => Promise<void>;
  deleteCustomCategory: (type: 'income' | 'expense', categoryName: string) => Promise<boolean>;
  calculateHealthSnapshot: () => Promise<void>;
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
  const { user } = useUser();
  
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
  const [secondaryDataLoaded, setSecondaryDataLoaded] = useState(false);

  // Carregar dados do Supabase quando user estiver disponível
  useEffect(() => {
    if (user) {
      loadData();
      
      // Carrega dados secundários após 500ms
      const timer = setTimeout(() => {
        loadSecondaryData();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [user?.id]);

  // Carrega dados ESSENCIAIS (apenas o que é necessário para a tela inicial)
  const loadData = async () => {
    if (!user) return;
    
    try {

      // Carregar apenas dados essenciais em paralelo
      const [
        transactionsResult,
        recurringResult,
        categoriesResult,
        monthlyResult
      ] = await Promise.all([
        supabase.from('transactions').select('*').eq('user_id', user.id),
        supabase.from('recurring_expenses').select('*').eq('user_id', user.id),
        supabase.from('custom_categories').select('*').eq('user_id', user.id),
        supabase.from('monthly_finance_data').select('*').eq('user_id', user.id)
      ]);

      if (transactionsResult.data) {
        const formattedTransactions = transactionsResult.data.map(t => ({
          id: t.id,
          date: parseDateFromDB(t.date),
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

      if (categoriesResult.data) {
        const customCats: CustomCategories = { income: [], expense: [] };
        categoriesResult.data.forEach(cat => {
          if (cat.type === 'income' || cat.type === 'expense') {
            customCats[cat.type].push(cat.name);
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
      toast.error('Erro ao carregar dados essenciais');
    } finally {
      setLoading(false);
    }
  };

  // Carrega dados SECUNDÁRIOS (lazy load - apenas quando necessário)
  const loadSecondaryData = async () => {
    if (!user) return;
    
    try {

      const [
        goalsResult,
        assetsResult,
        liabilitiesResult
      ] = await Promise.all([
        supabase.from('goals').select('*').eq('user_id', user.id),
        supabase.from('assets').select('*').eq('user_id', user.id),
        supabase.from('liabilities').select('*').eq('user_id', user.id)
      ]);

      if (goalsResult.data) {
        const formattedGoals = goalsResult.data.map(g => ({
          id: g.id,
          name: g.name,
          targetAmount: Number(g.target_amount),
          currentAmount: Number(g.current_amount || 0),
          targetDate: parseDateFromDB(g.target_date),
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
          evaluationDate: a.evaluation_date ? parseDateFromDB(a.evaluation_date) : null,
          acquisitionValue: a.acquisition_value ? Number(a.acquisition_value) : undefined,
          acquisitionDate: a.acquisition_date ? parseDateFromDB(a.acquisition_date) : null,
          insured: a.insured || false,
          wallet: a.wallet,
          symbol: a.symbol,
          notes: a.notes,
          location: a.location,
          lastUpdated: a.last_updated ? parseDateFromDB(a.last_updated) : null,
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

      setSecondaryDataLoaded(true);
    } catch (error) {
      logger.error('Erro ao carregar dados secundários:', error);
      // Não mostra toast aqui para não atrapalhar a UX
    }
  };

  // Funções para manipular transações
  const addTransaction = async (transaction: Omit<Transaction, 'id'>, silent = false) => {
    try {
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          date: formatDateToDB(transaction.date),
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
        date: parseDateFromDB(data.date)
      };

      setTransactions(prev => [newTransaction, ...prev]);
      if (!silent) {
        toast.success('Transação adicionada com sucesso!');
      }
    } catch (error) {
      toast.error('Erro ao adicionar transação');
    }
  };

  const editTransaction = async (transaction: Transaction) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .update({
          date: formatDateToDB(transaction.date),
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

      setTransactions(prev => prev.map(t => t.id === transaction.id ? transaction : t));
    } catch (error) {
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

      setTransactions(prev => prev.filter(t => t.id !== id));
      toast.success('Transação excluída com sucesso!');
    } catch (error) {
      toast.error('Erro ao excluir transação');
    }
  };

  const addCustomCategory = async (type: 'income' | 'expense', category: string): Promise<boolean> => {
    try {
      // Validação mais robusta do usuário
      if (!user?.id) {
        logger.error('Usuário não autenticado ou user.id ausente');
        toast.error('Sessão expirada. Faça login novamente.');
        return false;
      }

      const categoryToAdd = category.startsWith('Crie sua categoria: ') ? category : `Crie sua categoria: ${category}`;
      
      // Verificação de duplicata case-insensitive
      const categoryExists = customCategories[type].some(
        cat => cat.toLowerCase() === categoryToAdd.toLowerCase()
      );
      
      if (categoryExists) {
        toast.info('Esta categoria já existe!');
        return true;
      }

      // Obter usuário atual do Supabase para garantir sessão válida
      if (!user?.id) {
        logger.error('Falha ao obter usuário');
        toast.error('Sessão inválida. Faça login novamente.');
        return false;
      }

      const { error: insertError } = await supabase
        .from('custom_categories')
        .insert({
          user_id: user.id,
          type,
          name: categoryToAdd
        });

      if (insertError) {
        logger.error('Erro ao inserir categoria no Supabase:', insertError);
        
        // Tratamento específico de erro de duplicata
        if (insertError.code === '23505') {
          toast.error('Esta categoria já existe!');
          return false;
        }
        
        toast.error('Erro ao salvar categoria. Tente novamente.');
        return false;
      }

      setCustomCategories(prev => ({
        ...prev,
        [type]: [...prev[type], categoryToAdd]
      }));

      toast.success('Categoria personalizada adicionada!');
      return true;
    } catch (error) {
      logger.error('Erro inesperado ao adicionar categoria:', error);
      toast.error('Erro ao adicionar categoria. Verifique sua conexão.');
      return false;
    }
  };

  const editCustomCategory = async (
    id: string, 
    type: 'income' | 'expense', 
    oldName: string, 
    newName: string
  ) => {
    try {
      if (!user) {
        logger.error('Usuário não autenticado ao editar categoria');
        throw new Error('Usuário não autenticado');
      }

      const categoryToUpdate = newName.startsWith('Crie sua categoria: ') ? newName : `Crie sua categoria: ${newName}`;
      
      // Atualizar no banco
      const { error: updateError } = await supabase
        .from('custom_categories')
        .update({ name: categoryToUpdate })
        .eq('user_id', user.id)
        .eq('name', oldName);

      if (updateError) throw updateError;

      // Atualizar transações que usam essa categoria
      const { error: transactionsError } = await supabase
        .from('transactions')
        .update({ category: categoryToUpdate })
        .eq('user_id', user.id)
        .eq('category', oldName);

      if (transactionsError) throw transactionsError;

      // Atualizar despesas recorrentes
      const { error: recurringError } = await supabase
        .from('recurring_expenses')
        .update({ category: categoryToUpdate })
        .eq('user_id', user.id)
        .eq('category', oldName);

      if (recurringError) throw recurringError;

      // Atualizar estado local
      setCustomCategories(prev => ({
        ...prev,
        [type]: prev[type].map(cat => cat === oldName ? categoryToUpdate : cat)
      }));

      // Recarregar transações
      await loadData();

      toast.success('Categoria atualizada com sucesso!');
    } catch (error) {
      logger.error('Erro ao editar categoria:', error);
      toast.error('Erro ao editar categoria');
    }
  };

  const deleteCustomCategory = async (type: 'income' | 'expense', categoryName: string) => {
    try {
      if (!user) {
        logger.error('Usuário não autenticado ao excluir categoria');
        throw new Error('Usuário não autenticado');
      }

      // Verificar se há transações usando essa categoria
      const { data: transactionsWithCategory } = await supabase
        .from('transactions')
        .select('id')
        .eq('user_id', user.id)
        .eq('category', categoryName);

      const { data: recurringWithCategory } = await supabase
        .from('recurring_expenses')
        .select('id')
        .eq('user_id', user.id)
        .eq('category', categoryName);

      if ((transactionsWithCategory && transactionsWithCategory.length > 0) || 
          (recurringWithCategory && recurringWithCategory.length > 0)) {
        toast.error('Não é possível excluir categoria em uso. Altere as transações primeiro.');
        return false;
      }

      // Excluir do banco
      const { error } = await supabase
        .from('custom_categories')
        .delete()
        .eq('user_id', user.id)
        .eq('name', categoryName);

      if (error) throw error;

      // Atualizar estado local
      setCustomCategories(prev => ({
        ...prev,
        [type]: prev[type].filter(cat => cat !== categoryName)
      }));

      toast.success('Categoria excluída com sucesso!');
      return true;
    } catch (error) {
      logger.error('Erro ao excluir categoria:', error);
      toast.error('Erro ao excluir categoria');
      return false;
    }
  };

  // Funções para manipular despesas recorrentes
  const addRecurringExpense = async (expense: Omit<RecurringExpense, 'id' | 'isPaid' | 'paidMonths' | 'createdAt'>) => {
    try {
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

      setRecurringExpenses(prev => [...prev, newExpense]);
      toast.success('Despesa recorrente adicionada com sucesso!');
    } catch (error) {
      logger.error('Erro ao adicionar despesa recorrente:', error);
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
  const setMonthlyExpenseValue = async (expenseId: string, month: string, value: number | null) => {
    try {
      const expense = recurringExpenses.find(e => e.id === expenseId);
      if (!expense) throw new Error("Despesa recorrente não encontrada");

      const monthlyValues = { ...(expense.monthlyValues || {}) };
      if (value === null) {
        delete monthlyValues[month];
      } else {
        monthlyValues[month] = value;
      }

      const { error } = await supabase
        .from('recurring_expenses')
        .update({ monthly_values: monthlyValues })
        .eq('id', expenseId);

      if (error) throw error;

      setRecurringExpenses(prev => prev.map(e => e.id === expenseId ? { ...e, monthlyValues } : e));
      toast.success('Valor mensal atualizado com sucesso!');
    } catch (error) {
      logger.error('Erro ao atualizar valor mensal:', error);
      toast.error('Erro ao atualizar valor mensal');
    }
  };

  const editRecurringExpense = async (expense: RecurringExpense) => {
    try {
      const { error } = await supabase
        .from('recurring_expenses')
        .update({
          description: expense.description,
          category: expense.category,
          amount: expense.amount,
          due_day: expense.dueDay,
          payment_method: expense.paymentMethod,
          repeat_months: expense.repeatMonths,
          monthly_values: expense.monthlyValues,
        })
        .eq('id', expense.id);

      if (error) throw error;

      setRecurringExpenses(prev => prev.map(e => e.id === expense.id ? expense : e));

      setTransactions(prev => {
        const relatedTransactions = prev.filter(t => 
          t.recurringExpenseId === expense.id &&
          t.isRecurringPayment
        );

        if (relatedTransactions.length > 0) {
          return prev.map(t => {
            const transactionMonth = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
            const isCurrentOrFutureMonth = transactionMonth >= currentMonth;

            if (t.recurringExpenseId === expense.id && 
                t.isRecurringPayment && 
                isCurrentOrFutureMonth) {
              const monthValue = getMonthlyExpenseValue(expense.id, transactionMonth);
              return { ...t, amount: monthValue !== null ? monthValue : expense.amount };
            }
            return t;
          });
        }
        return prev;
      });

      toast.success('Despesa fixa atualizada com sucesso!');
    } catch (error) {
      logger.error('Erro ao atualizar despesa recorrente:', error);
      toast.error('Erro ao atualizar despesa recorrente');
    }
  };

  const deleteRecurringExpense = async (id: string) => {
    try {
      const expenseToDelete = recurringExpenses.find(e => e.id === id);
      if (!expenseToDelete) throw new Error("Despesa recorrente não encontrada");

      // Deleta as transações associadas
      const { error: transactionError } = await supabase
        .from('transactions')
        .delete()
        .eq('recurring_expense_id', id);

      if (transactionError) throw transactionError;

      // Deleta a despesa recorrente
      const { error } = await supabase
        .from('recurring_expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Atualiza o estado local
      setRecurringExpenses(prev => prev.filter(e => e.id !== id));
      setTransactions(prev => prev.filter(t => t.recurringExpenseId !== id));
      
      toast.success('Despesa fixa excluída com sucesso!');
    } catch (error) {
      logger.error('Erro ao excluir despesa recorrente:', error);
      toast.error('Erro ao excluir despesa recorrente');
    }
  };

  const markingPaidRef = useRef<Set<string>>(new Set());

  const markRecurringExpenseAsPaid = async (id: string, month: string, paid: boolean) => {
    const lockKey = `${id}_${month}`;
    if (markingPaidRef.current.has(lockKey)) return;
    markingPaidRef.current.add(lockKey);

    try {
      const expense = recurringExpenses.find(e => e.id === id);
      if (!expense) throw new Error("Despesa recorrente não encontrada");

      const paidMonths = [...(expense.paidMonths || [])];
      const isAlreadyPaid = paidMonths.includes(month);

      if (paid && !isAlreadyPaid) {
        paidMonths.push(month);
      } else if (!paid && isAlreadyPaid) {
        const index = paidMonths.indexOf(month);
        if (index > -1) {
          paidMonths.splice(index, 1);
        }
      }

      const { error } = await supabase
        .from('recurring_expenses')
        .update({ paid_months: paidMonths })
        .eq('id', id);

      if (error) throw error;

      setRecurringExpenses(prev => prev.map(e => e.id === id ? { ...e, paidMonths } : e));

      if (paid && !isAlreadyPaid) {
        // Verificar no banco se ja existe transacao para este recurring+mes
        const monthStart = `${month}-01`;
        const [yearStr, monthStr] = month.split('-');
        const monthNum = parseInt(monthStr);
        const yearNum = parseInt(yearStr);
        const monthEnd = monthNum === 12
          ? `${yearNum + 1}-01-01`
          : `${yearStr}-${String(monthNum + 1).padStart(2, '0')}-01`;

        const { data: existing } = await supabase
          .from('transactions')
          .select('id')
          .eq('user_id', user!.id)
          .eq('recurring_expense_id', id)
          .gte('date', monthStart)
          .lt('date', monthEnd)
          .limit(1);

        if (!existing || existing.length === 0) {
          const amount = getMonthlyExpenseValue(id, month) || expense.amount;
          if (amount > 0) {
            const date = new Date(`${month}-01T12:00:00`);
            date.setDate(expense.dueDay);
            addTransaction({
              date,
              description: `${expense.description} (Pagamento Fixo)`,
              category: expense.category,
              amount,
              type: 'expense',
              paymentMethod: expense.paymentMethod,
              isRecurringPayment: true,
              recurringExpenseId: id,
            }, true);
          }
        }
      } else if (!paid && isAlreadyPaid) {
        const transactionToDelete = transactions.find(t => 
          t.recurringExpenseId === id && 
          `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}` === month
        );
        if (transactionToDelete) {
          deleteTransaction(transactionToDelete.id);
        }
      }

      toast.success(`Despesa marcada como ${paid ? 'paga' : 'não paga'}!`);
    } catch (error) {
      logger.error('Erro ao marcar despesa como paga:', error);
      toast.error('Erro ao marcar despesa como paga');
    } finally {
      markingPaidRef.current.delete(lockKey);
    }
  };

  const isRecurringExpensePaid = (id: string, month: string) => {
    const expense = recurringExpenses.find(e => e.id === id);
    return expense ? (expense.paidMonths || []).includes(month) : false;
  };

  // Funções para manipular metas
  const addGoal = async (goal: Omit<Goal, 'id'>) => {
    try {
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('goals')
        .insert({
          user_id: user.id,
          name: goal.name,
          target_amount: goal.targetAmount,
          current_amount: goal.currentAmount || 0,
          target_date: formatDateToDB(goal.targetDate),
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

      setGoals(prev => [...prev, newGoal]);
      toast.success('Meta adicionada com sucesso!');
    } catch (error) {
      logger.error('Erro ao adicionar meta:', error);
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
          target_date: formatDateToDB(goal.targetDate),
          saving_location: goal.savingLocation
        })
        .eq('id', goal.id);

      if (error) throw error;

      setGoals(prev => prev.map(g => g.id === goal.id ? goal : g));
      toast.success('Meta atualizada com sucesso!');
    } catch (error) {
      logger.error('Erro ao atualizar meta:', error);
      toast.error('Erro ao atualizar meta');
    }
  };

  const updateGoal = async (id: string, goalUpdate: Partial<Goal>) => {
    try {
      const existingGoal = goals.find(g => g.id === id);
      if (!existingGoal) throw new Error('Meta não encontrada');

      const updatedGoal = { ...existingGoal, ...goalUpdate };

      const { error } = await supabase
        .from('goals')
        .update({
          name: updatedGoal.name,
          target_amount: updatedGoal.targetAmount,
          current_amount: updatedGoal.currentAmount,
          target_date: formatDateToDB(updatedGoal.targetDate),
          saving_location: updatedGoal.savingLocation
        })
        .eq('id', id);

      if (error) throw error;

      setGoals(prev => prev.map(g => g.id === id ? updatedGoal : g));
      toast.success('Meta atualizada com sucesso!');
    } catch (error) {
      logger.error('Erro ao atualizar meta:', error);
      toast.error('Erro ao atualizar meta');
    }
  };

  const deleteGoal = async (id: string) => {
    try {
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setGoals(prev => prev.filter(g => g.id !== id));
      toast.success('Meta excluída com sucesso!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir meta');
    }
  };

  // Funções para manipular ativos
  const addAsset = async (asset: Omit<Asset, 'id'>) => {
    try {
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('assets')
        .insert({
          user_id: user.id,
          name: asset.name,
          type: asset.type,
          value: asset.value,
          evaluation_date: asset.evaluationDate ? formatDateToDB(asset.evaluationDate) : null,
          acquisition_value: asset.acquisitionValue,
          acquisition_date: asset.acquisitionDate ? formatDateToDB(asset.acquisitionDate) : null,
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

      setAssets(prev => [...prev, newAsset]);
      toast.success('Ativo adicionado com sucesso!');
    } catch (error) {
      logger.error('Erro ao adicionar ativo:', error);
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
          evaluation_date: asset.evaluationDate ? formatDateToDB(asset.evaluationDate) : null,
          acquisition_value: asset.acquisitionValue,
          acquisition_date: asset.acquisitionDate ? formatDateToDB(asset.acquisitionDate) : null,
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

      setAssets(prev => prev.map(a => a.id === asset.id ? asset : a));
      toast.success('Ativo atualizado com sucesso!');
    } catch (error) {
      logger.error('Erro ao atualizar ativo:', error);
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

      setAssets(prev => prev.filter(a => a.id !== id));
      toast.success('Ativo excluído com sucesso!');
    } catch (error) {
      logger.error('Erro ao excluir ativo:', error);
      toast.error('Erro ao excluir ativo');
    }
  };

  // Funções para manipular passivos
  const addLiability = async (liability: Omit<Liability, 'id'>) => {
    try {
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

      setLiabilities(prev => [...prev, newLiability]);
      toast.success('Passivo adicionado com sucesso!');
    } catch (error) {
      logger.error('Erro ao adicionar passivo:', error);
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

      setLiabilities(prev => prev.map(l => l.id === liability.id ? liability : l));
      toast.success('Passivo atualizado com sucesso!');
    } catch (error) {
      logger.error('Erro ao atualizar passivo:', error);
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

      setLiabilities(prev => prev.filter(l => l.id !== id));
      toast.success('Passivo excluído com sucesso!');
    } catch (error) {
      logger.error('Erro ao excluir passivo:', error);
      toast.error('Erro ao excluir passivo');
    }
  };

  // Função auxiliar para atualizar dados mensais
  const updateMonthlyData = async () => {
    try {
      if (!user) return;

      // Recalcular dados para todos os meses com base nas transações
      const updatedMonthlyData = monthlyData.map(monthItem => {
        const monthTransactions = transactions.filter(t => {
          const transactionMonth = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
          return transactionMonth === monthItem.month;
        });

        const incomeTotal = monthTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);

        const expenseTotal = monthTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);

        return {
          ...monthItem,
          incomeTotal,
          expenseTotal
        };
      });

      // Atualizar apenas o mês atual no Supabase (para não sobrecarregar)
      const currentMonthData = updatedMonthlyData.find(d => d.month === currentMonth);
      if (currentMonthData) {
        const { error } = await supabase
          .from('monthly_finance_data')
          .upsert({ 
            user_id: user.id, 
            month: currentMonth, 
            income_total: currentMonthData.incomeTotal, 
            expense_total: currentMonthData.expenseTotal 
          }, { onConflict: 'user_id, month' });

        if (error) throw error;
      }

      // Atualizar os dados mensais no estado
      setMonthlyData(updatedMonthlyData);
    } catch (error) {
      logger.error('Erro ao atualizar dados mensais:', error);
      toast.error('Erro ao atualizar dados mensais');
    }
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

  // Debounce ref para updateMonthlyData
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Atualiza os dados quando as transações mudam (com debounce)
  useEffect(() => {
    if (loading) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      updateMonthlyData();
    }, 500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [transactions, currentMonth]);

  const calculateHealthSnapshot = async () => {
    try {
      const { error } = await supabase.functions.invoke('calculate-health', {
        body: { mode: 'single_user' }
      });
      
      if (error) throw error;
    } catch (error) {
      logger.error('Erro ao calcular saúde financeira:', error);
      throw error;
    }
  };

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
    updateGoal,
    deleteGoal,
    addAsset,
    editAsset,
    deleteAsset,
    addLiability,
    editLiability,
    deleteLiability,
    getMonthTotals,
    customCategories,
    addCustomCategory,
    editCustomCategory,
    deleteCustomCategory,
    calculateHealthSnapshot
  };

  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  );
};
