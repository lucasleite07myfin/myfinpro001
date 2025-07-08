import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Transaction, Goal, Asset, Liability, MonthlyFinanceData, RecurringExpense, CustomCategories } from '@/types/finance';
import { getCurrentMonth } from '@/utils/formatters';
import { toast } from '@/components/ui/sonner';

// Dados iniciais de exemplo
const initialTransactions: Transaction[] = [
  {
    id: uuidv4(),
    date: new Date(),
    description: 'Salário',
    category: 'Salário',
    amount: 5000,
    type: 'income',
    paymentMethod: 'bank_transfer'
  },
  {
    id: uuidv4(),
    date: new Date(),
    description: 'Freelance',
    category: 'Freelance',
    amount: 1500,
    type: 'income',
    paymentMethod: 'pix'
  },
  {
    id: uuidv4(),
    date: new Date(),
    description: 'Aluguel',
    category: 'Moradia',
    amount: 1200,
    type: 'expense',
    paymentMethod: 'bank_transfer'
  },
  {
    id: uuidv4(),
    date: new Date(),
    description: 'Supermercado',
    category: 'Alimentação',
    amount: 800,
    type: 'expense',
    paymentMethod: 'credit_card'
  }
];

// Dados iniciais de despesas recorrentes
const initialRecurringExpenses: RecurringExpense[] = [
  {
    id: uuidv4(),
    description: 'Netflix',
    category: 'Lazer',
    amount: 39.90,
    dueDay: 15,
    paymentMethod: 'credit_card',
    isPaid: false,
    paidMonths: [],
    createdAt: new Date()
  },
  {
    id: uuidv4(),
    description: 'Academia',
    category: 'Saúde',
    amount: 99.90,
    dueDay: 10,
    paymentMethod: 'bank_transfer',
    isPaid: false,
    paidMonths: [],
    createdAt: new Date()
  }
];

// Dados iniciais para categorias customizadas
const initialCustomCategories: CustomCategories = {
  income: [],
  expense: []
};

// Gerar dados de 12 meses para o gráfico
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
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>(initialRecurringExpenses);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyFinanceData[]>(generateMonthlyData());
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth());
  const [customCategories, setCustomCategories] = useState<CustomCategories>(initialCustomCategories);

  // Funções para manipular transações
  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction = { ...transaction, id: uuidv4() };
    setTransactions([...transactions, newTransaction]);
    toast.success('Transação adicionada com sucesso!');
    updateMonthlyData();
  };

  const editTransaction = (transaction: Transaction) => {
    setTransactions(transactions.map(t => t.id === transaction.id ? transaction : t));
    toast.success('Transação atualizada com sucesso!');
    updateMonthlyData();
  };

  const deleteTransaction = (id: string) => {
    setTransactions(transactions.filter(t => t.id !== id));
    toast.success('Transação excluída com sucesso!');
    updateMonthlyData();
  };

  // Funções para manipular categorias customizadas
  const addCustomCategory = (type: 'income' | 'expense', category: string) => {
    setCustomCategories(prev => {
      // Verifica se a categoria já existe para evitar duplicatas
      if (prev[type].includes(category) || prev[type].includes(`Outros: ${category}`)) {
        return prev;
      }
      
      const newCategory = category.startsWith('Outros: ') ? category : `Outros: ${category}`;
      return {
        ...prev,
        [type]: [...prev[type], newCategory]
      };
    });
  };

  // Funções para manipular despesas recorrentes
  const addRecurringExpense = (expense: Omit<RecurringExpense, 'id' | 'isPaid' | 'paidMonths' | 'createdAt'>) => {
    const newExpense: RecurringExpense = {
      ...expense,
      id: uuidv4(),
      isPaid: false,
      paidMonths: [],
      createdAt: new Date(),
      repeatMonths: expense.repeatMonths || 12, // Se não especificado, assume 12 meses
      monthlyValues: {} // Inicializa o objeto de valores mensais vazio
    };
    setRecurringExpenses([...recurringExpenses, newExpense]);
    toast.success('Despesa fixa adicionada com sucesso!');
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
  const addGoal = (goal: Omit<Goal, 'id'>) => {
    const newGoal = { ...goal, id: uuidv4() };
    setGoals([...goals, newGoal]);
    toast.success('Meta adicionada com sucesso!');
  };

  const editGoal = (goal: Goal) => {
    setGoals(goals.map(g => g.id === goal.id ? goal : g));
    toast.success('Meta atualizada com sucesso!');
  };

  const deleteGoal = (id: string) => {
    setGoals(goals.filter(g => g.id !== id));
    toast.success('Meta excluída com sucesso!');
  };

  // Funções para manipular ativos
  const addAsset = (asset: Omit<Asset, 'id'>) => {
    const newAsset = { ...asset, id: uuidv4() };
    setAssets([...assets, newAsset]);
    toast.success('Ativo adicionado com sucesso!');
  };

  const editAsset = (asset: Asset) => {
    setAssets(assets.map(a => a.id === asset.id ? asset : a));
    toast.success('Ativo atualizado com sucesso!');
  };

  const deleteAsset = (id: string) => {
    setAssets(assets.filter(a => a.id !== id));
    toast.success('Ativo excluído com sucesso!');
  };

  // Funções para manipular passivos
  const addLiability = (liability: Omit<Liability, 'id'>) => {
    const newLiability = { ...liability, id: uuidv4() };
    setLiabilities([...liabilities, newLiability]);
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
