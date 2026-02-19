import { supabase } from '@/integrations/supabase/client';
import { Transaction, RecurringExpense, Goal, Asset, Liability, MonthlyFinanceData, CustomCategories, PaymentMethod } from '@/types/finance';
import { parseDateFromDB, formatDateToDB, centsFromUnknownDbValue } from '@/utils/formatters';

// Helper: converte centavos para string decimal para persistência no banco
function centsToDbDecimal(cents: number): string {
  return (cents / 100).toFixed(2);
}

/**
 * Resolve centavos preferindo a coluna _cents (BIGINT) quando disponível e > 0,
 * com fallback para ROUND(legacyDecimal * 100).
 */
function resolveDbCents(centsCol: unknown, legacyCol: unknown): number {
  const fromCents = typeof centsCol === 'number' && centsCol > 0 ? centsCol : 0;
  if (fromCents > 0) return fromCents;
  return centsFromUnknownDbValue(legacyCol);
}

// Padrao de retorno
export type ServiceResult<T> = { data: T; error: null } | { data: null; error: string };

// ==================== FORMATTERS ====================

const formatTransaction = (t: any): Transaction => {
  const amountCents = resolveDbCents(t.amount_cents, t.amount);
  return {
    id: t.id,
    date: parseDateFromDB(t.date),
    description: t.description,
    category: t.category,
    amount: amountCents / 100,
    amountCents,
    type: t.type as 'income' | 'expense',
    paymentMethod: t.payment_method as PaymentMethod,
    source: t.source,
    isRecurringPayment: t.is_recurring_payment || false,
    isGoalContribution: t.is_goal_contribution || false,
    isInvestmentContribution: t.is_investment_contribution || false,
    goalId: t.goal_id,
    investmentId: t.investment_id,
    recurringExpenseId: t.recurring_expense_id
  };
};

const formatRecurringExpense = (e: any): RecurringExpense => {
  const amountCents = resolveDbCents(e.amount_cents, e.amount);
  const rawMonthlyValues = (e.monthly_values as Record<string, number>) || {};
  const monthlyValuesCents: Record<string, number> = {};
  for (const [k, v] of Object.entries(rawMonthlyValues)) {
    monthlyValuesCents[k] = centsFromUnknownDbValue(v);
  }
  return {
    id: e.id,
    description: e.description,
    category: e.category,
    amount: amountCents / 100,
    amountCents,
    dueDay: e.due_day,
    paymentMethod: e.payment_method as PaymentMethod,
    repeatMonths: e.repeat_months,
    monthlyValues: rawMonthlyValues,
    monthlyValuesCents,
    isPaid: e.is_paid || false,
    paidMonths: (e.paid_months as string[]) || [],
    createdAt: new Date(e.created_at || new Date())
  };
};

const formatGoal = (g: any): Goal => {
  const targetAmountCents = resolveDbCents(g.target_amount_cents, g.target_amount);
  const currentAmountCents = resolveDbCents(g.current_amount_cents, g.current_amount);
  return {
    id: g.id,
    name: g.name,
    targetAmount: targetAmountCents / 100,
    targetAmountCents,
    currentAmount: currentAmountCents / 100,
    currentAmountCents,
    targetDate: parseDateFromDB(g.target_date),
    savingLocation: g.saving_location
  };
};

const formatAsset = (a: any): Asset => {
  const valueCents = resolveDbCents(a.value_cents, a.value);
  const acquisitionValueCents = a.acquisition_value != null
    ? resolveDbCents(a.acquisition_value_cents, a.acquisition_value)
    : undefined;
  const lastPriceBrlCents = a.last_price_brl != null
    ? resolveDbCents(a.last_price_brl_cents, a.last_price_brl)
    : undefined;
  return {
    id: a.id,
    name: a.name,
    type: a.type,
    value: valueCents / 100,
    valueCents,
    evaluationDate: a.evaluation_date ? parseDateFromDB(a.evaluation_date) : undefined,
    acquisitionValue: acquisitionValueCents !== undefined ? acquisitionValueCents / 100 : undefined,
    acquisitionValueCents,
    acquisitionDate: a.acquisition_date ? parseDateFromDB(a.acquisition_date) : null,
    insured: a.insured || false,
    wallet: a.wallet,
    symbol: a.symbol,
    notes: a.notes,
    location: a.location,
    lastUpdated: a.last_updated ? parseDateFromDB(a.last_updated) : undefined,
    lastPriceBrl: lastPriceBrlCents !== undefined ? lastPriceBrlCents / 100 : undefined,
    lastPriceBrlCents,
    quantity: a.quantity ? Number(a.quantity) : undefined
  };
};

