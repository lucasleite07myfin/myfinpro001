
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Transaction, RecurringExpense, Goal, Asset, Liability, MonthlyFinanceData } from '@/types/finance';
import { Investment } from '@/components/AddInvestmentModal';
import { Supplier } from '@/types/supplier';
import { toast } from 'sonner';
import { getCurrentMonth } from '@/utils/formatters';

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
  markRecurringAsPaid: (id: string, year: number, month: number) => void;
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
  // Add the missing methods
  getMonthlyExpenseValue: (expenseId: string, month: string) => number | null;
  setMonthlyExpenseValue: (expenseId: string, month: string, value: number | null) => void;
}

interface BusinessProviderProps {
  children: ReactNode;
}

// Create the context
const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

// Provide a hook for using the context
export const useBusiness = (): BusinessContextType => {
  const context = useContext(BusinessContext);
  if (context === undefined) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
};

// Generate sample monthly data
const generateMonthlyData = (): MonthlyFinanceData[] => {
  const data: MonthlyFinanceData[] = [];
  const now = new Date();
  
  for (let i = 11; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStr = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
    
    data.push({
      month: monthStr,
      incomeTotal: Math.floor(Math.random() * 5000) + 3000,
      expenseTotal: Math.floor(Math.random() * 3000) + 2000
    });
  }
  
  return data;
};

