import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Transaction, RecurringExpense, Goal, Asset, Liability, MonthlyFinanceData, PaymentMethod } from '@/types/finance';
import { Investment } from '@/components/AddInvestmentModal';
import { Supplier } from '@/types/supplier';
import { toast } from 'sonner';
import { getCurrentMonth } from '@/utils/formatters';
import { supabase } from '@/integrations/supabase/client';

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
  getMonthlyExpenseValue: (expenseId: string, month: string) => number | null;
  setMonthlyExpenseValue: (expenseId: string, month: string, value: number | null) => void;
  calculateHealthSnapshot: () => Promise<void>;
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

// Generate monthly data based on transactions
const generateMonthlyDataFromTransactions = (transactions: Transaction[]): MonthlyFinanceData[] => {
  const data: MonthlyFinanceData[] = [];
  const now = new Date();
  
  for (let i = 11; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStr = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
    
    // Filter transactions for this month
    const monthTransactions = transactions.filter(t => {
      const transactionMonth = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
      return transactionMonth === monthStr;
    });
    
    // Calculate totals
    const incomeTotal = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const expenseTotal = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    data.push({
      month: monthStr,
      incomeTotal,
      expenseTotal
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
  const [monthlyData, setMonthlyData] = useState<MonthlyFinanceData[]>([]);
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth());
  const [companyName, setCompanyName] = useState('Minha Empresa');
  const [loading, setLoading] = useState(true);
  
  // New state variables for investments
  const [investments, setInvestments] = useState<Investment[]>([]);

  // Carregar dados do Supabase
  useEffect(() => {
    loadData();
  }, []);

  // Atualizar dados mensais quando as transações mudarem
  useEffect(() => {
    if (transactions.length > 0) {
      const newMonthlyData = generateMonthlyDataFromTransactions(transactions);
      setMonthlyData(newMonthlyData);
    }
  }, [transactions]);

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
        suppliersResult,
        liabilitiesResult,
        monthlyResult
      ] = await Promise.all([
        (supabase.from('emp_transactions') as any).select('*').eq('user_id', user.id),
        (supabase.from('emp_recurring_expenses') as any).select('*').eq('user_id', user.id),
        (supabase.from('emp_goals') as any).select('*').eq('user_id', user.id),
        (supabase.from('emp_assets') as any).select('*').eq('user_id', user.id),
        (supabase.from('suppliers') as any).select('*').eq('user_id', user.id),
        (supabase.from('emp_liabilities') as any).select('*').eq('user_id', user.id),
        (supabase.from('emp_monthly_finance_data') as any).select('*').eq('user_id', user.id)
      ]);

      if (transactionsResult.data) {
        const formattedTransactions = transactionsResult.data.map((t: any) => ({
          id: t.id,
          date: new Date(t.date + 'T12:00:00'),
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
        const formattedExpenses = recurringResult.data.map((e: any) => ({
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
        const formattedGoals = goalsResult.data.map((g: any) => ({
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
        const formattedAssets = assetsResult.data.map((a: any) => ({
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

      if (suppliersResult.data) {
        const formattedSuppliers = suppliersResult.data.map((s: any) => ({
          id: s.id,
          name: s.name,
          document: s.document,
          stateRegistration: s.state_registration,
          isCompany: s.is_company,
          productType: s.product_type,
          otherProductType: s.other_product_type,
          contactPerson: s.contact_person,
          email: s.email,
          phone: s.phone,
          address: s.address as any,
          bankInfo: s.bank_info as any,
          paymentTerms: s.payment_terms,
          notes: s.notes,
          createdAt: new Date(s.created_at || new Date()),
          updatedAt: new Date(s.updated_at || new Date())
        }));
        setSuppliers(formattedSuppliers);
      }

      if (liabilitiesResult.data) {
        const formattedLiabilities = liabilitiesResult.data.map((l: any) => ({
          id: l.id,
          name: l.name,
          type: l.type,
          value: Number(l.value)
        }));
        setLiabilities(formattedLiabilities);
      }

      if (monthlyResult.data) {
        const formattedMonthly = monthlyResult.data.map((m: any) => ({
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

  // Transaction functions
  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('emp_transactions')
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

      setTransactions(prev => [...prev, newTransaction]);
      toast.success('Transação adicionada com sucesso!');
      updateMonthlyData();
    } catch (error) {
      console.error('Erro ao adicionar transação:', error);
      toast.error('Erro ao adicionar transação');
    }
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
  const addRecurringExpense = async (expense: Omit<RecurringExpense, 'id' | 'isPaid' | 'paidMonths' | 'createdAt'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('emp_recurring_expenses')
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
      console.error('Erro ao adicionar despesa recorrente:', error);
      toast.error('Erro ao adicionar despesa recorrente');
    }
  };

  const updateRecurringExpense = async (expense: RecurringExpense) => {
    try {
      const { error } = await supabase
        .from('emp_recurring_expenses')
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

      setRecurringExpenses(prev => prev.map(item => item.id === expense.id ? expense : item));
      toast.success('Despesa recorrente atualizada com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar despesa recorrente:', error);
      toast.error('Erro ao atualizar despesa recorrente');
    }
  };

  const deleteRecurringExpense = async (id: string) => {
    try {
      const { error } = await supabase
        .from('emp_recurring_expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setRecurringExpenses(prev => prev.filter(item => item.id !== id));
      toast.success('Despesa recorrente excluída com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir despesa recorrente:', error);
      toast.error('Erro ao excluir despesa recorrente');
    }
  };

  const markRecurringAsPaid = async (id: string, year: number, month: number) => {
    const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
    const expense = recurringExpenses.find(e => e.id === id);
    if (!expense) return;

    const paidMonths = expense.paidMonths || [];
    const isPaid = paidMonths.includes(monthKey);

    let newPaidMonths: string[];

    if (isPaid) {
      newPaidMonths = paidMonths.filter(m => m !== monthKey);
    } else {
      newPaidMonths = [...paidMonths, monthKey];
    }

    try {
      const { error } = await supabase
        .from('emp_recurring_expenses')
        .update({ paid_months: newPaidMonths })
        .eq('id', id);

      if (error) throw error;

      setRecurringExpenses(prev => prev.map(e => e.id === id ? { ...e, paidMonths: newPaidMonths } : e));
      toast.success(`Despesa marcada como ${!isPaid ? 'paga' : 'não paga'}`);
    } catch (error) {
      console.error('Erro ao atualizar despesa recorrente:', error);
      toast.error('Erro ao atualizar despesa recorrente');
    }
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
  const addGoal = async (goal: Omit<Goal, 'id'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('emp_goals')
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

      setGoals(prev => [...prev, newGoal]);
      toast.success('Meta adicionada com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar meta:', error);
      toast.error('Erro ao adicionar meta');
    }
  };

  const updateGoal = (goal: Goal) => {
    setGoals(prev => prev.map(item => item.id === goal.id ? goal : item));
  };

  const deleteGoal = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('emp_goals')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setGoals(prev => prev.filter(item => item.id !== id));
      toast.success('Meta excluída com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir meta:', error);
      toast.error('Erro ao excluir meta');
    }
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
  const addAsset = async (asset: Omit<Asset, 'id'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('emp_assets')
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

      setAssets(prev => [...prev, newAsset]);
      toast.success('Ativo adicionado com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar ativo:', error);
      toast.error('Erro ao adicionar ativo');
    }
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
  const addSupplier = async (supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('suppliers')
        .insert({
          user_id: user.id,
          name: supplier.name,
          document: supplier.document,
          state_registration: supplier.stateRegistration,
          is_company: supplier.isCompany,
          product_type: supplier.productType,
          other_product_type: supplier.otherProductType,
          contact_person: supplier.contactPerson,
          email: supplier.email,
          phone: supplier.phone,
          address: supplier.address,
          bank_info: supplier.bankInfo,
          payment_terms: supplier.paymentTerms,
          notes: supplier.notes
        })
        .select()
        .single();

      if (error) throw error;

      const newSupplier: Supplier = {
        id: data.id,
        name: supplier.name,
        document: supplier.document,
        stateRegistration: supplier.stateRegistration,
        isCompany: supplier.isCompany,
        productType: supplier.productType,
        otherProductType: supplier.otherProductType,
        contactPerson: supplier.contactPerson,
        email: supplier.email,
        phone: supplier.phone,
        address: supplier.address,
        bankInfo: supplier.bankInfo,
        paymentTerms: supplier.paymentTerms,
        notes: supplier.notes,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };

      setSuppliers(prev => [...prev, newSupplier]);
      toast.success('Fornecedor adicionado com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar fornecedor:', error);
      toast.error('Erro ao adicionar fornecedor');
    }
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
  const addLiability = async (liability: Omit<Liability, 'id'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('emp_liabilities')
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
      console.error('Erro ao adicionar passivo:', error);
      toast.error('Erro ao adicionar passivo');
    }
  };

  const editLiability = (liability: Liability) => {
    setLiabilities(liabilities.map(l => l.id === liability.id ? liability : l));
    toast.success('Passivo atualizado com sucesso!');
  };

  const deleteLiability = (id: string) => {
    setLiabilities(liabilities.filter(l => l.id !== id));
    toast.success('Passivo excluído com sucesso!');
  };

  // Functions for managing investments (salvando no banco de dados)
  const addInvestment = async (investment: Investment) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('emp_assets')
        .insert({
          user_id: user.id,
          name: investment.name,
          type: 'Investimento',
          value: investment.value,
          notes: JSON.stringify({
            installments: investment.installments,
            installmentValue: investment.installmentValue,
            startDate: investment.startDate.toISOString(),
            paidInstallments: investment.paidInstallments,
            description: investment.description,
            investmentType: investment.type
          })
        })
        .select()
        .single();

      if (error) throw error;

      setInvestments(prev => [...prev, investment]);
      toast.success('Investimento salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar investimento:', error);
      toast.error('Erro ao salvar investimento');
    }
  };

  const updateInvestment = async (investment: Investment) => {
    try {
      const { error } = await supabase
        .from('emp_assets')
        .update({
          name: investment.name,
          value: investment.value,
          notes: JSON.stringify({
            installments: investment.installments,
            installmentValue: investment.installmentValue,
            startDate: investment.startDate.toISOString(),
            paidInstallments: investment.paidInstallments,
            description: investment.description,
            investmentType: investment.type
          })
        })
        .eq('id', investment.id);

      if (error) throw error;

      setInvestments(prev => prev.map(item => item.id === investment.id ? investment : item));
      toast.success('Investimento atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar investimento:', error);
      toast.error('Erro ao atualizar investimento');
    }
  };

  const deleteInvestment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('emp_assets')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setInvestments(prev => prev.filter(item => item.id !== id));
      toast.success('Investimento excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir investimento:', error);
      toast.error('Erro ao excluir investimento');
    }
  };

  const updatePaidInstallments = async (id: string, paidInstallments: number) => {
    try {
      const investment = investments.find(inv => inv.id === id);
      if (!investment) return;

      const { error } = await supabase
        .from('emp_assets')
        .update({
          notes: JSON.stringify({
            installments: investment.installments,
            installmentValue: investment.installmentValue,
            startDate: investment.startDate.toISOString(),
            paidInstallments: paidInstallments,
            description: investment.description,
            investmentType: investment.type
          })
        })
        .eq('id', id);

      if (error) throw error;

      setInvestments(prev => prev.map(item => 
        item.id === id ? { ...item, paidInstallments } : item
      ));
      toast.success('Parcelas pagas atualizadas!');
    } catch (error) {
      console.error('Erro ao atualizar parcelas pagas:', error);
      toast.error('Erro ao atualizar parcelas pagas');
    }
  };

  // Função auxiliar para atualizar dados mensais
  const updateMonthlyData = () => {
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

    // Atualizar os dados mensais no estado
    setMonthlyData(updatedMonthlyData);
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

  const calculateHealthSnapshot = async () => {
    try {
      const { error } = await supabase.functions.invoke('calculate-health', {
        body: { mode: 'single_user' }
      });
      
      if (error) throw error;
    } catch (error) {
      console.error('Erro ao calcular saúde financeira:', error);
      throw error;
    }
  };

  // Context value
  const value = {
    transactions,
    addTransaction,
    editTransaction: updateTransaction, // Alias para compatibilidade
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
    getMonthlyExpenseValue,
    setMonthlyExpenseValue,
    calculateHealthSnapshot
  };

  return (
    <BusinessContext.Provider value={value}>
      {children}
    </BusinessContext.Provider>
  );
};