const formatLiability = (l: any): Liability => {
  const valueCents = resolveDbCents(l.value_cents, l.value);
  return {
    id: l.id,
    name: l.name,
    type: l.type,
    value: valueCents / 100,
    valueCents
  };
};

const formatMonthlyData = (m: any): MonthlyFinanceData => {
  const incomeTotalCents = resolveDbCents(m.income_total_cents, m.income_total);
  const expenseTotalCents = resolveDbCents(m.expense_total_cents, m.expense_total);
  return {
    month: m.month,
    incomeTotal: incomeTotalCents / 100,
    incomeTotalCents,
    expenseTotal: expenseTotalCents / 100,
    expenseTotalCents
  };
};

const formatCustomCategories = (data: any[]): CustomCategories => {
  const cats: CustomCategories = { income: [], expense: [] };
  data.forEach(cat => {
    if (cat.type === 'income' || cat.type === 'expense') {
      cats[cat.type].push(cat.name);
    }
  });
  return cats;
};

// ==================== TRANSACTIONS ====================

export const fetchTransactions = async (userId: string): Promise<ServiceResult<Transaction[]>> => {
  const { data, error } = await supabase.from('transactions').select('*').eq('user_id', userId);
  if (error) return { data: null, error: error.message };
  return { data: data.map(formatTransaction), error: null };
};

export const insertTransaction = async (userId: string, transaction: Omit<Transaction, 'id'>): Promise<ServiceResult<Transaction>> => {
  const amountCents = transaction.amountCents ?? centsFromUnknownDbValue(transaction.amount);
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      date: formatDateToDB(transaction.date),
      description: transaction.description,
      category: transaction.category,
      amount: Number(centsToDbDecimal(amountCents)),
      amount_cents: amountCents,
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

  if (error) return { data: null, error: error.message };
  return { data: formatTransaction(data), error: null };
};

export const updateTransaction = async (transaction: Transaction): Promise<ServiceResult<void>> => {
  const amountCents = transaction.amountCents ?? centsFromUnknownDbValue(transaction.amount);
  const { error } = await supabase
    .from('transactions')
    .update({
      date: formatDateToDB(transaction.date),
      description: transaction.description,
      category: transaction.category,
      amount: Number(centsToDbDecimal(amountCents)),
      amount_cents: amountCents,
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

  if (error) return { data: null, error: error.message };
  return { data: undefined, error: null };
};

export const removeTransaction = async (id: string): Promise<ServiceResult<void>> => {
  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) return { data: null, error: error.message };
  return { data: undefined, error: null };
};

export const deleteTransactionsByRecurringId = async (recurringExpenseId: string): Promise<ServiceResult<void>> => {
  const { error } = await supabase.from('transactions').delete().eq('recurring_expense_id', recurringExpenseId);
  if (error) return { data: null, error: error.message };
  return { data: undefined, error: null };
};

export const checkExistingRecurringTransaction = async (
  userId: string, recurringId: string, monthStart: string, monthEnd: string
): Promise<ServiceResult<boolean>> => {
  const { data, error } = await supabase
    .from('transactions')
    .select('id')
    .eq('user_id', userId)
    .eq('recurring_expense_id', recurringId)
    .gte('date', monthStart)
    .lt('date', monthEnd)
    .limit(1);

  if (error) return { data: null, error: error.message };
  return { data: (data && data.length > 0), error: null };
};

// ==================== RECURRING EXPENSES ====================

export const fetchRecurringExpenses = async (userId: string): Promise<ServiceResult<RecurringExpense[]>> => {
  const { data, error } = await supabase.from('recurring_expenses').select('*').eq('user_id', userId);
  if (error) return { data: null, error: error.message };
  return { data: data.map(formatRecurringExpense), error: null };
};

export const insertRecurringExpense = async (
  userId: string, expense: Omit<RecurringExpense, 'id' | 'isPaid' | 'paidMonths' | 'createdAt'>
): Promise<ServiceResult<RecurringExpense>> => {
  const amountCents = expense.amountCents ?? centsFromUnknownDbValue(expense.amount);
  const { data, error } = await supabase
    .from('recurring_expenses')
    .insert({
      user_id: userId,
      description: expense.description,
      category: expense.category,
      amount: Number(centsToDbDecimal(amountCents)),
      amount_cents: amountCents,
      due_day: expense.dueDay,
      payment_method: expense.paymentMethod,
      repeat_months: expense.repeatMonths || 12,
      monthly_values: {},
      is_paid: false,
      paid_months: []
    })
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data: formatRecurringExpense(data), error: null };
};

