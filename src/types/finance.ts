
export type TransactionType = 'income' | 'expense';

export type PaymentMethod = 
  | 'cash'
  | 'credit_card'
  | 'debit_card'
  | 'bank_transfer'
  | 'pix'
  | 'other';

export interface Transaction {
  id: string;
  date: Date;
  description: string;
  category: string;
  amount: number;
  type: TransactionType;
  paymentMethod?: PaymentMethod;
  isRecurringPayment?: boolean;
  recurringExpenseId?: string;
  isGoalContribution?: boolean;
  goalId?: string;
  isInvestmentContribution?: boolean;
  investmentId?: string;
  source?: string;
}

export interface RecurringExpense {
  id: string;
  description: string;
  category: string;
  amount: number;
  dueDay: number;
  paymentMethod?: PaymentMethod;
  isPaid?: boolean;
  paidMonths?: string[];
  createdAt: Date;
  repeatMonths?: number;
  monthlyValues?: Record<string, number>;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  savingLocation?: string;
}

export interface Asset {
  id: string;
  name: string;
  type: string;
  value: number;
  evaluationDate?: Date;
  acquisitionValue?: number;
  acquisitionDate?: Date | null;
  location?: string;
  insured?: boolean;
  notes?: string;
  symbol?: string;
  quantity?: number;
  wallet?: string;
  lastPriceBrl?: number;
  lastUpdated?: Date;
}

export interface Liability {
  id: string;
  name: string;
  value: number;
  type: string;
}

export interface MonthlyFinanceData {
  month: string;
  incomeTotal: number;
  expenseTotal: number;
}

// Categorias favoritas personalizadas
export interface CustomCategories {
  income: string[];
  expense: string[];
}

// Adicionando a interface do contexto financeiro para ser usada nas tipagens
export interface FinanceContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  editTransaction?: (transaction: Transaction) => void;
  
  recurringExpenses: RecurringExpense[];
  addRecurringExpense: (expense: Omit<RecurringExpense, 'id' | 'createdAt' | 'isPaid' | 'paidMonths'>) => void;
  deleteRecurringExpense: (id: string) => void;
  editRecurringExpense: (expense: RecurringExpense) => void;
  
  goals: Goal[];
  addGoal: (goal: Omit<Goal, 'id' | 'currentAmount'>) => void;
  deleteGoal: (id: string) => void;
  editGoal: (goal: Goal) => void;
  
  assets: Asset[];
  addAsset: (asset: Omit<Asset, 'id'>) => void;
  deleteAsset: (id: string) => void;
  editAsset: (asset: Asset) => void;
  
  liabilities: Liability[];
  addLiability: (liability: Omit<Liability, 'id'>) => void;
  deleteLiability: (id: string) => void;
  editLiability: (liability: Liability) => void;
  
  currentMonth: string;
  setCurrentMonth: (month: string) => void;
  
  customCategories: CustomCategories;
  addCustomCategory: (type: TransactionType, category: string) => void;
  
  monthlyData?: MonthlyFinanceData[];
  getMonthTotals?: () => { income: number; expense: number; balance: number; savingRate: number };
  markRecurringExpenseAsPaid?: (id: string, month: string, paid: boolean) => void;
  isRecurringExpensePaid?: (id: string, month: string) => boolean;
  getMonthlyExpenseValue?: (expenseId: string, month: string) => number | null;
  setMonthlyExpenseValue?: (expenseId: string, month: string, value: number | null) => void;
}

// Interface for BusinessContextType - making sure it also has customCategories and addCustomCategory
export interface BusinessContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  editTransaction: (transaction: Transaction) => void;
  
  recurringExpenses: RecurringExpense[];
  addRecurringExpense: (expense: Omit<RecurringExpense, 'id' | 'createdAt' | 'isPaid' | 'paidMonths'>) => void;
  deleteRecurringExpense: (id: string) => void;
  editRecurringExpense: (expense: RecurringExpense) => void;
  
  goals: Goal[];
  addGoal: (goal: Omit<Goal, 'id' | 'currentAmount'>) => void;
  deleteGoal: (id: string) => void;
  editGoal: (goal: Goal) => void;
  
  assets: Asset[];
  addAsset: (asset: Omit<Asset, 'id'>) => void;
  deleteAsset: (id: string) => void;
  editAsset: (asset: Asset) => void;
  
  liabilities: Liability[];
  addLiability: (liability: Omit<Liability, 'id'>) => void;
  deleteLiability: (id: string) => void;
  editLiability: (liability: Liability) => void;
  
  currentMonth: string;
  setCurrentMonth: (month: string) => void;
  
  customCategories: CustomCategories;
  addCustomCategory: (type: TransactionType, category: string) => void;
  
  monthlyData?: MonthlyFinanceData[];
  getMonthTotals?: () => { income: number; expense: number; balance: number; savingRate: number };
  markRecurringExpenseAsPaid?: (id: string, month: string, paid: boolean) => void;
  isRecurringExpensePaid?: (id: string, month: string) => boolean;
  getMonthlyExpenseValue?: (expenseId: string, month: string) => number | null;
  setMonthlyExpenseValue?: (expenseId: string, month: string, value: number | null) => void;
}

// Categorias para receitas e despesas
export const INCOME_CATEGORIES = [
  'Salário',
  'Freelance',
  'Investimentos',
  'Presente',
  'Reembolso',
  'Outros'
];

export const EXPENSE_CATEGORIES = [
  'Alimentação',
  'Moradia',
  'Transporte',
  'Saúde',
  'Educação',
  'Lazer',
  'Vestuário',
  'Serviços',
  'Impostos',
  'Poupança para Metas',
  'Investimentos',
  'Outros'
];

export const PAYMENT_METHODS: Record<PaymentMethod, string> = {
  cash: 'Dinheiro',
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  bank_transfer: 'Transferência Bancária',
  pix: 'PIX',
  other: 'Outro'
};
