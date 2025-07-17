import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useFinance } from '@/contexts/FinanceContext';
import { useBusiness } from '@/contexts/BusinessContext';
import { useAppMode } from '@/contexts/AppModeContext';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES, PAYMENT_METHODS, PaymentMethod, TransactionType, Goal, FinanceContextType, BusinessContextType } from '@/types/finance';
import { formatDateForInput, formatCurrency, formatNumberToCurrency, parseCurrencyToNumber } from '@/utils/formatters';
import { toast } from '@/components/ui/use-toast';
import { Info, Target, TrendingUp, Calendar } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import TooltipHelper from '@/components/TooltipHelper';
import { tooltipContent } from '@/data/tooltipContent';
interface AddTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  open,
  onOpenChange
}) => {
  const {
    mode
  } = useAppMode();
  const financeContext = mode === 'personal' ? useFinance() : useBusiness();
  const {
    addTransaction,
    addRecurringExpense,
    goals,
    customCategories,
    addCustomCategory
  } = financeContext as FinanceContextType | BusinessContextType; // Cast to union type

  // Common state
  const [transactionType, setTransactionType] = useState<TransactionType>('income');
  const [selectedTab, setSelectedTab] = useState<'regular' | 'recurring' | 'goal' | 'investment'>('regular');

  // Regular transaction state
  const [date, setDate] = useState<string>(formatDateForInput(new Date()));
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [formattedAmount, setFormattedAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');

  // Recurring expense state
  const [recDescription, setRecDescription] = useState('');
  const [recCategory, setRecCategory] = useState('');
  const [recCustomCategory, setRecCustomCategory] = useState('');
  const [recAmount, setRecAmount] = useState('');
  const [formattedRecAmount, setFormattedRecAmount] = useState('');
  const [recDueDay, setRecDueDay] = useState('');
  const [recPaymentMethod, setRecPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [recRepeatMonths, setRecRepeatMonths] = useState('12'); // Padrão: 12 meses (1 ano)

  // Goal contribution state
  const [selectedGoal, setSelectedGoal] = useState<string>('');
  const [goalAmount, setGoalAmount] = useState('');
  const [formattedGoalAmount, setFormattedGoalAmount] = useState('');
  const [goalPaymentMethod, setGoalPaymentMethod] = useState<PaymentMethod>('bank_transfer');

  // Investment contribution state
  const [selectedInvestment, setSelectedInvestment] = useState<string>('');
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [formattedInvestmentAmount, setFormattedInvestmentAmount] = useState('');
  const [investmentPaymentMethod, setInvestmentPaymentMethod] = useState<PaymentMethod>('bank_transfer');

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  // Mock investments data (should be replaced with actual data from context)
  const mockInvestments = [{
    id: '1',
    name: 'Expansão da Fábrica',
    value: 150000,
    roi: 12.5,
    progress: 75
  }, {
    id: '2',
    name: 'Novos Equipamentos',
    value: 80000,
    roi: 15.3,
    progress: 100
  }, {
    id: '3',
    name: 'Desenvolvimento de Software',
    value: 60000,
    roi: 18.7,
    progress: 40
  }];

  // Get current categories list based on transaction type
  const getCurrentCategories = () => {
    const defaultCategories = transactionType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    const userCustomCategories = customCategories?.[transactionType] || [];

    // Combine custom categories with default ones, but exclude "Outros" which will be at the end
    const filteredDefaultCategories = defaultCategories.filter(cat => cat !== 'Outros');

    // Return custom categories first, then default categories, and "Outros" at the end
    return [...userCustomCategories, ...filteredDefaultCategories, 'Outros'];
  };

  // Get current recurring expense categories
  const getRecurringCategories = () => {
    const defaultCategories = EXPENSE_CATEGORIES;
    const userCustomCategories = customCategories?.expense || [];

    // Combine custom categories with default ones, but exclude "Outros" which will be at the end
    const filteredDefaultCategories = defaultCategories.filter(cat => cat !== 'Outros');

    // Return custom categories first, then default categories, and "Outros" at the end
    return [...userCustomCategories, ...filteredDefaultCategories, 'Outros'];
  };
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'regular' | 'recurring' | 'goal' | 'investment') => {
    // Remove all non-numeric characters
    const numericValue = e.target.value.replace(/\D/g, '');
    const floatValue = numericValue ? parseFloat(numericValue) / 100 : 0;

    // Update the appropriate state based on the type
    switch (type) {
      case 'regular':
        setAmount(floatValue.toString());
        setFormattedAmount(formatNumberToCurrency(floatValue));
        break;
      case 'recurring':
        setRecAmount(floatValue.toString());
        setFormattedRecAmount(formatNumberToCurrency(floatValue));
        break;
      case 'goal':
        setGoalAmount(floatValue.toString());
        setFormattedGoalAmount(formatNumberToCurrency(floatValue));
        break;
      case 'investment':
        setInvestmentAmount(floatValue.toString());
        setFormattedInvestmentAmount(formatNumberToCurrency(floatValue));
        break;
    }
  };
  const handleSubmitRegular = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !category || !amount || !date) {
      return;
    }

    // If it's a custom category (under "Outros"), add it to favorites
    if (category === 'Outros' && customCategory.trim()) {
      const finalCustomCategory = customCategory.trim();

      // Save the custom category and add it to favorites
      if (addCustomCategory) {
        addCustomCategory(transactionType, finalCustomCategory);
      }

      // Use the custom category as the transaction category
      const finalCategory = `Outros: ${finalCustomCategory}`;
      addTransaction({
        date: new Date(date),
        description,
        category: finalCategory,
        amount: parseFloat(amount),
        type: transactionType,
        paymentMethod
      });
    } else {
      // Regular category
      addTransaction({
        date: new Date(date),
        description,
        category,
        amount: parseFloat(amount),
        type: transactionType,
        paymentMethod
      });
    }
    toast({
      title: 'Transação adicionada',
      description: 'A transação foi adicionada com sucesso!'
    });
    resetForm();
    onOpenChange(false);
  };
  const handleSubmitRecurring = (e: React.FormEvent) => {
    e.preventDefault();

    // Allow blank amount for recurring expenses, but still require description, category and dueDay
    if (!recDescription || !recCategory || !recDueDay || parseInt(recDueDay) < 1 || parseInt(recDueDay) > 31) {
      toast({
        title: 'Campos inválidos',
        description: 'Preencha os campos obrigatórios corretamente. O dia de vencimento deve estar entre 1 e 31.',
        variant: 'destructive'
      });
      return;
    }

    // If it's a custom category (under "Outros"), add it to favorites
    if (recCategory === 'Outros' && recCustomCategory.trim()) {
      const finalCustomCategory = recCustomCategory.trim();

      // Save the custom category and add it to favorites
      if (addCustomCategory) {
        addCustomCategory('expense', finalCustomCategory);
      }

      // Use the custom category as the recurring expense category
      const finalCategory = `Outros: ${finalCustomCategory}`;
      addRecurringExpense({
        description: recDescription,
        category: finalCategory,
        // Convert blank amount to 0
        amount: recAmount ? parseFloat(recAmount) : 0,
        dueDay: parseInt(recDueDay),
        paymentMethod: recPaymentMethod,
        repeatMonths: parseInt(recRepeatMonths)
      });
    } else {
      // Regular category
      addRecurringExpense({
        description: recDescription,
        category: recCategory,
        // Convert blank amount to 0
        amount: recAmount ? parseFloat(recAmount) : 0,
        dueDay: parseInt(recDueDay),
        paymentMethod: recPaymentMethod,
        repeatMonths: parseInt(recRepeatMonths)
      });
    }
    toast({
      title: 'Despesa fixa adicionada',
      description: 'A despesa fixa foi adicionada com sucesso!'
    });
    resetForm();
    onOpenChange(false);
  };
  const handleSubmitGoalContribution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal || !goalAmount) {
      toast({
        title: 'Campos inválidos',
        description: 'Por favor, selecione uma meta e informe o valor da contribuição.',
        variant: 'destructive'
      });
      return;
    }
    const selectedGoalObj = goals.find(g => g.id === selectedGoal);
    if (!selectedGoalObj) return;

    // Create expense transaction for goal contribution
    addTransaction({
      date: new Date(),
      description: `Contribuição para meta: ${selectedGoalObj.name}`,
      category: 'Poupança para Metas',
      amount: parseFloat(goalAmount),
      type: 'expense',
      paymentMethod: goalPaymentMethod,
      isGoalContribution: true,
      goalId: selectedGoal
    });

    // Update goal progress (this should trigger goal update in the context)
    financeContext.editGoal({
      ...selectedGoalObj,
      currentAmount: selectedGoalObj.currentAmount + parseFloat(goalAmount)
    });
    toast({
      title: 'Contribuição adicionada',
      description: `Você contribuiu ${formatCurrency(parseFloat(goalAmount))} para a meta "${selectedGoalObj.name}"`
    });
    resetForm();
    onOpenChange(false);
  };
  const handleSubmitInvestmentContribution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvestment || !investmentAmount) {
      toast({
        title: 'Campos inválidos',
        description: 'Por favor, selecione um investimento e informe o valor da contribuição.',
        variant: 'destructive'
      });
      return;
    }
    const selectedInvestmentObj = mockInvestments.find(inv => inv.id === selectedInvestment);
    if (!selectedInvestmentObj) return;

    // Create expense transaction for investment contribution
    addTransaction({
      date: new Date(),
      description: `Investimento em: ${selectedInvestmentObj.name}`,
      category: 'Investimentos',
      amount: parseFloat(investmentAmount),
      type: 'expense',
      paymentMethod: investmentPaymentMethod,
      isInvestmentContribution: true,
      investmentId: selectedInvestment
    });

    // In a real implementation, we would update the investment progress here

    toast({
      title: 'Investimento realizado',
      description: `Você investiu ${formatCurrency(parseFloat(investmentAmount))} em "${selectedInvestmentObj.name}"`
    });
    resetForm();
    onOpenChange(false);
  };
  const resetForm = () => {
    // Reset regular transaction fields
    setTransactionType('income');
    setSelectedTab('regular');
    setDate(formatDateForInput(new Date()));
    setDescription('');
    setCategory('');
    setCustomCategory('');
    setAmount('');
    setFormattedAmount('');
    setPaymentMethod('bank_transfer');

    // Reset recurring expense fields
    setRecDescription('');
    setRecCategory('');
    setRecCustomCategory('');
    setRecAmount('');
    setFormattedRecAmount('');
    setRecDueDay('');
    setRecPaymentMethod('bank_transfer');
    setRecRepeatMonths('12'); // Reset para 12 meses

    // Reset goal contribution fields
    setSelectedGoal('');
    setGoalAmount('');
    setFormattedGoalAmount('');
    setGoalPaymentMethod('bank_transfer');

    // Reset investment contribution fields
    setSelectedInvestment('');
    setInvestmentAmount('');
    setFormattedInvestmentAmount('');
    setInvestmentPaymentMethod('bank_transfer');
  };

  // Generate options for repeat months dropdown
  const generateRepeatOptions = () => {
    const options = [];

    // 1-12 meses
    for (let i = 1; i <= 12; i++) {
      options.push({
        value: i.toString(),
        label: i === 1 ? '1 mês' : `${i} meses`
      });
    }

    // 18, 24, 36, 48, 60 meses (1.5, 2, 3, 4, 5 anos)
    [18, 24, 36, 48, 60, 72, 84, 96, 108, 120].forEach(months => {
      const years = months / 12;
      options.push({
        value: months.toString(),
        label: `${months} meses (${years} ${years === 1 ? 'ano' : 'anos'})`
      });
    });
    return options;
  };

  // Determine categories based on transaction type
  const categories = getCurrentCategories();
  const recurringCategories = getRecurringCategories();
  const showCustomCategory = transactionType === 'expense' && category === 'Outros';
  const showRecurringCustomCategory = recCategory === 'Outros';
  const repeatOptions = generateRepeatOptions();
  return <TooltipProvider>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[520px] max-h-[85vh] overflow-y-auto bg-card border-border shadow-lg">
          <DialogHeader className="border-b border-border pb-4 mb-6">
            <DialogTitle className="text-xl font-semibold text-card-foreground">
              Adicionar Transação
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Preencha os detalhes da transação abaixo.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={selectedTab} onValueChange={value => setSelectedTab(value as 'regular' | 'recurring' | 'goal' | 'investment')} className="w-full">
            <TabsList className="grid grid-cols-4 w-full bg-muted p-1 rounded-lg">
              <TooltipHelper content={tooltipContent.modals.transactionTypes.regular} delayDuration={500}>
                <TabsTrigger value="regular" className="text-xs md:text-sm font-medium data-[state=active]:bg-card data-[state=active]:text-card-foreground data-[state=active]:shadow-sm">
                  Transação
                </TabsTrigger>
              </TooltipHelper>
              <TooltipHelper content={tooltipContent.modals.transactionTypes.recurring} delayDuration={500}>
                <TabsTrigger value="recurring" className="text-xs md:text-sm font-medium data-[state=active]:bg-card data-[state=active]:text-card-foreground data-[state=active]:shadow-sm">
                  Recorrente
                </TabsTrigger>
              </TooltipHelper>
              <TooltipHelper content={tooltipContent.modals.transactionTypes.goal} delayDuration={500}>
                <TabsTrigger value="goal" className="text-xs md:text-sm font-medium data-[state=active]:bg-card data-[state=active]:text-card-foreground data-[state=active]:shadow-sm">
                  Metas
                </TabsTrigger>
              </TooltipHelper>
              <TooltipHelper content={tooltipContent.modals.transactionTypes.investment} delayDuration={500}>
                <TabsTrigger value="investment" className="text-xs md:text-sm font-medium data-[state=active]:bg-card data-[state=active]:text-card-foreground data-[state=active]:shadow-sm">
                  Investir
                </TabsTrigger>
              </TooltipHelper>
            </TabsList>
            
            {/* Transação Regular */}
            <TabsContent value="regular" className="mt-6">
              <form onSubmit={handleSubmitRegular} className="space-y-6 bg-slate-50">
                <Tabs defaultValue="income" value={transactionType} onValueChange={value => setTransactionType(value as TransactionType)} className="w-full">
                  <TabsList className="grid grid-cols-2 w-full bg-muted p-1 rounded-lg">
                    <TabsTrigger value="income" className="font-medium data-[state=active]:bg-card data-[state=active]:text-green-700 data-[state=active]:shadow-sm">
                      Receita
                    </TabsTrigger>
                    <TabsTrigger value="expense" className="font-medium data-[state=active]:bg-card data-[state=active]:text-red-700 data-[state=active]:shadow-sm">
                      Despesa
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                
                <div className="space-y-4">
                  <TooltipHelper content={tooltipContent.modals.fields.date} delayDuration={500}>
                    <div className="space-y-2">
                      <Label htmlFor="date" className="text-sm font-medium text-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        Data
                      </Label>
                      <Input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-background border-border focus:ring-2 focus:ring-primary/20" required />
                    </div>
                  </TooltipHelper>
                  
                  <TooltipHelper content={tooltipContent.modals.fields.description} delayDuration={500}>
                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-sm font-medium text-foreground">
                        Descrição
                      </Label>
                      <Input id="description" value={description} onChange={e => setDescription(e.target.value)} className="bg-background border-border focus:ring-2 focus:ring-primary/20" placeholder="Digite uma descrição para a transação" required />
                    </div>
                  </TooltipHelper>
                  
                  <TooltipHelper content={tooltipContent.modals.fields.category} delayDuration={500}>
                    <div className="space-y-2">
                      <Label htmlFor="category" className="text-sm font-medium text-foreground">
                        Categoria
                      </Label>
                      <Select value={category} onValueChange={setCategory} required>
                        <SelectTrigger className="bg-background border-border focus:ring-2 focus:ring-primary/20">
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border shadow-lg">
                          <SelectGroup>
                            {categories.map(cat => <SelectItem key={cat} value={cat} className="hover:bg-muted/50">
                                {cat.startsWith('Outros:') ? cat.substring(7) : cat}
                              </SelectItem>)}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  </TooltipHelper>

                  {showCustomCategory && <TooltipHelper content={tooltipContent.modals.fields.customCategory} delayDuration={500}>
                      <div className="space-y-2">
                        <Label htmlFor="customCategory" className="text-sm font-medium text-foreground">
                          Especificar categoria personalizada
                        </Label>
                        <Input id="customCategory" value={customCategory} onChange={e => setCustomCategory(e.target.value)} placeholder="Digite o nome da categoria" className="bg-background border-border focus:ring-2 focus:ring-primary/20" />
                      </div>
                    </TooltipHelper>}
                  
                  <TooltipHelper content={tooltipContent.modals.fields.amount} delayDuration={500}>
                    <div className="space-y-2">
                      <Label htmlFor="amount" className="text-sm font-medium text-foreground">
                        Valor (R$)
                      </Label>
                      <Input id="amount" value={formattedAmount} onChange={e => handleAmountChange(e, 'regular')} className="bg-background border-border focus:ring-2 focus:ring-primary/20 font-mono text-lg" placeholder="R$ 0,00" required />
                    </div>
                  </TooltipHelper>
                  
                  <TooltipHelper content={tooltipContent.modals.fields.paymentMethod} delayDuration={500}>
                    <div className="space-y-2">
                      <Label htmlFor="paymentMethod" className="text-sm font-medium text-foreground">
                        Forma de Pagamento
                      </Label>
                      <Select value={paymentMethod} onValueChange={value => setPaymentMethod(value as PaymentMethod)}>
                        <SelectTrigger className="bg-background border-border focus:ring-2 focus:ring-primary/20">
                          <SelectValue placeholder="Selecione uma forma de pagamento" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border shadow-lg">
                          <SelectGroup>
                            {Object.entries(PAYMENT_METHODS).map(([key, value]) => <SelectItem key={key} value={key} className="hover:bg-muted/50">
                                {value}
                              </SelectItem>)}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  </TooltipHelper>
                </div>
                
                <DialogFooter className="border-t pt-4 mt-6">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="hover:bg-muted/50">
                    Cancelar
                  </Button>
                  <TooltipHelper content={tooltipContent.forms.submit} delayDuration={500}>
                    <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium">
                      Salvar Transação
                    </Button>
                  </TooltipHelper>
                </DialogFooter>
              </form>
            </TabsContent>
            
            {/* Despesas Recorrentes */}
            <TabsContent value="recurring">
              <form onSubmit={handleSubmitRecurring}>
                <div className="grid gap-4 py-4">
                  <TooltipHelper content={tooltipContent.modals.fields.description} delayDuration={500}>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="recDescription" className="text-right">
                        Descrição
                      </Label>
                      <Input id="recDescription" value={recDescription} onChange={e => setRecDescription(e.target.value)} className="col-span-3" required />
                    </div>
                  </TooltipHelper>
                  
                  <TooltipHelper content={tooltipContent.modals.fields.category} delayDuration={500}>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="recCategory" className="text-right">
                        Categoria
                      </Label>
                      <Select value={recCategory} onValueChange={setRecCategory} required>
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {recurringCategories.map(cat => <SelectItem key={cat} value={cat}>
                                {cat.startsWith('Outros:') ? cat.substring(7) : cat}
                              </SelectItem>)}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  </TooltipHelper>

                  {showRecurringCustomCategory && <TooltipHelper content={tooltipContent.modals.fields.customCategory} delayDuration={500}>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="recCustomCategory" className="text-right">
                          Especificar
                        </Label>
                        <Input id="recCustomCategory" value={recCustomCategory} onChange={e => setRecCustomCategory(e.target.value)} placeholder="Descreva a categoria personalizada" className="col-span-3" />
                      </div>
                    </TooltipHelper>}
                  
                  <TooltipHelper content={tooltipContent.modals.fields.amount} delayDuration={500}>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="recAmount" className="text-right">
                        Valor (R$)
                      </Label>
                      <Input id="recAmount" value={formattedRecAmount} onChange={e => handleAmountChange(e, 'recurring')} className="col-span-3 font-mono" placeholder="R$ 0,00 (opcional)" />
                    </div>
                  </TooltipHelper>
                  
                  <TooltipHelper content={tooltipContent.modals.fields.dueDay} delayDuration={500}>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="recDueDay" className="text-right">
                        Dia de Vencimento
                      </Label>
                      <Input id="recDueDay" type="number" min="1" max="31" value={recDueDay} onChange={e => setRecDueDay(e.target.value)} className="col-span-3" required />
                    </div>
                  </TooltipHelper>
                  
                  <TooltipHelper content={tooltipContent.modals.fields.repeatPeriod} delayDuration={500}>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="recRepeatMonths" className="text-right flex items-center gap-1">
                        <span>Repetir por</span>
                        <Calendar className="h-4 w-4 text-muted-foreground cursor-help" />
                      </Label>
                      <Select value={recRepeatMonths} onValueChange={setRecRepeatMonths}>
                        <SelectTrigger className="col-span-3">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          <SelectGroup>
                            {repeatOptions.map(option => <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>)}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  </TooltipHelper>
                  
                  <TooltipHelper content={tooltipContent.modals.fields.paymentMethod} delayDuration={500}>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="recPaymentMethod" className="text-right">
                        Forma de Pagamento
                      </Label>
                      <Select value={recPaymentMethod} onValueChange={value => setRecPaymentMethod(value as PaymentMethod)}>
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Selecione uma forma de pagamento" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {Object.entries(PAYMENT_METHODS).map(([key, value]) => <SelectItem key={key} value={key}>
                                {value}
                              </SelectItem>)}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  </TooltipHelper>
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancelar
                  </Button>
                  <TooltipHelper content={tooltipContent.forms.submit} delayDuration={500}>
                    <Button type="submit">Salvar</Button>
                  </TooltipHelper>
                </DialogFooter>
              </form>
            </TabsContent>

            {/* Contribuição para Metas */}
            <TabsContent value="goal">
              <form onSubmit={handleSubmitGoalContribution}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="goal" className="text-right">
                      Meta
                    </Label>
                    <Select value={selectedGoal} onValueChange={setSelectedGoal} required>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Selecione uma meta" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {goals.length === 0 ? <SelectItem value="no-goals" disabled>
                              Nenhuma meta cadastrada
                            </SelectItem> : goals.map(goal => <SelectItem key={goal.id} value={goal.id}>
                                {goal.name} ({formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)})
                              </SelectItem>)}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <TooltipHelper content={tooltipContent.modals.fields.goalContribution} delayDuration={500}>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="goalAmount" className="text-right">
                        Valor (R$)
                      </Label>
                      <Input id="goalAmount" value={formattedGoalAmount} onChange={e => handleAmountChange(e, 'goal')} className="col-span-3 font-mono" placeholder="R$ 0,00" required />
                    </div>
                  </TooltipHelper>
                  
                  <TooltipHelper content={tooltipContent.modals.fields.paymentMethod} delayDuration={500}>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="goalPaymentMethod" className="text-right">
                        Forma de Pagamento
                      </Label>
                      <Select value={goalPaymentMethod} onValueChange={value => setGoalPaymentMethod(value as PaymentMethod)}>
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Selecione uma forma de pagamento" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {Object.entries(PAYMENT_METHODS).map(([key, value]) => <SelectItem key={key} value={key}>
                                {value}
                              </SelectItem>)}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  </TooltipHelper>

                  <div className="bg-muted/30 p-3 rounded-md text-xs text-muted-foreground">
                    <p>Esta contribuição será registrada como uma despesa na categoria "Poupança para Metas" 
                    e o valor será adicionado à meta selecionada.</p>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancelar
                  </Button>
                  <TooltipHelper content={tooltipContent.forms.submit} delayDuration={500}>
                    <Button type="submit">
                      Contribuir para Meta
                    </Button>
                  </TooltipHelper>
                </DialogFooter>
              </form>
            </TabsContent>

            {/* Investimento */}
            <TabsContent value="investment">
              <form onSubmit={handleSubmitInvestmentContribution}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="investment" className="text-right">
                      Investimento
                    </Label>
                    <Select value={selectedInvestment} onValueChange={setSelectedInvestment} required>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Selecione um investimento" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {mockInvestments.length === 0 ? <SelectItem value="no-investments" disabled>
                              Nenhum investimento cadastrado
                            </SelectItem> : mockInvestments.map(inv => <SelectItem key={inv.id} value={inv.id}>
                                {inv.name} ({formatCurrency(inv.value)})
                              </SelectItem>)}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <TooltipHelper content={tooltipContent.modals.fields.investmentContribution} delayDuration={500}>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="investmentAmount" className="text-right">
                        Valor (R$)
                      </Label>
                      <Input id="investmentAmount" value={formattedInvestmentAmount} onChange={e => handleAmountChange(e, 'investment')} className="col-span-3 font-mono" placeholder="R$ 0,00" required />
                    </div>
                  </TooltipHelper>
                  
                  <TooltipHelper content={tooltipContent.modals.fields.paymentMethod} delayDuration={500}>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="investmentPaymentMethod" className="text-right">
                        Forma de Pagamento
                      </Label>
                      <Select value={investmentPaymentMethod} onValueChange={value => setInvestmentPaymentMethod(value as PaymentMethod)}>
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Selecione uma forma de pagamento" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {Object.entries(PAYMENT_METHODS).map(([key, value]) => <SelectItem key={key} value={key}>
                                {value}
                              </SelectItem>)}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  </TooltipHelper>

                  <div className="bg-muted/30 p-3 rounded-md text-xs text-muted-foreground">
                    <p>Este valor será registrado como uma despesa na categoria "Investimentos" 
                    e o valor será adicionado ao investimento selecionado.</p>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancelar
                  </Button>
                  <TooltipHelper content={tooltipContent.forms.submit} delayDuration={500}>
                    <Button type="submit">
                      Realizar Investimento
                    </Button>
                  </TooltipHelper>
                </DialogFooter>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </TooltipProvider>;
};
export default AddTransactionModal;