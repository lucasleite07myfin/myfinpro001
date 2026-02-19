import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Transaction, RecurringExpense, Goal, Asset, Liability, MonthlyFinanceData, CustomCategories } from '@/types/finance';
import { Investment } from '@/components/AddInvestmentModal';
import { Supplier } from '@/types/supplier';
import { toast } from 'sonner';
import { getCurrentMonth } from '@/utils/formatters';
import { useUser } from '@/contexts/UserContext';
import { useSubAccount } from '@/contexts/SubAccountContext';
import { useAppMode } from '@/contexts/AppModeContext';
import { logger } from '@/utils/logger';
import * as businessService from '@/services/businessService';

// Add Investment to the interface
interface BusinessContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (transaction: Transaction) => void;
  deleteTransaction: (id: string) => void;
  recurringExpenses: RecurringExpense[];
  addRecurringExpense: (expense: Omit<RecurringExpense, 'id' | 'isPaid' | 'paidMonths' | 'createdAt'>) => void;
  updateRecurringExpense: (expense: RecurringExpense) => void;
  deleteRecurringExpense: (id: string) => void;
  goals: Goal[];
  addGoal: (goal: Omit<Goal, 'id'>) => void;
  updateGoal: (goal: Goal) => void;
  deleteGoal: (id: string) => void;
  addGoalContribution: (goalId: string, amount: number) => void;
  assets: Asset[];
  addAsset: (asset: Omit<Asset, 'id'>) => void;
  updateAsset: (asset: Asset) => void;
  deleteAsset: (id: string) => void;
  editAsset: (asset: Asset) => void;
  suppliers: Supplier[];
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateSupplier: (supplier: Supplier) => void;
  deleteSupplier: (id: string) => void;
  editSupplier: (supplier: Supplier) => void;
  getSupplierByDocument: (document: string) => Supplier | undefined;
  investments: Investment[];
  addInvestment: (investment: Investment) => void;
  updateInvestment: (investment: Investment) => void;
  deleteInvestment: (id: string) => void;
  updatePaidInstallments: (id: string, paidInstallments: number) => void;
  liabilities: Liability[];
  addLiability: (liability: Omit<Liability, 'id'>) => void;
  editLiability: (liability: Liability) => void;
  deleteLiability: (id: string) => void;
  monthlyData: MonthlyFinanceData[];
  currentMonth: string;
  setCurrentMonth: (month: string) => void;
  getMonthTotals: () => { income: number; expense: number; balance: number; savingRate: number };
  markRecurringExpenseAsPaid: (id: string, month: string, paid: boolean) => void;
  isRecurringExpensePaid: (id: string, month: string) => boolean;
  editRecurringExpense: (expense: RecurringExpense) => void;
  editGoal: (goal: Goal) => void;
  companyName: string;
  setCompanyName: (name: string) => void;
  getMonthlyExpenseValue: (expenseId: string, month: string) => number | null;
  setMonthlyExpenseValue: (expenseId: string, month: string, value: number | null) => void;
  calculateHealthSnapshot: () => Promise<void>;
  reloadData: () => Promise<void>;
  customCategories: CustomCategories;
  addCustomCategory: (type: 'income' | 'expense', category: string) => Promise<boolean>;
  editCustomCategory: (id: string, type: 'income' | 'expense', oldName: string, newName: string) => Promise<void>;
  deleteCustomCategory: (type: 'income' | 'expense', categoryName: string) => Promise<boolean>;
}

interface BusinessProviderProps {
  children: ReactNode;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export const useBusiness = (): BusinessContextType => {
  const context = useContext(BusinessContext);
  if (context === undefined) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
};

// Generate monthly data based on transactions
const generateMonthlyDataFromTransactions = (transactions: Transaction[]): MonthlyFinanceData[] => {
  const data: MonthlyFinanceData[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStr = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
    const monthTransactions = transactions.filter(t => {
      const transactionMonth = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
      return transactionMonth === monthStr;
    });
    const incomeTotal = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenseTotal = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    data.push({ month: monthStr, incomeTotal, expenseTotal });
  }
  return data;
};

export const BusinessProvider = ({ children }: BusinessProviderProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyFinanceData[]>([]);
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth());
  const [companyName, setCompanyName] = useState('Minha Empresa');
  const [loading, setLoading] = useState(true);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [customCategories, setCustomCategories] = useState<CustomCategories>({ income: [], expense: [] });

  const { user } = useUser();
  const { isSubAccount, ownerId } = useSubAccount();
  const { mode } = useAppMode();
  const effectiveUserId = isSubAccount && ownerId ? ownerId : user?.id;

