import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useFinance } from '@/contexts/FinanceContext';
import { useBusiness } from '@/contexts/BusinessContext';
import { useAppMode } from '@/contexts/AppModeContext';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES, PAYMENT_METHODS, PaymentMethod, TransactionType, Goal, FinanceContextType, BusinessContextType, Transaction } from '@/types/finance';
import { formatDateForInput, formatCurrency, formatNumberToCurrency, parseCurrencyToNumber } from '@/utils/formatters';
import { toast } from '@/components/ui/use-toast';
import { Info, Target, TrendingUp, Calendar as CalendarIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import TooltipHelper from '@/components/TooltipHelper';
import { tooltipContent } from '@/data/tooltipContent';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface AddTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Transaction;
  mode?: 'add' | 'edit';
}

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  open,
  onOpenChange,
  initialData,
  mode = 'add'
}) => {
  const {
    mode: appMode
  } = useAppMode();
  const financeContext = appMode === 'personal' ? useFinance() : useBusiness();
  const {
    addTransaction,
    addRecurringExpense,
    goals,
    customCategories,
    addCustomCategory
  } = financeContext as FinanceContextType | BusinessContextType;

  // Common state
  const [transactionType, setTransactionType] = useState<TransactionType>('income');
  const [selectedTab, setSelectedTab] = useState<'regular' | 'recurring' | 'goal' | 'investment'>('regular');

  // Regular transaction state
  const [date, setDate] = useState<Date>(new Date());
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
  const [recRepeatMonths, setRecRepeatMonths] = useState('12');

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

  // Populate form with initial data when editing
  useEffect(() => {
    if (mode === 'edit' && initialData && open) {
      setTransactionType(initialData.type);
      setDate(initialData.date);
      setDescription(initialData.description);
      setCategory(initialData.category);
      setAmount(initialData.amount.toString());
      setFormattedAmount(formatNumberToCurrency(initialData.amount));
      setPaymentMethod(initialData.paymentMethod);
      
      // Handle custom categories
      if (initialData.category.startsWith('Outros: ')) {
        setCategory('Outros');
        setCustomCategory(initialData.category.substring(7));
      }
    }
  }, [mode, initialData, open]);

  // Mock investments data
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
    const filteredDefaultCategories = defaultCategories.filter(cat => cat !== 'Outros');
    return [...userCustomCategories, ...filteredDefaultCategories, 'Outros'];
  };

  // Get current recurring expense categories
  const getRecurringCategories = () => {
    const defaultCategories = EXPENSE_CATEGORIES;
    const userCustomCategories = customCategories?.expense || [];
    const filteredDefaultCategories = defaultCategories.filter(cat => cat !== 'Outros');
    return [...userCustomCategories, ...filteredDefaultCategories, 'Outros'];
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'regular' | 'recurring' | 'goal' | 'investment') => {
    const numericValue = e.target.value.replace(/\D/g, '');
    const floatValue = numericValue ? parseFloat(numericValue) / 100 : 0;

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

    const transactionData = {
      date: date,
      description,
      category: category === 'Outros' && customCategory.trim() ? `Outros: ${customCategory.trim()}` : category,
      amount: parseFloat(amount),
      type: transactionType,
      paymentMethod
    };

    if (mode === 'edit' && initialData) {
      if ('updateTransaction' in financeContext) {
        financeContext.updateTransaction({
          ...transactionData,
          id: initialData.id
        });
      } else if ('editTransaction' in financeContext) {
        financeContext.editTransaction({
          ...transactionData,
          id: initialData.id
        });
      }
      toast({
        title: 'Transação atualizada',
        description: 'A transação foi atualizada com sucesso!'
      });
    } else {
      if (category === 'Outros' && customCategory.trim()) {
        const finalCustomCategory = customCategory.trim();
        if (addCustomCategory) {
          addCustomCategory(transactionType, finalCustomCategory);
        }
      }
      
      addTransaction(transactionData);
      toast({
        title: 'Transação adicionada',
        description: 'A transação foi adicionada com sucesso!'
      });
    }
    
    resetForm();
    onOpenChange(false);
  };

  const handleSubmitRecurring = (e: React.FormEvent) => {
    e.preventDefault();

    if (!recDescription || !recCategory || !recDueDay || parseInt(recDueDay) < 1 || parseInt(recDueDay) > 31) {
      toast({
        title: 'Campos inválidos',
        description: 'Preencha os campos obrigatórios corretamente. O dia de vencimento deve estar entre 1 e 31.',
        variant: 'destructive'
      });
      return;
    }

    if (recCategory === 'Outros' && recCustomCategory.trim()) {
      const finalCustomCategory = recCustomCategory.trim();

      if (addCustomCategory) {
        addCustomCategory('expense', finalCustomCategory);
      }

      const finalCategory = `Outros: ${finalCustomCategory}`;
      addRecurringExpense({
        description: recDescription,
        category: finalCategory,
        amount: recAmount ? parseFloat(recAmount) : 0,
        dueDay: parseInt(recDueDay),
        paymentMethod: recPaymentMethod,
        repeatMonths: parseInt(recRepeatMonths)
      });
    } else {
      addRecurringExpense({
        description: recDescription,
        category: recCategory,
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

    toast({
      title: 'Investimento realizado',
      description: `Você investiu ${formatCurrency(parseFloat(investmentAmount))} em "${selectedInvestmentObj.name}"`
    });
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setTransactionType('income');
    setSelectedTab('regular');
    setDate(new Date());
    setDescription('');
    setCategory('');
    setCustomCategory('');
    setAmount('');
    setFormattedAmount('');
    setPaymentMethod('bank_transfer');

    setRecDescription('');
    setRecCategory('');
    setRecCustomCategory('');
    setRecAmount('');
    setFormattedRecAmount('');
    setRecDueDay('');
    setRecPaymentMethod('bank_transfer');
    setRecRepeatMonths('12');

    setSelectedGoal('');
    setGoalAmount('');
    setFormattedGoalAmount('');
    setGoalPaymentMethod('bank_transfer');

    setSelectedInvestment('');
    setInvestmentAmount('');
    setFormattedInvestmentAmount('');
    setInvestmentPaymentMethod('bank_transfer');
  };

  const generateRepeatOptions = () => {
    const options = [];

    for (let i = 1; i <= 12; i++) {
      options.push({
        value: i.toString(),
        label: i === 1 ? '1 mês' : `${i} meses`
      });
    }

    [18, 24, 36, 48, 60, 72, 84, 96, 108, 120].forEach(months => {
      const years = months / 12;
      options.push({
        value: months.toString(),
        label: `${months} meses (${years} ${years === 1 ? 'ano' : 'anos'})`
      });
    });
    return options;
  };

  const categories = getCurrentCategories();
  const recurringCategories = getRecurringCategories();
  const showCustomCategory = category === 'Outros';
  const showRecurringCustomCategory = recCategory === 'Outros';
  const repeatOptions = generateRepeatOptions();

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[520px] max-h-[85vh] overflow-y-auto bg-card border-border shadow-lg">
          <DialogHeader className="border-b border-border pb-4 mb-6">
            <DialogTitle className="text-xl font-semibold text-card-foreground">
              {mode === 'edit' ? 'Editar Transação' : 'Adicionar Transação'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {mode === 'edit' ? 'Edite os detalhes da transação abaixo.' : 'Preencha os detalhes da transação abaixo.'}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={selectedTab} onValueChange={value => setSelectedTab(value as 'regular' | 'recurring' | 'goal' | 'investment')} className="w-full">
            <div className="flex justify-center mb-6">
              <TabsList className="bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]">
                <TooltipHelper content={tooltipContent.modals.transactionTypes.regular} delayDuration={500}>
                  <TabsTrigger value="regular" className="data-[state=active]:bg-[hsl(var(--navy-blue))] data-[state=active]:text-white focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring text-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm">
                    Transação
                  </TabsTrigger>
                </TooltipHelper>
                <TooltipHelper content={tooltipContent.modals.transactionTypes.recurring} delayDuration={500}>
                  <TabsTrigger value="recurring" className="data-[state=active]:bg-[hsl(var(--navy-blue))] data-[state=active]:text-white focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring text-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm">
                    Recorrente
                  </TabsTrigger>
                </TooltipHelper>
                <TooltipHelper content={tooltipContent.modals.transactionTypes.goal} delayDuration={500}>
                  <TabsTrigger value="goal" className="data-[state=active]:bg-[hsl(var(--navy-blue))] data-[state=active]:text-white focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring text-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm">
                    Metas
                  </TabsTrigger>
                </TooltipHelper>
                <TooltipHelper content={tooltipContent.modals.transactionTypes.investment} delayDuration={500}>
                  <TabsTrigger value="investment" className="data-[state=active]:bg-[hsl(var(--navy-blue))] data-[state=active]:text-white focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring text-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm">
                    Investir
                  </TabsTrigger>
                </TooltipHelper>
              </TabsList>
            </div>
            
            {/* Transação Regular */}
            <TabsContent value="regular" className="mt-6">
              <form onSubmit={handleSubmitRegular} className="space-y-6 bg-card">
                <Tabs defaultValue="income" value={transactionType} onValueChange={value => setTransactionType(value as TransactionType)} className="w-full">
                  <div className="flex justify-center mb-4">
                    <TabsList className="bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]">
                      <TabsTrigger value="income" className="data-[state=active]:bg-[hsl(var(--navy-blue))] data-[state=active]:text-white focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring text-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm">
                        Receita
                      </TabsTrigger>
                      <TabsTrigger value="expense" className="data-[state=active]:bg-[hsl(var(--navy-blue))] data-[state=active]:text-white focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring text-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm">
                        Despesa
                      </TabsTrigger>
                    </TabsList>
                  </div>
                </Tabs>
                
                <div className="space-y-4">
                  <TooltipHelper content={tooltipContent.modals.fields.date} delayDuration={500}>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        Data
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal bg-background border-input text-foreground focus:border-ring focus:ring-2 focus:ring-ring focus:ring-offset-2",
                              !date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? format(date, "PPP", { locale: ptBR }) : "Selecione uma data"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-background border shadow-lg" align="start">
                          <Calendar
                            mode="single"
                            selected={date}
                            onSelect={(selectedDate) => selectedDate && setDate(selectedDate)}
                            initialFocus
                            className="rounded-lg border-0"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </TooltipHelper>
                  
                  <TooltipHelper content={tooltipContent.modals.fields.description} delayDuration={500}>
                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-sm font-medium text-foreground">
                        Descrição
                      </Label>
                      <Input id="description" value={description} onChange={e => setDescription(e.target.value)} className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring focus:ring-offset-2" placeholder="Digite uma descrição para a transação" required />
                    </div>
                  </TooltipHelper>
                  
                  <TooltipHelper content={tooltipContent.modals.fields.category} delayDuration={500}>
                    <div className="space-y-2">
                      <Label htmlFor="category" className="text-sm font-medium text-foreground">
                        Categoria
                      </Label>
                      <Select value={category} onValueChange={setCategory} required>
                        <SelectTrigger className="bg-background border-input text-foreground focus:border-ring focus:ring-2 focus:ring-ring focus:ring-offset-2">
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border shadow-lg">
                          <SelectGroup>
                            {categories.map(cat => (
                              <SelectItem key={cat} value={cat} className="hover:bg-muted/50">
                                {cat.startsWith('Outros:') ? cat.substring(7) : cat}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  </TooltipHelper>

                  {showCustomCategory && (
                    <TooltipHelper content={tooltipContent.modals.fields.customCategory} delayDuration={500}>
                      <div className="space-y-2">
                        <Label htmlFor="customCategory" className="text-sm font-medium text-foreground">
                          Especificar categoria personalizada
                        </Label>
                        <Input id="customCategory" value={customCategory} onChange={e => setCustomCategory(e.target.value)} placeholder="Digite o nome da categoria" className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring focus:ring-offset-2" />
                      </div>
                    </TooltipHelper>
                  )}
                  
                  <TooltipHelper content={tooltipContent.modals.fields.amount} delayDuration={500}>
                    <div className="space-y-2">
                      <Label htmlFor="amount" className="text-sm font-medium text-foreground">
                        Valor (R$)
                      </Label>
                      <Input id="amount" value={formattedAmount} onChange={e => handleAmountChange(e, 'regular')} className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring focus:ring-offset-2 font-mono text-lg" placeholder="R$ 0,00" required />
                    </div>
                  </TooltipHelper>
                  
                  <TooltipHelper content={tooltipContent.modals.fields.paymentMethod} delayDuration={500}>
                    <div className="space-y-2">
                      <Label htmlFor="paymentMethod" className="text-sm font-medium text-foreground">
                        Forma de Pagamento
                      </Label>
                      <Select value={paymentMethod} onValueChange={value => setPaymentMethod(value as PaymentMethod)}>
                        <SelectTrigger className="bg-background border-input text-foreground focus:border-ring focus:ring-2 focus:ring-ring focus:ring-offset-2">
                          <SelectValue placeholder="Selecione uma forma de pagamento" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border shadow-lg">
                          <SelectGroup>
                            {Object.entries(PAYMENT_METHODS).map(([key, value]) => (
                              <SelectItem key={key} value={key} className="hover:bg-muted/50">
                                {value}
                              </SelectItem>
                            ))}
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
            <TabsContent value="recurring" className="mt-6">
              <form onSubmit={handleSubmitRecurring} className="space-y-6 bg-card">
                <div className="space-y-4">
                  <TooltipHelper content={tooltipContent.modals.fields.description} delayDuration={500}>
                    <div className="space-y-2">
                      <Label htmlFor="recDescription" className="text-sm font-medium text-foreground">
                        Descrição
                      </Label>
                      <Input id="recDescription" value={recDescription} onChange={e => setRecDescription(e.target.value)} className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring focus:ring-offset-2" placeholder="Digite uma descrição para a despesa" required />
                    </div>
                  </TooltipHelper>
                  
                  <TooltipHelper content={tooltipContent.modals.fields.category} delayDuration={500}>
                    <div className="space-y-2">
                      <Label htmlFor="recCategory" className="text-sm font-medium text-foreground">
                        Categoria
                      </Label>
                      <Select value={recCategory} onValueChange={setRecCategory} required>
                        <SelectTrigger className="bg-background border-input text-foreground focus:border-ring focus:ring-2 focus:ring-ring focus:ring-offset-2">
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border shadow-lg">
                          <SelectGroup>
                            {recurringCategories.map(cat => (
                              <SelectItem key={cat} value={cat} className="hover:bg-muted/50">
                                {cat.startsWith('Outros:') ? cat.substring(7) : cat}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  </TooltipHelper>

                  {showRecurringCustomCategory && (
                    <TooltipHelper content={tooltipContent.modals.fields.customCategory} delayDuration={500}>
                      <div className="space-y-2">
                        <Label htmlFor="recCustomCategory" className="text-sm font-medium text-foreground">
                          Especificar categoria personalizada
                        </Label>
                        <Input id="recCustomCategory" value={recCustomCategory} onChange={e => setRecCustomCategory(e.target.value)} placeholder="Digite o nome da categoria" className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring focus:ring-offset-2" />
                      </div>
                    </TooltipHelper>
                  )}
                  
                  <TooltipHelper content={tooltipContent.modals.fields.amount} delayDuration={500}>
                    <div className="space-y-2">
                      <Label htmlFor="recAmount" className="text-sm font-medium text-foreground">
                        Valor (R$)
                      </Label>
                      <Input id="recAmount" value={formattedRecAmount} onChange={e => handleAmountChange(e, 'recurring')} className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring focus:ring-offset-2 font-mono text-lg" placeholder="R$ 0,00" />
                    </div>
                  </TooltipHelper>
                  
                  <TooltipHelper content={tooltipContent.modals.fields.dueDay} delayDuration={500}>
                    <div className="space-y-2">
                      <Label htmlFor="recDueDay" className="text-sm font-medium text-foreground flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        Dia de Vencimento
                      </Label>
                      <Input id="recDueDay" type="number" min="1" max="31" value={recDueDay} onChange={e => setRecDueDay(e.target.value)} className="bg-background border-input text-foreground focus:border-ring focus:ring-2 focus:ring-ring focus:ring-offset-2" placeholder="1-31" required />
                    </div>
                  </TooltipHelper>
                  
                  <TooltipHelper content={tooltipContent.modals.fields.repeatPeriod} delayDuration={500}>
                    <div className="space-y-2">
                      <Label htmlFor="recRepeatMonths" className="text-sm font-medium text-foreground flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        Repetir por
                      </Label>
                      <Select value={recRepeatMonths} onValueChange={setRecRepeatMonths}>
                        <SelectTrigger className="bg-background border-input text-foreground focus:border-ring focus:ring-2 focus:ring-ring focus:ring-offset-2">
                          <SelectValue placeholder="Selecione o período" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border shadow-lg">
                          <SelectGroup>
                            {repeatOptions.map(option => (
                              <SelectItem key={option.value} value={option.value} className="hover:bg-muted/50">
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  </TooltipHelper>
                  
                  <TooltipHelper content={tooltipContent.modals.fields.paymentMethod} delayDuration={500}>
                    <div className="space-y-2">
                      <Label htmlFor="recPaymentMethod" className="text-sm font-medium text-foreground">
                        Forma de Pagamento
                      </Label>
                      <Select value={recPaymentMethod} onValueChange={value => setRecPaymentMethod(value as PaymentMethod)}>
                        <SelectTrigger className="bg-background border-input text-foreground focus:border-ring focus:ring-2 focus:ring-ring focus:ring-offset-2">
                          <SelectValue placeholder="Selecione uma forma de pagamento" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border shadow-lg">
                          <SelectGroup>
                            {Object.entries(PAYMENT_METHODS).map(([key, value]) => (
                              <SelectItem key={key} value={key} className="hover:bg-muted/50">
                                {value}
                              </SelectItem>
                            ))}
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
                      Salvar Despesa Recorrente
                    </Button>
                  </TooltipHelper>
                </DialogFooter>
              </form>
            </TabsContent>
            
            {/* Contribuição para Metas */}
            <TabsContent value="goal" className="mt-6">
              <form onSubmit={handleSubmitGoalContribution} className="space-y-6 bg-card">
                <div className="space-y-4">
                  <TooltipHelper content={tooltipContent.modals.fields.goalContribution} delayDuration={500}>
                    <div className="space-y-2">
                      <Label htmlFor="selectedGoal" className="text-sm font-medium text-foreground flex items-center gap-2">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        Meta
                      </Label>
                      <Select value={selectedGoal} onValueChange={setSelectedGoal} required>
                        <SelectTrigger className="bg-background border-input text-foreground focus:border-ring focus:ring-2 focus:ring-ring focus:ring-offset-2">
                          <SelectValue placeholder="Selecione uma meta" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border shadow-lg">
                          <SelectGroup>
                            {goals.map(goal => (
                              <SelectItem key={goal.id} value={goal.id} className="hover:bg-muted/50">
                                {goal.name} - {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  </TooltipHelper>
                  
                  <TooltipHelper content={tooltipContent.modals.fields.amount} delayDuration={500}>
                    <div className="space-y-2">
                      <Label htmlFor="goalAmount" className="text-sm font-medium text-foreground">
                        Valor (R$)
                      </Label>
                      <Input id="goalAmount" value={formattedGoalAmount} onChange={e => handleAmountChange(e, 'goal')} className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring focus:ring-offset-2 font-mono text-lg" placeholder="R$ 0,00" required />
                    </div>
                  </TooltipHelper>
                  
                  <TooltipHelper content={tooltipContent.modals.fields.paymentMethod} delayDuration={500}>
                    <div className="space-y-2">
                      <Label htmlFor="goalPaymentMethod" className="text-sm font-medium text-foreground">
                        Forma de Pagamento
                      </Label>
                      <Select value={goalPaymentMethod} onValueChange={value => setGoalPaymentMethod(value as PaymentMethod)}>
                        <SelectTrigger className="bg-background border-input text-foreground focus:border-ring focus:ring-2 focus:ring-ring focus:ring-offset-2">
                          <SelectValue placeholder="Selecione uma forma de pagamento" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border shadow-lg">
                          <SelectGroup>
                            {Object.entries(PAYMENT_METHODS).map(([key, value]) => (
                              <SelectItem key={key} value={key} className="hover:bg-muted/50">
                                {value}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  </TooltipHelper>
                  
                  <div className="bg-muted/50 p-4 rounded-lg border border-border">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-muted-foreground">
                        Esta contribuição será registrada como uma despesa na categoria "Poupança para Metas" e o valor será adicionado à meta selecionada.
                      </p>
                    </div>
                  </div>
                </div>
                
                <DialogFooter className="border-t pt-4 mt-6">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="hover:bg-muted/50">
                    Cancelar
                  </Button>
                  <TooltipHelper content={tooltipContent.forms.submit} delayDuration={500}>
                    <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium">
                      Contribuir para Meta
                    </Button>
                  </TooltipHelper>
                </DialogFooter>
              </form>
            </TabsContent>
            
            {/* Investimento */}
            <TabsContent value="investment" className="mt-6">
              <form onSubmit={handleSubmitInvestmentContribution} className="space-y-6 bg-card">
                <div className="space-y-4">
                  <TooltipHelper content={tooltipContent.modals.fields.investmentContribution} delayDuration={500}>
                    <div className="space-y-2">
                      <Label htmlFor="selectedInvestment" className="text-sm font-medium text-foreground flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        Investimento
                      </Label>
                      <Select value={selectedInvestment} onValueChange={setSelectedInvestment} required>
                        <SelectTrigger className="bg-background border-input text-foreground focus:border-ring focus:ring-2 focus:ring-ring focus:ring-offset-2">
                          <SelectValue placeholder="Selecione um investimento" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border shadow-lg">
                          <SelectGroup>
                            {mockInvestments.map(investment => (
                              <SelectItem key={investment.id} value={investment.id} className="hover:bg-muted/50">
                                {investment.name} - ROI: {investment.roi}%
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  </TooltipHelper>
                  
                  <TooltipHelper content={tooltipContent.modals.fields.amount} delayDuration={500}>
                    <div className="space-y-2">
                      <Label htmlFor="investmentAmount" className="text-sm font-medium text-foreground">
                        Valor (R$)
                      </Label>
                      <Input id="investmentAmount" value={formattedInvestmentAmount} onChange={e => handleAmountChange(e, 'investment')} className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring focus:ring-offset-2 font-mono text-lg" placeholder="R$ 0,00" required />
                    </div>
                  </TooltipHelper>
                  
                  <TooltipHelper content={tooltipContent.modals.fields.paymentMethod} delayDuration={500}>
                    <div className="space-y-2">
                      <Label htmlFor="investmentPaymentMethod" className="text-sm font-medium text-foreground">
                        Forma de Pagamento
                      </Label>
                      <Select value={investmentPaymentMethod} onValueChange={value => setInvestmentPaymentMethod(value as PaymentMethod)}>
                        <SelectTrigger className="bg-background border-input text-foreground focus:border-ring focus:ring-2 focus:ring-ring focus:ring-offset-2">
                          <SelectValue placeholder="Selecione uma forma de pagamento" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border shadow-lg">
                          <SelectGroup>
                            {Object.entries(PAYMENT_METHODS).map(([key, value]) => (
                              <SelectItem key={key} value={key} className="hover:bg-muted/50">
                                {value}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  </TooltipHelper>
                  
                  <div className="bg-muted/50 p-4 rounded-lg border border-border">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-muted-foreground">
                        Este valor será registrado como uma despesa na categoria "Investimentos" e o valor será adicionado ao investimento selecionado.
                      </p>
                    </div>
                  </div>
                </div>
                
                <DialogFooter className="border-t pt-4 mt-6">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="hover:bg-muted/50">
                    Cancelar
                  </Button>
                  <TooltipHelper content={tooltipContent.forms.submit} delayDuration={500}>
                    <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium">
                      Realizar Investimento
                    </Button>
                  </TooltipHelper>
                </DialogFooter>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};

export default AddTransactionModal;