export const updateRecurringExpense = async (expense: RecurringExpense): Promise<ServiceResult<void>> => {
  const amountCents = expense.amountCents ?? centsFromUnknownDbValue(expense.amount);
  const { error } = await supabase
    .from('recurring_expenses')
    .update({
      description: expense.description,
      category: expense.category,
      amount: Number(centsToDbDecimal(amountCents)),
      amount_cents: amountCents,
      due_day: expense.dueDay,
      payment_method: expense.paymentMethod,
      repeat_months: expense.repeatMonths,
      monthly_values: expense.monthlyValues,
    })
    .eq('id', expense.id);

  if (error) return { data: null, error: error.message };
  return { data: undefined, error: null };
};

export const removeRecurringExpense = async (id: string): Promise<ServiceResult<void>> => {
  const { error } = await supabase.from('recurring_expenses').delete().eq('id', id);
  if (error) return { data: null, error: error.message };
  return { data: undefined, error: null };
};

export const updatePaidMonths = async (id: string, paidMonths: string[]): Promise<ServiceResult<void>> => {
  const { error } = await supabase
    .from('recurring_expenses')
    .update({ paid_months: paidMonths })
    .eq('id', id);

  if (error) return { data: null, error: error.message };
  return { data: undefined, error: null };
};

export const updateMonthlyValues = async (id: string, monthlyValues: Record<string, number>): Promise<ServiceResult<void>> => {
  const { error } = await supabase
    .from('recurring_expenses')
    .update({ monthly_values: monthlyValues })
    .eq('id', id);

  if (error) return { data: null, error: error.message };
  return { data: undefined, error: null };
};

// ==================== GOALS ====================

export const fetchGoals = async (userId: string): Promise<ServiceResult<Goal[]>> => {
  const { data, error } = await supabase.from('goals').select('*').eq('user_id', userId);
  if (error) return { data: null, error: error.message };
  return { data: data.map(formatGoal), error: null };
};

export const insertGoal = async (userId: string, goal: Omit<Goal, 'id'>): Promise<ServiceResult<Goal>> => {
  const targetCents = goal.targetAmountCents ?? centsFromUnknownDbValue(goal.targetAmount);
  const currentCents = goal.currentAmountCents ?? centsFromUnknownDbValue(goal.currentAmount || 0);
  const { data, error } = await supabase
    .from('goals')
    .insert({
      user_id: userId,
      name: goal.name,
      target_amount: Number(centsToDbDecimal(targetCents)),
      target_amount_cents: targetCents,
      current_amount: Number(centsToDbDecimal(currentCents)),
      current_amount_cents: currentCents,
      target_date: formatDateToDB(goal.targetDate),
      saving_location: goal.savingLocation
    })
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data: formatGoal(data), error: null };
};

export const updateGoalDB = async (goal: Goal): Promise<ServiceResult<void>> => {
  const targetCents = goal.targetAmountCents ?? centsFromUnknownDbValue(goal.targetAmount);
  const currentCents = goal.currentAmountCents ?? centsFromUnknownDbValue(goal.currentAmount);
  const { error } = await supabase
    .from('goals')
    .update({
      name: goal.name,
      target_amount: Number(centsToDbDecimal(targetCents)),
      target_amount_cents: targetCents,
      current_amount: Number(centsToDbDecimal(currentCents)),
      current_amount_cents: currentCents,
      target_date: formatDateToDB(goal.targetDate),
      saving_location: goal.savingLocation
    })
    .eq('id', goal.id);

  if (error) return { data: null, error: error.message };
  return { data: undefined, error: null };
};

export const removeGoal = async (id: string, userId: string): Promise<ServiceResult<void>> => {
  const { error } = await supabase.from('goals').delete().eq('id', id).eq('user_id', userId);
  if (error) return { data: null, error: error.message };
  return { data: undefined, error: null };
};

// ==================== ASSETS ====================

export const fetchAssets = async (userId: string): Promise<ServiceResult<Asset[]>> => {
  const { data, error } = await supabase.from('assets').select('*').eq('user_id', userId);
  if (error) return { data: null, error: error.message };
  return { data: data.map(formatAsset), error: null };
};

