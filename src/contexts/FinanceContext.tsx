import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Transaction, Goal, Asset, Liability, MonthlyFinanceData, RecurringExpense, CustomCategories } from '@/types/finance';
import { getCurrentMonth, centsFromUnknownDbValue } from '@/utils/formatters';
import { toast } from '@/components/ui/sonner';
import { useUser } from '@/contexts/UserContext';
import { useAppMode } from '@/contexts/AppModeContext';
import { logger } from '@/utils/logger';
import * as financeService from '@/services/financeService';

// Gerar dados de 12 meses para o gráfico
const generateMonthlyData = (): MonthlyFinanceData[] => {
  const data: MonthlyFinanceData[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStr = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
    data.push({ month: monthStr, incomeTotal: 0, expenseTotal: 0 });
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
  const { mode } = useAppMode();
  
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

  // Carregar dados apenas quando modo pessoal está ativo
  useEffect(() => {
    if (user && mode === 'personal') {
      loadData();
      const timer = setTimeout(() => loadSecondaryData(), 500);
      return () => clearTimeout(timer);
    } else if (mode !== 'personal') {
      setTransactions([]);
      setRecurringExpenses([]);
      setGoals([]);
      setAssets([]);
      setLiabilities([]);
      setMonthlyData(generateMonthlyData());
      setLoading(true);
      setSecondaryDataLoaded(false);
    }
  }, [user?.id, mode]);

  const loadData = async () => {
    if (!user) return;
    try {
      const result = await financeService.loadEssentialData(user.id);
      
      if (result.transactions.data) setTransactions(result.transactions.data);
      if (result.recurring.data) setRecurringExpenses(result.recurring.data);
      if (result.categories.data) setCustomCategories(result.categories.data);
      if (result.monthly.data) setMonthlyData(result.monthly.data);
    } catch (error) {
      toast.error('Erro ao carregar dados essenciais');
    } finally {
      setLoading(false);
    }
  };

  const loadSecondaryData = async () => {
    if (!user) return;
    try {
      const result = await financeService.loadSecondaryData(user.id);
      
      if (result.goals.data) setGoals(result.goals.data);
      if (result.assets.data) setAssets(result.assets.data);
      if (result.liabilities.data) setLiabilities(result.liabilities.data);
      setSecondaryDataLoaded(true);
    } catch (error) {
      logger.error('Erro ao carregar dados secundários:', error);
    }
  };

  // ==================== TRANSACTIONS ====================

  const addTransaction = async (transaction: Omit<Transaction, 'id'>, silent = false) => {
    if (!user) return;
    const result = await financeService.insertTransaction(user.id, transaction);
    if (result.error) { toast.error('Erro ao adicionar transação'); return; }
    setTransactions(prev => [result.data!, ...prev]);
    if (!silent) toast.success('Transação adicionada com sucesso!');
  };

  const editTransaction = async (transaction: Transaction) => {
    const result = await financeService.updateTransaction(transaction);
    if (result.error) { toast.error('Erro ao atualizar transação'); return; }
    setTransactions(prev => prev.map(t => t.id === transaction.id ? transaction : t));
  };

  const deleteTransaction = async (id: string) => {
    const result = await financeService.removeTransaction(id);
    if (result.error) { toast.error('Erro ao excluir transação'); return; }
    setTransactions(prev => prev.filter(t => t.id !== id));
    toast.success('Transação excluída com sucesso!');
  };

  // ==================== RECURRING EXPENSES ====================

  const addRecurringExpense = async (expense: Omit<RecurringExpense, 'id' | 'isPaid' | 'paidMonths' | 'createdAt'>) => {
    if (!user) return;
    const result = await financeService.insertRecurringExpense(user.id, expense);
    if (result.error) { toast.error('Erro ao adicionar despesa recorrente'); return; }
    setRecurringExpenses(prev => [...prev, result.data!]);
    toast.success('Despesa recorrente adicionada com sucesso!');
  };

  const getMonthlyExpenseValue = (expenseId: string, month: string): number | null => {
    const expense = recurringExpenses.find(e => e.id === expenseId);
    if (!expense) return null;
    if (expense.monthlyValues && expense.monthlyValues[month] !== undefined) return expense.monthlyValues[month];
    if (expense.amount === 0) return null;
    return expense.amount;
  };

  const setMonthlyExpenseValue = async (expenseId: string, month: string, value: number | null) => {
    const expense = recurringExpenses.find(e => e.id === expenseId);
    if (!expense) { toast.error('Despesa recorrente não encontrada'); return; }

    const monthlyValues = { ...(expense.monthlyValues || {}) };
    if (value === null) { delete monthlyValues[month]; } else { monthlyValues[month] = value; }

    const result = await financeService.updateMonthlyValues(expenseId, monthlyValues);
    if (result.error) { toast.error('Erro ao atualizar valor mensal'); return; }
    setRecurringExpenses(prev => prev.map(e => e.id === expenseId ? { ...e, monthlyValues } : e));
    toast.success('Valor mensal atualizado com sucesso!');
  };

  const editRecurringExpense = async (expense: RecurringExpense) => {
    const result = await financeService.updateRecurringExpense(expense);
    if (result.error) { toast.error('Erro ao atualizar despesa recorrente'); return; }

    setRecurringExpenses(prev => prev.map(e => e.id === expense.id ? expense : e));

    setTransactions(prev => {
      const relatedTransactions = prev.filter(t => t.recurringExpenseId === expense.id && t.isRecurringPayment);
      if (relatedTransactions.length > 0) {
        return prev.map(t => {
          const transactionMonth = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
          const isCurrentOrFutureMonth = transactionMonth >= currentMonth;
          if (t.recurringExpenseId === expense.id && t.isRecurringPayment && isCurrentOrFutureMonth) {
            const monthValue = getMonthlyExpenseValue(expense.id, transactionMonth);
            const newAmount = monthValue !== null ? monthValue : expense.amount;
            const newAmountCents = centsFromUnknownDbValue(newAmount);
            return { ...t, amount: newAmount, amountCents: newAmountCents };
          }
          return t;
        });
      }
      return prev;
    });

    toast.success('Despesa fixa atualizada com sucesso!');
  };

  const deleteRecurringExpense = async (id: string) => {
    const expenseToDelete = recurringExpenses.find(e => e.id === id);
    if (!expenseToDelete) { toast.error('Despesa recorrente não encontrada'); return; }

    const txResult = await financeService.deleteTransactionsByRecurringId(id);
    if (txResult.error) { toast.error('Erro ao excluir transações associadas'); return; }

    const result = await financeService.removeRecurringExpense(id);
    if (result.error) { toast.error('Erro ao excluir despesa recorrente'); return; }

    setRecurringExpenses(prev => prev.filter(e => e.id !== id));
    setTransactions(prev => prev.filter(t => t.recurringExpenseId !== id));
    toast.success('Despesa fixa excluída com sucesso!');
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

      if (paid && !isAlreadyPaid) paidMonths.push(month);
      else if (!paid && isAlreadyPaid) {
        const index = paidMonths.indexOf(month);
        if (index > -1) paidMonths.splice(index, 1);
      }

      const result = await financeService.updatePaidMonths(id, paidMonths);
      if (result.error) throw new Error(result.error);

      setRecurringExpenses(prev => prev.map(e => e.id === id ? { ...e, paidMonths } : e));

      if (paid && !isAlreadyPaid) {
        const monthStart = `${month}-01`;
        const [yearStr, monthStr] = month.split('-');
        const monthNum = parseInt(monthStr);
        const yearNum = parseInt(yearStr);
        const monthEnd = monthNum === 12
          ? `${yearNum + 1}-01-01`
          : `${yearStr}-${String(monthNum + 1).padStart(2, '0')}-01`;

        const existingResult = await financeService.checkExistingRecurringTransaction(user!.id, id, monthStart, monthEnd);

        if (!existingResult.error && !existingResult.data) {
          const amount = getMonthlyExpenseValue(id, month) || expense.amount;
          if (amount > 0) {
            const amountCents = centsFromUnknownDbValue(amount);
            const date = new Date(`${month}-01T12:00:00`);
            date.setDate(expense.dueDay);
            addTransaction({
              date,
              description: `${expense.description} (Pagamento Fixo)`,
              category: expense.category,
              amount,
              amountCents,
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
        if (transactionToDelete) deleteTransaction(transactionToDelete.id);
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

  // ==================== CUSTOM CATEGORIES ====================

  const addCustomCategory = async (type: 'income' | 'expense', category: string): Promise<boolean> => {
    if (!user?.id) { toast.error('Sessão expirada. Faça login novamente.'); return false; }

    const categoryToAdd = category.startsWith('Crie sua categoria: ') ? category : `Crie sua categoria: ${category}`;
    
    if (customCategories[type].some(cat => cat.toLowerCase() === categoryToAdd.toLowerCase())) {
      toast.info('Esta categoria já existe!');
      return true;
    }

    const result = await financeService.insertCustomCategory(user.id, type, categoryToAdd);
    if (result.error) {
      if (result.error.includes('23505')) { toast.error('Esta categoria já existe!'); return false; }
      toast.error('Erro ao salvar categoria. Tente novamente.');
      return false;
    }

    setCustomCategories(prev => ({ ...prev, [type]: [...prev[type], categoryToAdd] }));
    toast.success('Categoria personalizada adicionada!');
    return true;
  };

  const editCustomCategory = async (id: string, type: 'income' | 'expense', oldName: string, newName: string) => {
    if (!user) { toast.error('Usuário não autenticado'); return; }

    const categoryToUpdate = newName.startsWith('Crie sua categoria: ') ? newName : `Crie sua categoria: ${newName}`;
    
    const updateResult = await financeService.updateCustomCategoryName(user.id, oldName, categoryToUpdate);
    if (updateResult.error) { toast.error('Erro ao editar categoria'); return; }

    await Promise.all([
      financeService.updateCategoryInTransactions(user.id, oldName, categoryToUpdate),
      financeService.updateCategoryInRecurring(user.id, oldName, categoryToUpdate)
    ]);

    setCustomCategories(prev => ({ ...prev, [type]: prev[type].map(cat => cat === oldName ? categoryToUpdate : cat) }));
    await loadData();
    toast.success('Categoria atualizada com sucesso!');
  };

  const deleteCustomCategory = async (type: 'income' | 'expense', categoryName: string) => {
    if (!user) { toast.error('Usuário não autenticado'); return false; }

    const inUseResult = await financeService.checkCategoryInUse(user.id, categoryName);
    if (inUseResult.error) { toast.error('Erro ao verificar categoria'); return false; }
    if (inUseResult.data) { toast.error('Não é possível excluir categoria em uso. Altere as transações primeiro.'); return false; }

    const result = await financeService.removeCustomCategory(user.id, categoryName);
    if (result.error) { toast.error('Erro ao excluir categoria'); return false; }

    setCustomCategories(prev => ({ ...prev, [type]: prev[type].filter(cat => cat !== categoryName) }));
    toast.success('Categoria excluída com sucesso!');
    return true;
  };

  // ==================== GOALS ====================

  const addGoal = async (goal: Omit<Goal, 'id'>) => {
    if (!user) return;
    const result = await financeService.insertGoal(user.id, goal);
    if (result.error) { toast.error('Erro ao adicionar meta'); return; }
    setGoals(prev => [...prev, result.data!]);
    toast.success('Meta adicionada com sucesso!');
  };

  const editGoal = async (goal: Goal) => {
    const result = await financeService.updateGoalDB(goal);
    if (result.error) { toast.error('Erro ao atualizar meta'); return; }
    setGoals(prev => prev.map(g => g.id === goal.id ? goal : g));
    toast.success('Meta atualizada com sucesso!');
  };

  const updateGoal = async (id: string, goalUpdate: Partial<Goal>) => {
    const existingGoal = goals.find(g => g.id === id);
    if (!existingGoal) { toast.error('Meta não encontrada'); return; }
    const updatedGoal = { ...existingGoal, ...goalUpdate };
    const result = await financeService.updateGoalDB(updatedGoal);
    if (result.error) { toast.error('Erro ao atualizar meta'); return; }
    setGoals(prev => prev.map(g => g.id === id ? updatedGoal : g));
    toast.success('Meta atualizada com sucesso!');
  };

  const deleteGoal = async (id: string) => {
    if (!user) return;
    const result = await financeService.removeGoal(id, user.id);
    if (result.error) { toast.error('Erro ao excluir meta'); return; }
    setGoals(prev => prev.filter(g => g.id !== id));
    toast.success('Meta excluída com sucesso!');
  };

  // ==================== ASSETS ====================

  const addAsset = async (asset: Omit<Asset, 'id'>) => {
    if (!user) return;
    const result = await financeService.insertAsset(user.id, asset);
    if (result.error) { toast.error('Erro ao adicionar ativo'); return; }
    setAssets(prev => [...prev, result.data!]);
    toast.success('Ativo adicionado com sucesso!');
  };

  const editAsset = async (asset: Asset) => {
    const result = await financeService.updateAssetDB(asset);
    if (result.error) { toast.error('Erro ao atualizar ativo'); return; }
    setAssets(prev => prev.map(a => a.id === asset.id ? asset : a));
    toast.success('Ativo atualizado com sucesso!');
  };

  const deleteAsset = async (id: string) => {
    const result = await financeService.removeAsset(id);
    if (result.error) { toast.error('Erro ao excluir ativo'); return; }
    setAssets(prev => prev.filter(a => a.id !== id));
    toast.success('Ativo excluído com sucesso!');
  };

  // ==================== LIABILITIES ====================

  const addLiability = async (liability: Omit<Liability, 'id'>) => {
    if (!user) return;
    const result = await financeService.insertLiability(user.id, liability);
    if (result.error) { toast.error('Erro ao adicionar passivo'); return; }
    setLiabilities(prev => [...prev, result.data!]);
    toast.success('Passivo adicionado com sucesso!');
  };

  const editLiability = async (liability: Liability) => {
    const result = await financeService.updateLiabilityDB(liability);
    if (result.error) { toast.error('Erro ao atualizar passivo'); return; }
    setLiabilities(prev => prev.map(l => l.id === liability.id ? liability : l));
    toast.success('Passivo atualizado com sucesso!');
  };

  const deleteLiability = async (id: string) => {
    const result = await financeService.removeLiability(id);
    if (result.error) { toast.error('Erro ao excluir passivo'); return; }
    setLiabilities(prev => prev.filter(l => l.id !== id));
    toast.success('Passivo excluído com sucesso!');
  };

  // ==================== MONTHLY DATA ====================

  const updateMonthlyData = async () => {
    if (!user) return;
    const updatedMonthlyData = monthlyData.map(monthItem => {
      const monthTransactions = transactions.filter(t => {
        const transactionMonth = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
        return transactionMonth === monthItem.month;
      });
      const incomeTotalCents = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amountCents ?? 0), 0);
      const expenseTotalCents = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amountCents ?? 0), 0);
      return { ...monthItem, incomeTotal: incomeTotalCents / 100, incomeTotalCents, expenseTotal: expenseTotalCents / 100, expenseTotalCents };
    });

    const currentMonthData = updatedMonthlyData.find(d => d.month === currentMonth);
    if (currentMonthData) {
      const result = await financeService.upsertMonthlyData(user.id, currentMonth, currentMonthData.incomeTotal, currentMonthData.expenseTotal);
      if (result.error) { logger.error('Erro ao atualizar dados mensais:', result.error); }
    }
    setMonthlyData(updatedMonthlyData);
  };

  const getMonthTotals = () => {
    const currentMonthTransactions = transactions.filter(t => {
      const transactionMonth = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
      return transactionMonth === currentMonth;
    });
    const incomeCents = currentMonthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amountCents ?? 0), 0);
    const expenseCents = currentMonthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amountCents ?? 0), 0);
    const income = incomeCents / 100;
    const expense = expenseCents / 100;
    const balance = income - expense;
    const savingRate = incomeCents > 0 ? ((incomeCents - expenseCents) / incomeCents) * 100 : 0;
    return { income, expense, balance, savingRate };
  };

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (loading || mode !== 'personal') return;
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => updateMonthlyData(), 500);
    return () => { if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current); };
  }, [transactions, currentMonth]);

  const calculateHealthSnapshot = async () => {
    const result = await financeService.calculateHealthSnapshot();
    if (result.error) { logger.error('Erro ao calcular saúde financeira:', result.error); throw new Error(result.error); }
  };

  const value = {
    transactions, recurringExpenses, goals, assets, liabilities, monthlyData,
    currentMonth, setCurrentMonth,
    addTransaction, editTransaction, deleteTransaction,
    addRecurringExpense, editRecurringExpense, deleteRecurringExpense,
    markRecurringExpenseAsPaid, isRecurringExpensePaid,
    getMonthlyExpenseValue, setMonthlyExpenseValue,
    addGoal, editGoal, updateGoal, deleteGoal,
    addAsset, editAsset, deleteAsset,
    addLiability, editLiability, deleteLiability,
    getMonthTotals,
    customCategories, addCustomCategory, editCustomCategory, deleteCustomCategory,
    calculateHealthSnapshot
  };

  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  );
};