  useEffect(() => {
    if (user && effectiveUserId && mode === 'business') {
      loadData();
    } else if (mode !== 'business') {
      setTransactions([]);
      setRecurringExpenses([]);
      setGoals([]);
      setAssets([]);
      setLiabilities([]);
      setSuppliers([]);
      setInvestments([]);
      setMonthlyData([]);
      setLoading(true);
    }
  }, [user?.id, effectiveUserId, mode]);

  useEffect(() => {
    if (transactions.length > 0) {
      const newMonthlyData = generateMonthlyDataFromTransactions(transactions);
      setMonthlyData(newMonthlyData);
    }
  }, [transactions]);

  const loadData = async () => {
    if (!user || !effectiveUserId) return;
    try {
      const result = await businessService.loadAllData(user.id, effectiveUserId);

      if (result.companyName.data) setCompanyName(result.companyName.data);
      if (result.transactions.data) setTransactions(result.transactions.data);
      if (result.recurring.data) setRecurringExpenses(result.recurring.data);
      if (result.goals.data) setGoals(result.goals.data);
      if (result.assets.data) setAssets(result.assets.data);
      if (result.suppliers.data) setSuppliers(result.suppliers.data);
      if (result.liabilities.data) setLiabilities(result.liabilities.data);
      if (result.monthly.data) setMonthlyData(result.monthly.data);
      if (result.categories.data) setCustomCategories(result.categories.data);
    } catch (error) {
      logger.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  // ==================== TRANSACTIONS ====================

  const addTransaction = async (transaction: Omit<Transaction, 'id'>, silent: boolean = false) => {
    if (!user || !effectiveUserId) return;
    const result = await businessService.insertTransaction(effectiveUserId, transaction);
    if (result.error) { toast.error('Erro ao adicionar transação'); return; }

    const newTransaction = result.data!;
    setTransactions(prev => [newTransaction, ...prev]);

    const monthStr = `${newTransaction.date.getFullYear()}-${String(newTransaction.date.getMonth() + 1).padStart(2, '0')}`;
    setMonthlyData(prev => prev.map(m => {
      if (m.month === monthStr) {
        return {
          ...m,
          incomeTotal: newTransaction.type === 'income' ? m.incomeTotal + newTransaction.amount : m.incomeTotal,
          expenseTotal: newTransaction.type === 'expense' ? m.expenseTotal + newTransaction.amount : m.expenseTotal
        };
      }
      return m;
    }));

    if (!silent) toast.success('Transação adicionada com sucesso!');
  };

  const updateTransaction = async (transaction: Transaction) => {
    const result = await businessService.updateTransaction(transaction);
    if (result.error) { toast.error('Erro ao atualizar transação'); return; }
    setTransactions(prev => prev.map(t => t.id === transaction.id ? transaction : t));
    toast.success('Transação atualizada com sucesso!');
  };

  const deleteTransaction = async (id: string) => {
    const result = await businessService.removeTransaction(id);
    if (result.error) { toast.error('Erro ao excluir transação'); return; }
    setTransactions(prev => prev.filter(t => t.id !== id));
    toast.success('Transação excluída com sucesso!');
  };

  // ==================== RECURRING EXPENSES ====================

  const addRecurringExpense = async (expense: Omit<RecurringExpense, 'id' | 'isPaid' | 'paidMonths' | 'createdAt'>) => {
    if (!user || !effectiveUserId) return;
    const result = await businessService.insertRecurringExpense(effectiveUserId, expense);
    if (result.error) { toast.error('Erro ao adicionar despesa recorrente'); return; }
    setRecurringExpenses(prev => [...prev, result.data!]);
    toast.success('Despesa recorrente adicionada com sucesso!');
  };

  const updateRecurringExpense = async (expense: RecurringExpense) => {
    const result = await businessService.updateRecurringExpense(expense);
    if (result.error) { toast.error('Erro ao atualizar despesa recorrente'); return; }
    setRecurringExpenses(prev => prev.map(item => item.id === expense.id ? expense : item));
    toast.success('Despesa recorrente atualizada com sucesso!');
  };

  const deleteRecurringExpense = async (id: string) => {
    const result = await businessService.removeRecurringExpense(id);
    if (result.error) { toast.error('Erro ao excluir despesa recorrente'); return; }
    setRecurringExpenses(prev => prev.filter(item => item.id !== id));
    toast.success('Despesa recorrente excluída com sucesso!');
  };

  const getMonthlyExpenseValue = (expenseId: string, month: string): number | null => {
    const expense = recurringExpenses.find(e => e.id === expenseId);
    if (!expense) return null;
    if (expense.monthlyValues && month in expense.monthlyValues) return expense.monthlyValues[month];
    return typeof expense.amount === 'number' ? expense.amount : null;
  };

  const setMonthlyExpenseValue = async (expenseId: string, month: string, value: number | null): Promise<void> => {
    const expense = recurringExpenses.find(e => e.id === expenseId);
    if (!expense) { toast.error('Despesa recorrente não encontrada'); return; }

    const monthlyValues = { ...(expense.monthlyValues || {}) };
    if (value === null) { delete monthlyValues[month]; } else { monthlyValues[month] = value; }

    const result = await businessService.updateMonthlyValues(expenseId, monthlyValues);
    if (result.error) { toast.error('Erro ao atualizar valor mensal'); return; }
    setRecurringExpenses(prev => prev.map(e => e.id === expenseId ? { ...e, monthlyValues } : e));
    toast.success(value === null ? `Valor personalizado removido para ${month}` : `Valor personalizado definido para ${month}`);
  };

  const markRecurringExpenseAsPaid = async (id: string, month: string, paid: boolean) => {
    try {
      const expense = recurringExpenses.find(e => e.id === id);
      if (!expense) throw new Error("Despesa recorrente não encontrada");

      if (paid) {
        const expenseAmount = getMonthlyExpenseValue(id, month);
        if (expenseAmount === null) { toast.error('Não é possível marcar como paga uma despesa sem valor definido'); return; }
      }

      const paidMonths = [...(expense.paidMonths || [])];
      const isAlreadyPaid = paidMonths.includes(month);
      if (paid && !isAlreadyPaid) paidMonths.push(month);
      else if (!paid && isAlreadyPaid) {
        const index = paidMonths.indexOf(month);
        if (index > -1) paidMonths.splice(index, 1);
      }

      const result = await businessService.updatePaidMonths(id, paidMonths);
      if (result.error) throw new Error(result.error);

      setRecurringExpenses(prev => prev.map(e => e.id === id ? { ...e, paidMonths } : e));

      if (paid && !isAlreadyPaid) {
        const amount = getMonthlyExpenseValue(id, month) || expense.amount;
        if (amount > 0) {
          const [year, monthNum] = month.split('-').map(Number);
          const dueDate = new Date(year, monthNum - 1, expense.dueDay);
          addTransaction({
            date: dueDate,
            description: `${expense.description} (Despesa Fixa)`,
            category: expense.category,
            amount,
            type: 'expense',
            paymentMethod: expense.paymentMethod,
            isRecurringPayment: true,
            recurringExpenseId: id,
          }, true);
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
    }
  };

  const isRecurringExpensePaid = (id: string, month: string) => {
    const expense = recurringExpenses.find(e => e.id === id);
    return expense ? (expense.paidMonths || []).includes(month) : false;
  };

  const editRecurringExpense = async (expense: RecurringExpense) => {
    await updateRecurringExpense(expense);
  };

  // ==================== GOALS ====================

  const addGoal = async (goal: Omit<Goal, 'id'>) => {
    if (!user || !effectiveUserId) return;
    const result = await businessService.insertGoal(effectiveUserId, goal);
    if (result.error) { toast.error('Erro ao adicionar meta'); return; }
    setGoals(prev => [...prev, result.data!]);
    toast.success('Meta adicionada com sucesso!');
  };

  const updateGoal = (goal: Goal) => {
    setGoals(prev => prev.map(item => item.id === goal.id ? goal : item));
  };

  const deleteGoal = async (id: string) => {
    if (!user || !effectiveUserId) return;
    const result = await businessService.removeGoal(id, effectiveUserId);
    if (result.error) { toast.error('Erro ao excluir meta'); return; }
    setGoals(prev => prev.filter(item => item.id !== id));
    toast.success('Meta excluída com sucesso!');
  };

  const addGoalContribution = (goalId: string, amount: number) => {
    setGoals(prev => prev.map(goal => goal.id === goalId ? { ...goal, currentAmount: goal.currentAmount + amount } : goal));
  };

  const editGoal = (goal: Goal) => {
    setGoals(prev => prev.map(g => g.id === goal.id ? goal : g));
    toast.success('Meta atualizada com sucesso!');
  };

  // ==================== ASSETS ====================

  const addAsset = async (asset: Omit<Asset, 'id'>) => {
    if (!user || !effectiveUserId) return;
    const result = await businessService.insertAsset(effectiveUserId, asset);
    if (result.error) { toast.error('Erro ao adicionar ativo'); return; }
    setAssets(prev => [...prev, result.data!]);
    toast.success('Ativo adicionado com sucesso!');
  };

  const updateAsset = async (asset: Asset) => {
    const result = await businessService.updateAssetDB(asset);
    if (result.error) { toast.error('Erro ao atualizar ativo'); return; }
    setAssets(prev => prev.map(item => item.id === asset.id ? asset : item));
  };

  const deleteAsset = async (id: string) => {
    const result = await businessService.removeAsset(id);
    if (result.error) { toast.error('Erro ao excluir ativo'); return; }
    setAssets(prev => prev.filter(item => item.id !== id));
  };

  const editAsset = async (asset: Asset) => {
    await updateAsset(asset);
    toast.success('Ativo atualizado com sucesso!');
  };

  // ==================== SUPPLIERS ====================

  const addSupplier = async (supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user || !effectiveUserId) return;
    const result = await businessService.insertSupplier(effectiveUserId, supplier);
    if (result.error) { toast.error('Erro ao adicionar fornecedor'); return; }
    setSuppliers(prev => [...prev, result.data!]);
    toast.success('Fornecedor adicionado com sucesso!');
  };

  const updateSupplier = async (supplier: Supplier) => {
    const result = await businessService.updateSupplierDB(supplier);
    if (result.error) { toast.error('Erro ao atualizar fornecedor'); return; }
    setSuppliers(prev => prev.map(item => item.id === supplier.id ? supplier : item));
  };

  const deleteSupplier = async (id: string) => {
    const result = await businessService.removeSupplier(id);
    if (result.error) { toast.error('Erro ao excluir fornecedor'); return; }
    setSuppliers(prev => prev.filter(item => item.id !== id));
  };

  const editSupplier = async (supplier: Supplier) => {
    const updatedSupplier = { ...supplier, updatedAt: new Date() };
    await updateSupplier(updatedSupplier);
    toast.success('Fornecedor atualizado com sucesso!');
  };

  const getSupplierByDocument = (document: string): Supplier | undefined => {
    return suppliers.find(supplier => supplier.document === document);
  };

  // ==================== LIABILITIES ====================

  const addLiability = async (liability: Omit<Liability, 'id'>) => {
    if (!user || !effectiveUserId) return;
    const result = await businessService.insertLiability(effectiveUserId, liability);
    if (result.error) { toast.error('Erro ao adicionar passivo'); return; }
    setLiabilities(prev => [...prev, result.data!]);
    toast.success('Passivo adicionado com sucesso!');
  };

  const editLiability = async (liability: Liability) => {
    const result = await businessService.updateLiabilityDB(liability);
    if (result.error) { toast.error('Erro ao atualizar passivo'); return; }
    setLiabilities(prev => prev.map(l => l.id === liability.id ? liability : l));
    toast.success('Passivo atualizado com sucesso!');
  };

  const deleteLiability = async (id: string) => {
    const result = await businessService.removeLiability(id);
    if (result.error) { toast.error('Erro ao excluir passivo'); return; }
    setLiabilities(prev => prev.filter(l => l.id !== id));
    toast.success('Passivo excluído com sucesso!');
  };

  // ==================== INVESTMENTS ====================

  const addInvestment = async (investment: Investment) => {
    if (!user || !effectiveUserId) return;
    const result = await businessService.insertInvestment(effectiveUserId, investment);
    if (result.error) { toast.error('Erro ao salvar investimento'); return; }
    setInvestments(prev => [...prev, investment]);
    toast.success('Investimento salvo com sucesso!');
  };

  const updateInvestment = async (investment: Investment) => {
    const result = await businessService.updateInvestmentDB(investment);
    if (result.error) { toast.error('Erro ao atualizar investimento'); return; }
    setInvestments(prev => prev.map(item => item.id === investment.id ? investment : item));
    toast.success('Investimento atualizado com sucesso!');
  };

  const deleteInvestment = async (id: string) => {
    const result = await businessService.removeInvestment(id);
    if (result.error) { toast.error('Erro ao excluir investimento'); return; }
    setInvestments(prev => prev.filter(item => item.id !== id));
    toast.success('Investimento excluído com sucesso!');
  };

  const updatePaidInstallments = async (id: string, paidInstallments: number) => {
    const investment = investments.find(inv => inv.id === id);
    if (!investment) return;
    const result = await businessService.updateInvestmentInstallments(id, investment, paidInstallments);
    if (result.error) { toast.error('Erro ao atualizar parcelas pagas'); return; }
    setInvestments(prev => prev.map(item => item.id === id ? { ...item, paidInstallments } : item));
    toast.success('Parcelas pagas atualizadas!');
  };

  // ==================== CUSTOM CATEGORIES ====================

  const addCustomCategory = async (type: 'income' | 'expense', category: string): Promise<boolean> => {
    if (!user || !effectiveUserId) return false;
    const categoryToAdd = category.startsWith('Crie sua categoria: ') ? category : `Crie sua categoria: ${category}`;
    if (customCategories[type].includes(categoryToAdd)) return true;

    const result = await businessService.insertCustomCategory(effectiveUserId, type, categoryToAdd);
    if (result.error) { toast.error('Erro ao adicionar categoria'); return false; }

    setCustomCategories(prev => ({ ...prev, [type]: [...prev[type], categoryToAdd] }));
    await loadData();
    toast.success('Categoria personalizada adicionada!');
    return true;
  };

  const editCustomCategory = async (id: string, type: 'income' | 'expense', oldName: string, newName: string) => {
    if (!user || !effectiveUserId) return;
    const categoryToUpdate = newName.startsWith('Crie sua categoria: ') ? newName : `Crie sua categoria: ${newName}`;

    const updateResult = await businessService.updateCustomCategoryName(effectiveUserId, type, oldName, categoryToUpdate);
    if (updateResult.error) { toast.error('Erro ao editar categoria'); return; }

    await Promise.all([
      businessService.updateCategoryInTransactions(effectiveUserId, oldName, categoryToUpdate),
      businessService.updateCategoryInRecurring(effectiveUserId, oldName, categoryToUpdate)
    ]);

    setCustomCategories(prev => ({ ...prev, [type]: prev[type].map(cat => cat === oldName ? categoryToUpdate : cat) }));
    setTransactions(prev => prev.map(t => t.category === oldName ? { ...t, category: categoryToUpdate } : t));
    setRecurringExpenses(prev => prev.map(e => e.category === oldName ? { ...e, category: categoryToUpdate } : e));
    toast.success('Categoria atualizada com sucesso!');
  };

  const deleteCustomCategory = async (type: 'income' | 'expense', categoryName: string): Promise<boolean> => {
    if (!user || !effectiveUserId) return false;

    const inUseResult = await businessService.checkCategoryInUse(effectiveUserId, categoryName);
    if (inUseResult.error) { toast.error('Erro ao verificar categoria'); return false; }
    if (inUseResult.data) { toast.error('Esta categoria está em uso e não pode ser excluída'); return false; }

    const result = await businessService.removeCustomCategory(effectiveUserId, type, categoryName);
    if (result.error) { toast.error('Erro ao deletar categoria'); return false; }

    setCustomCategories(prev => ({ ...prev, [type]: prev[type].filter(cat => cat !== categoryName) }));
    toast.success('Categoria excluída com sucesso!');
    return true;
  };

  // ==================== MONTH TOTALS ====================

  const getMonthTotals = () => {
    const currentMonthTransactions = transactions.filter(t => {
      const transactionMonth = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
      return transactionMonth === currentMonth;
    });
    const income = currentMonthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = currentMonthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const balance = income - expense;
    const savingRate = income > 0 ? ((income - expense) / income) * 100 : 0;
    return { income, expense, balance, savingRate };
  };

  const calculateHealthSnapshot = async () => {
    const result = await businessService.calculateHealthSnapshot();
    if (result.error) { logger.error('Erro ao calcular saúde financeira:', result.error); throw new Error(result.error); }
  };

  const reloadData = async () => {
    await loadData();
    toast.info('Dados atualizados!');
  };

  const value = {
    transactions, addTransaction, editTransaction: updateTransaction, updateTransaction, deleteTransaction,
    recurringExpenses, addRecurringExpense, updateRecurringExpense, deleteRecurringExpense,
    goals, addGoal, updateGoal, deleteGoal, addGoalContribution,
    assets, addAsset, updateAsset, deleteAsset, editAsset,
    suppliers, addSupplier, updateSupplier, deleteSupplier, editSupplier, getSupplierByDocument,
    investments, addInvestment, updateInvestment, deleteInvestment, updatePaidInstallments,
    liabilities, addLiability, editLiability, deleteLiability,
    monthlyData, currentMonth, setCurrentMonth,
    getMonthTotals, markRecurringExpenseAsPaid, isRecurringExpensePaid,
    editRecurringExpense, editGoal,
    companyName, setCompanyName,
    getMonthlyExpenseValue, setMonthlyExpenseValue,
    calculateHealthSnapshot, reloadData,
    customCategories, addCustomCategory, editCustomCategory, deleteCustomCategory
  };

  return (
    <BusinessContext.Provider value={value}>
      {children}
    </BusinessContext.Provider>
  );
};