export const insertAsset = async (userId: string, asset: Omit<Asset, 'id'>): Promise<ServiceResult<Asset>> => {
  const vCents = asset.valueCents ?? centsFromUnknownDbValue(asset.value);
  const avCents = asset.acquisitionValueCents ?? (asset.acquisitionValue != null ? centsFromUnknownDbValue(asset.acquisitionValue) : 0);
  const lpCents = asset.lastPriceBrlCents ?? (asset.lastPriceBrl != null ? centsFromUnknownDbValue(asset.lastPriceBrl) : 0);
  const { data, error } = await supabase
    .from('assets')
    .insert({
      user_id: userId,
      name: asset.name,
      type: asset.type,
      value: Number(centsToDbDecimal(vCents)),
      value_cents: vCents,
      evaluation_date: asset.evaluationDate ? formatDateToDB(asset.evaluationDate) : null,
      acquisition_value: avCents > 0 ? Number(centsToDbDecimal(avCents)) : asset.acquisitionValue ?? null,
      acquisition_value_cents: avCents,
      acquisition_date: asset.acquisitionDate ? formatDateToDB(asset.acquisitionDate) : null,
      insured: asset.insured || false,
      wallet: asset.wallet,
      symbol: asset.symbol,
      notes: asset.notes,
      location: asset.location,
      last_price_brl: lpCents > 0 ? Number(centsToDbDecimal(lpCents)) : asset.lastPriceBrl ?? null,
      last_price_brl_cents: lpCents,
      quantity: asset.quantity
    })
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data: formatAsset(data), error: null };
};

export const updateAssetDB = async (asset: Asset): Promise<ServiceResult<void>> => {
  const vCents = asset.valueCents ?? centsFromUnknownDbValue(asset.value);
  const avCents = asset.acquisitionValueCents ?? (asset.acquisitionValue != null ? centsFromUnknownDbValue(asset.acquisitionValue) : 0);
  const lpCents = asset.lastPriceBrlCents ?? (asset.lastPriceBrl != null ? centsFromUnknownDbValue(asset.lastPriceBrl) : 0);
  const { error } = await supabase
    .from('assets')
    .update({
      name: asset.name,
      type: asset.type,
      value: Number(centsToDbDecimal(vCents)),
      value_cents: vCents,
      evaluation_date: asset.evaluationDate ? formatDateToDB(asset.evaluationDate) : null,
      acquisition_value: avCents > 0 ? Number(centsToDbDecimal(avCents)) : asset.acquisitionValue ?? null,
      acquisition_value_cents: avCents,
      acquisition_date: asset.acquisitionDate ? formatDateToDB(asset.acquisitionDate) : null,
      insured: asset.insured,
      wallet: asset.wallet,
      symbol: asset.symbol,
      notes: asset.notes,
      location: asset.location,
      last_price_brl: lpCents > 0 ? Number(centsToDbDecimal(lpCents)) : asset.lastPriceBrl ?? null,
      last_price_brl_cents: lpCents,
      quantity: asset.quantity,
      last_updated: new Date().toISOString()
    })
    .eq('id', asset.id);

  if (error) return { data: null, error: error.message };
  return { data: undefined, error: null };
};

export const removeAsset = async (id: string): Promise<ServiceResult<void>> => {
  const { error } = await supabase.from('assets').delete().eq('id', id);
  if (error) return { data: null, error: error.message };
  return { data: undefined, error: null };
};

// ==================== LIABILITIES ====================

export const fetchLiabilities = async (userId: string): Promise<ServiceResult<Liability[]>> => {
  const { data, error } = await supabase.from('liabilities').select('*').eq('user_id', userId);
  if (error) return { data: null, error: error.message };
  return { data: data.map(formatLiability), error: null };
};

export const insertLiability = async (userId: string, liability: Omit<Liability, 'id'>): Promise<ServiceResult<Liability>> => {
  const vCents = liability.valueCents ?? centsFromUnknownDbValue(liability.value);
  const { data, error } = await supabase
    .from('liabilities')
    .insert({
      user_id: userId,
      name: liability.name,
      type: liability.type,
      value: Number(centsToDbDecimal(vCents)),
      value_cents: vCents
    })
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data: formatLiability(data), error: null };
};

export const updateLiabilityDB = async (liability: Liability): Promise<ServiceResult<void>> => {
  const vCents = liability.valueCents ?? centsFromUnknownDbValue(liability.value);
  const { error } = await supabase
    .from('liabilities')
    .update({
      name: liability.name,
      type: liability.type,
      value: Number(centsToDbDecimal(vCents)),
      value_cents: vCents
    })
    .eq('id', liability.id);

  if (error) return { data: null, error: error.message };
  return { data: undefined, error: null };
};

export const removeLiability = async (id: string): Promise<ServiceResult<void>> => {
  const { error } = await supabase.from('liabilities').delete().eq('id', id);
  if (error) return { data: null, error: error.message };
  return { data: undefined, error: null };
};

// ==================== CUSTOM CATEGORIES ====================