// Provider component
export const BusinessProvider = ({ children }: BusinessProviderProps) => {
  // Existing state variables
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyFinanceData[]>(generateMonthlyData());
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth());
  const [companyName, setCompanyName] = useState('Minha Empresa');
  
  // New state variables for investments
  const [investments, setInvestments] = useState<Investment[]>([]);

  // Transaction functions
  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    setTransactions(prev => [...prev, { ...transaction, id: uuidv4() }]);
    toast.success('Transação adicionada com sucesso!');
    updateMonthlyData();
  };

  const updateTransaction = (transaction: Transaction) => {
    setTransactions(prev => prev.map(item => item.id === transaction.id ? transaction : item));
    toast.success('Transação atualizada com sucesso!');
    updateMonthlyData();
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(item => item.id !== id));
    toast.success('Transação excluída com sucesso!');
    updateMonthlyData();
  };

  // Recurring expense functions
  const addRecurringExpense = (expense: Omit<RecurringExpense, 'id' | 'isPaid' | 'paidMonths' | 'createdAt'>) => {
    const newExpense: RecurringExpense = {
      ...expense,
      id: uuidv4(),
      isPaid: false,
      paidMonths: [],
      createdAt: new Date(),
      repeatMonths: expense.repeatMonths || 12
    };
    setRecurringExpenses(prev => [...prev, newExpense]);
    toast.success('Despesa fixa adicionada com sucesso!');
  };

  const updateRecurringExpense = (expense: RecurringExpense) => {
    setRecurringExpenses(prev => prev.map(item => item.id === expense.id ? expense : item));
  };

  const deleteRecurringExpense = (id: string) => {
    setRecurringExpenses(prev => prev.filter(item => item.id !== id));
  };

  const markRecurringAsPaid = (id: string, year: number, month: number) => {
    const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
    
    setRecurringExpenses(prev => prev.map(expense => {
      if (expense.id === id) {
        const paidMonths = expense.paidMonths || [];
        if (paidMonths.includes(monthKey)) {
          return {
            ...expense,
            paidMonths: paidMonths.filter(m => m !== monthKey)
          };
        } else {
          return {
            ...expense,
            paidMonths: [...paidMonths, monthKey]
          };
        }
      }
      return expense;
    }));
  };

  // Find transaction for a recurring expense in a specific month
  const findRecurringExpenseTransaction = (expenseId: string, month: string) => {
    return transactions.find(t => 
      t.type === 'expense' && 
      t.isRecurringPayment === true && 
      t.recurringExpenseId === expenseId &&
      `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}` === month
    );
  };

  // Updated markRecurringExpenseAsPaid function to create/delete transactions
  const markRecurringExpenseAsPaid = (id: string, month: string, paid: boolean) => {
    // Find the expense first
    const expense = recurringExpenses.find(e => e.id === id);
    if (!expense) return;
    
    // Get expense amount for this specific month
    const expenseAmount = getMonthlyExpenseValue(id, month);
    
    // Check if amount is defined before proceeding
    if (expenseAmount === null && paid) {
      toast.error('Não é possível marcar como paga uma despesa sem valor definido');
      return;
    }
    
    // Find any existing transaction for this expense in this month
    const existingTransaction = findRecurringExpenseTransaction(id, month);
    
    // Update the recurring expense's paidMonths
    setRecurringExpenses(prev => prev.map(expense => {
      if (expense.id === id) {
        const paidMonths = [...(expense.paidMonths || [])];
        
        if (paid && !paidMonths.includes(month)) {
          paidMonths.push(month);
        } else if (!paid && paidMonths.includes(month)) {
          const index = paidMonths.indexOf(month);
          if (index > -1) {
            paidMonths.splice(index, 1);
          }
        }
        
        return { ...expense, paidMonths };
      }
      return expense;
    }));
    
    // Create or delete transaction based on paid status
    if (paid && !existingTransaction && expenseAmount !== null) {
      // Parse month into Date
      const [year, monthNum] = month.split('-').map(Number);
      const dueDate = new Date(year, monthNum - 1, expense.dueDay);
      
      // Create a transaction for the paid recurring expense
      addTransaction({
        date: dueDate,
        description: `${expense.description} (Despesa Fixa)`,
        category: expense.category,
        amount: expenseAmount,
        type: 'expense',
        paymentMethod: expense.paymentMethod,
        isRecurringPayment: true,
        recurringExpenseId: expense.id
      });
      
      toast.success(`Despesa fixa marcada como paga para ${month}`);
    } 
    else if (!paid && existingTransaction) {
      // Remove the transaction when unmarking as paid
      deleteTransaction(existingTransaction.id);
      toast.success(`Despesa fixa marcada como não paga para ${month}`);
    }
    else {
      toast.success(`Status da despesa fixa atualizado para ${month}`);
    }
    
    updateMonthlyData();
  };

  const isRecurringExpensePaid = (id: string, month: string) => {
    const expense = recurringExpenses.find(e => e.id === id);
    return expense ? (expense.paidMonths || []).includes(month) : false;
  };

  const editRecurringExpense = (expense: RecurringExpense) => {
    setRecurringExpenses(recurringExpenses.map(e => e.id === expense.id ? expense : e));
    toast.success('Despesa fixa atualizada com sucesso!');
  };

  // Goal functions
  const addGoal = (goal: Omit<Goal, 'id'>) => {
    setGoals(prev => [...prev, { ...goal, id: uuidv4() }]);
  };

  const updateGoal = (goal: Goal) => {
    setGoals(prev => prev.map(item => item.id === goal.id ? goal : item));
  };

  const deleteGoal = (id: string) => {
    setGoals(prev => prev.filter(item => item.id !== id));
  };

  const addGoalContribution = (goalId: string, amount: number) => {
    setGoals(prev => prev.map(goal => {
      if (goal.id === goalId) {
        return {
          ...goal,
          currentAmount: goal.currentAmount + amount
        };
      }
      return goal;
    }));
  };

  const editGoal = (goal: Goal) => {
    setGoals(goals.map(g => g.id === goal.id ? goal : g));
    toast.success('Meta atualizada com sucesso!');
  };

  // Asset functions
  const addAsset = (asset: Omit<Asset, 'id'>) => {
    setAssets(prev => [...prev, { ...asset, id: uuidv4() }]);
  };

  const updateAsset = (asset: Asset) => {
    setAssets(prev => prev.map(item => item.id === asset.id ? asset : item));
  };

  const deleteAsset = (id: string) => {
    setAssets(prev => prev.filter(item => item.id !== id));
  };

  // Alias for updateAsset to match component expectations
  const editAsset = (asset: Asset) => {
    updateAsset(asset);
    toast.success('Ativo atualizado com sucesso!');
  };

  // Supplier functions
  const addSupplier = (supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newSupplier = { 
      ...supplier, 
      id: uuidv4(), 
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setSuppliers(prev => [...prev, newSupplier]);
  };

  const updateSupplier = (supplier: Supplier) => {
    setSuppliers(prev => prev.map(item => item.id === supplier.id ? supplier : item));
  };

  const deleteSupplier = (id: string) => {
    setSuppliers(prev => prev.filter(item => item.id !== id));
  };

  // Alias for updateSupplier to match component expectations
  const editSupplier = (supplier: Supplier) => {
    const updatedSupplier = {
      ...supplier,
      updatedAt: new Date()
    };
    updateSupplier(updatedSupplier);
    toast.success('Fornecedor atualizado com sucesso!');
  };

  const getSupplierByDocument = (document: string): Supplier | undefined => {
    return suppliers.find(supplier => supplier.document === document);
  };

  // Liability functions
  const addLiability = (liability: Omit<Liability, 'id'>) => {
    setLiabilities(prev => [...prev, { ...liability, id: uuidv4() }]);
    toast.success('Passivo adicionado com sucesso!');
  };

  const editLiability = (liability: Liability) => {
    setLiabilities(liabilities.map(l => l.id === liability.id ? liability : l));
    toast.success('Passivo atualizado com sucesso!');
  };

  const deleteLiability = (id: string) => {
    setLiabilities(liabilities.filter(l => l.id !== id));
    toast.success('Passivo excluído com sucesso!');
  };

  // Functions for managing investments
  const addInvestment = (investment: Investment) => {
    setInvestments(prev => [...prev, { ...investment, id: uuidv4() }]);
  };

  const updateInvestment = (investment: Investment) => {
    setInvestments(prev => prev.map(item => item.id === investment.id ? investment : item));
  };

  const deleteInvestment = (id: string) => {
    setInvestments(prev => prev.filter(item => item.id !== id));
  };

  const updatePaidInstallments = (id: string, paidInstallments: number) => {
    setInvestments(prev => prev.map(item => 
      item.id === id ? { ...item, paidInstallments } : item
    ));
  };

  // Função auxiliar para atualizar dados mensais
  const updateMonthlyData = () => {
    // Calculamos com base nas transações reais
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

  // Updated getMonthlyExpenseValue to properly handle null values
  const getMonthlyExpenseValue = (expenseId: string, month: string): number | null => {
    const expense = recurringExpenses.find(e => e.id === expenseId);
    if (!expense) return null;
    
    // Check if there is a month-specific value
    if (expense.monthlyValues && month in expense.monthlyValues) {
      return expense.monthlyValues[month];
    }
    
    // Return the default amount or null if not set
    return typeof expense.amount === 'number' ? expense.amount : null;
  };
  
  const setMonthlyExpenseValue = (expenseId: string, month: string, value: number | null): void => {
    setRecurringExpenses(prev => prev.map(expense => {
      if (expense.id === expenseId) {
        const monthlyValues = { ...(expense.monthlyValues || {}) };
        
        if (value === null) {
          // Remove the specific month value if setting to null
          delete monthlyValues[month];
        } else {
          // Set the specific month value
          monthlyValues[month] = value;
        }
        
        return {
          ...expense,
          monthlyValues
        };
      }
      return expense;
    }));
    
    if (value === null) {
      toast.success(`Valor personalizado removido para ${month}`);
    } else {
      toast.success(`Valor personalizado definido para ${month}`);
    }
  };

  // Context value
  const value = {
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    recurringExpenses,
    addRecurringExpense,
    updateRecurringExpense,
    deleteRecurringExpense,
    markRecurringAsPaid,
    goals,
    addGoal,
    updateGoal,
    deleteGoal,
    addGoalContribution,
    assets,
    addAsset,
    updateAsset,
    deleteAsset,
    editAsset,
    suppliers,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    editSupplier,
    getSupplierByDocument,
    investments,
    addInvestment,
    updateInvestment,
    deleteInvestment,
    updatePaidInstallments,
    liabilities,
    addLiability,
    editLiability,
    deleteLiability,
    monthlyData,
    currentMonth,
    setCurrentMonth,
    getMonthTotals,
    markRecurringExpenseAsPaid,
    isRecurringExpensePaid,
    editRecurringExpense,
    editGoal,
    companyName,
    setCompanyName,
    // Add the new methods to the context value
    getMonthlyExpenseValue,
    setMonthlyExpenseValue,
  };

  return (
    <BusinessContext.Provider value={value}>
      {children}
    </BusinessContext.Provider>
  );
};