export const fetchCustomCategories = async (userId: string): Promise<ServiceResult<CustomCategories>> => {
  const { data, error } = await supabase.from('custom_categories').select('*').eq('user_id', userId);
  if (error) return { data: null, error: error.message };
  return { data: formatCustomCategories(data), error: null };
};

export const insertCustomCategory = async (userId: string, type: string, name: string): Promise<ServiceResult<void>> => {
  const { error } = await supabase
    .from('custom_categories')
    .insert({ user_id: userId, type, name });

  if (error) return { data: null, error: error.message };
  return { data: undefined, error: null };
};

export const updateCustomCategoryName = async (userId: string, oldName: string, newName: string): Promise<ServiceResult<void>> => {
  const { error } = await supabase
    .from('custom_categories')
    .update({ name: newName })
    .eq('user_id', userId)
    .eq('name', oldName);

  if (error) return { data: null, error: error.message };
  return { data: undefined, error: null };
};

export const removeCustomCategory = async (userId: string, categoryName: string): Promise<ServiceResult<void>> => {
  const { error } = await supabase
    .from('custom_categories')
    .delete()
    .eq('user_id', userId)
    .eq('name', categoryName);

  if (error) return { data: null, error: error.message };
  return { data: undefined, error: null };
};

export const checkCategoryInUse = async (userId: string, categoryName: string): Promise<ServiceResult<boolean>> => {
  const [transResult, recurringResult] = await Promise.all([
    supabase.from('transactions').select('id').eq('user_id', userId).eq('category', categoryName).limit(1),
    supabase.from('recurring_expenses').select('id').eq('user_id', userId).eq('category', categoryName).limit(1)
  ]);

  if (transResult.error) return { data: null, error: transResult.error.message };
  if (recurringResult.error) return { data: null, error: recurringResult.error.message };

  const inUse = (transResult.data && transResult.data.length > 0) || 
                (recurringResult.data && recurringResult.data.length > 0);
  return { data: inUse, error: null };
};

export const updateCategoryInTransactions = async (userId: string, oldName: string, newName: string): Promise<ServiceResult<void>> => {
  const { error } = await supabase
    .from('transactions')
    .update({ category: newName })
    .eq('user_id', userId)
    .eq('category', oldName);

  if (error) return { data: null, error: error.message };
  return { data: undefined, error: null };
};

export const updateCategoryInRecurring = async (userId: string, oldName: string, newName: string): Promise<ServiceResult<void>> => {
  const { error } = await supabase
    .from('recurring_expenses')
    .update({ category: newName })
    .eq('user_id', userId)
    .eq('category', oldName);

  if (error) return { data: null, error: error.message };
  return { data: undefined, error: null };
};

// ==================== MONTHLY DATA ====================

export const fetchMonthlyData = async (userId: string): Promise<ServiceResult<MonthlyFinanceData[]>> => {
  const { data, error } = await supabase.from('monthly_finance_data').select('*').eq('user_id', userId);
  if (error) return { data: null, error: error.message };
  return { data: data.map(formatMonthlyData), error: null };
};

export const upsertMonthlyData = async (
  userId: string, month: string, incomeTotal: number, expenseTotal: number
): Promise<ServiceResult<void>> => {
  const incomeCents = centsFromUnknownDbValue(incomeTotal);
  const expenseCents = centsFromUnknownDbValue(expenseTotal);
  const { error } = await supabase
    .from('monthly_finance_data')
    .upsert({ 
      user_id: userId, 
      month, 
      income_total: incomeTotal, 
      income_total_cents: incomeCents,
      expense_total: expenseTotal,
      expense_total_cents: expenseCents
    }, { onConflict: 'user_id, month' });

  if (error) return { data: null, error: error.message };
  return { data: undefined, error: null };
};

// ==================== HEALTH ====================

export const calculateHealthSnapshot = async (): Promise<ServiceResult<void>> => {
  const { error } = await supabase.functions.invoke('calculate-health', {
    body: { mode: 'single_user' }
  });

  if (error) return { data: null, error: error.message };
  return { data: undefined, error: null };
};

// ==================== BATCH LOAD ====================

export const loadEssentialData = async (userId: string) => {
  const [transactions, recurring, categories, monthly] = await Promise.all([
    fetchTransactions(userId),
    fetchRecurringExpenses(userId),
    fetchCustomCategories(userId),
    fetchMonthlyData(userId)
  ]);
  return { transactions, recurring, categories, monthly };
};

export const loadSecondaryData = async (userId: string) => {
  const [goals, assets, liabilities] = await Promise.all([
    fetchGoals(userId),
    fetchAssets(userId),
    fetchLiabilities(userId)
  ]);
  return { goals, assets, liabilities };
};
