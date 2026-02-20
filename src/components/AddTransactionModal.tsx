import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useFinance } from '@/contexts/FinanceContext';
import { useBusiness } from '@/contexts/BusinessContext';
import { useAppMode } from '@/contexts/AppModeContext';
import { useBusinessPermissions } from '@/hooks/useBusinessPermissions';
import { PAYMENT_METHODS, PaymentMethod, TransactionType, Goal, FinanceContextType, BusinessContextType, Transaction } from '@/types/finance';
import { formatCurrency } from '@/utils/formatters';
import { formatNumberFromCentsForInput } from '@/utils/money';
import { toast } from 'sonner';
import { Info, Target, TrendingUp, Calendar as CalendarIcon } from 'lucide-react';
import { TooltipProvider } from '@/components/ui/tooltip';
import TooltipHelper from '@/components/TooltipHelper';
import { tooltipContent } from '@/data/tooltipContent';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { CategoryCombobox } from './CategoryCombobox';
import { ManageCategoriesModal } from './ManageCategoriesModal';
import { logger } from '@/utils/logger';

interface AddTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Transaction;
  mode?: 'add' | 'edit';
  defaultTransactionType?: TransactionType;
  showEditConfirmation?: boolean;
  onConfirmEdit?: () => void;
  onCancelEdit?: () => void;
}

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  open,
  onOpenChange,
  initialData,
  mode = 'add',
  defaultTransactionType
}) => {
  const { mode: appMode } = useAppMode();
  const { canCreate, canEdit } = useBusinessPermissions();
  const personalContext = useFinance();
  const businessContext = useBusiness();
  const financeContext = appMode === 'personal' ? personalContext : businessContext;
  
  // Verificar permissões
  const hasCreatePermission = appMode === 'personal' || canCreate('transactions');
  const hasEditPermission = appMode === 'personal' || canEdit('transactions');
  
  const {
    addTransaction,
    addRecurringExpense,
    goals
  } = financeContext;
  
  // Safely access properties that may not exist in BusinessContext
  const customCategories = 'customCategories' in financeContext ? financeContext.customCategories : { income: [], expense: [] };
  const addCustomCategory = 'addCustomCategory' in financeContext ? financeContext.addCustomCategory : undefined;
  const editCustomCategory = 'editCustomCategory' in financeContext ? financeContext.editCustomCategory : undefined;
  const deleteCustomCategory = 'deleteCustomCategory' in financeContext ? financeContext.deleteCustomCategory : undefined;

  const [activeTab, setActiveTab] = useState('transaction');
  const [transactionType, setTransactionType] = useState<TransactionType>(defaultTransactionType || 'expense');

  // Common state for forms
  const [date, setDate] = useState<Date>(new Date());
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [amountCents, setAmountCents] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');

  // Recurring expense specific state
  const [dueDay, setDueDay] = useState('');
  const [repeatMonths, setRepeatMonths] = useState('12');

  // Goal/Investment specific state
  const [selectedGoal, setSelectedGoal] = useState('');
  const [selectedInvestment, setSelectedInvestment] = useState('');
  
  // Modal state
  const [showManageModal, setShowManageModal] = useState(false);
  const [isManagingCategories, setIsManagingCategories] = useState(false);

  useEffect(() => {
    if (!open && !isManagingCategories) {
      resetForm();
    }
  }, [open, isManagingCategories]);

  useEffect(() => {
    if (mode === 'edit' && initialData && open) {
      setActiveTab('transaction');
      setTransactionType(initialData.type);
      setDate(initialData.date);
      setDescription(initialData.description);
      const cents = (initialData as any).amountCents ?? Math.round(initialData.amount * 100);
      setAmountCents(cents);
      setAmountInput(cents > 0 ? formatNumberFromCentsForInput(cents) : '');
      setPaymentMethod(initialData.paymentMethod);
      setCategory(initialData.category);
    }
  }, [mode, initialData, open]);


  const resetForm = () => {
    setActiveTab('transaction');
    setTransactionType(defaultTransactionType || 'expense');
    setDate(new Date());
    setDescription('');
    setCategory('');
    setAmountInput('');
    setAmountCents(0);
    setPaymentMethod('bank_transfer');
    setDueDay('');
    setRepeatMonths('12');
    setSelectedGoal('');
    setSelectedInvestment('');
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '');
    const cents = digits ? parseInt(digits, 10) : 0;
    setAmountCents(cents);
    setAmountInput(cents > 0 ? formatNumberFromCentsForInput(cents) : '');
  };

  const handleCreateCategory = async (name: string): Promise<boolean> => {
    if (!addCustomCategory) return false;
    const success = await addCustomCategory(transactionType, name);
    return success;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    switch (activeTab) {
      case 'transaction':
        handleSubmitTransaction();
        break;
      case 'recurring':
        handleSubmitRecurring();
        break;
      case 'goals':
        handleSubmitGoalContribution();
        break;
      case 'invest':
        handleSubmitInvestmentContribution();
        break;
    }
  };

  const handleSubmitTransaction = async () => {
    // Verificar permissão
    if (mode === 'edit' && !hasEditPermission) {
      toast.error('Você não tem permissão para editar transações');
      return;
    }
    if (mode === 'add' && !hasCreatePermission) {
      toast.error('Você não tem permissão para criar transações');
      return;
    }

    if (!description || !category || amountCents <= 0 || !date) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    // Validação de valor máximo (R$ 999.999.999,99 = 99999999999 centavos)
    if (amountCents > 99999999999) {
      toast.error('O valor não pode exceder R$ 999.999.999,99');
      return;
    }

    const sanitizedDescription = description.trim().replace(/[<>]/g, '');
    if (sanitizedDescription.length === 0) {
      toast.error('A descrição não pode estar vazia');
      return;
    }

    const transactionData = {
      date,
      description: sanitizedDescription,
      category: category,
      amount: amountCents / 100,
      amountCents,
      type: transactionType,
      paymentMethod
    };

    if (mode === 'edit' && initialData) {
        const context = financeContext as FinanceContextType;
        context.editTransaction({ ...transactionData, id: initialData.id });
        toast.success('Transação atualizada com sucesso!');
    } else {
        addTransaction(transactionData);
        toast.success('Transação adicionada com sucesso!');
    }
    
    onOpenChange(false);
  };

  const handleSubmitRecurring = async () => {
    if (!description || !category || !dueDay || parseInt(dueDay) < 1 || parseInt(dueDay) > 31) {
        toast.error('Preencha os campos obrigatórios corretamente.');
        return;
    }

    if (amountCents > 99999999999) {
      toast.error('O valor não pode exceder R$ 999.999.999,99');
      return;
    }

    const sanitizedDescription = description.trim().replace(/[<>]/g, '');
    if (sanitizedDescription.length === 0) {
      toast.error('A descrição não pode estar vazia');
      return;
    }

    addRecurringExpense({
        description: sanitizedDescription,
        category: category,
        amount: amountCents / 100,
        amountCents,
        dueDay: parseInt(dueDay),
        paymentMethod,
        repeatMonths: parseInt(repeatMonths)
    });
    onOpenChange(false);
  };

  const handleSubmitGoalContribution = () => {
    if (!selectedGoal || amountCents <= 0) {
        toast.error('Selecione uma meta e informe o valor.');
        return;
    }
    const selectedGoalObj = goals.find(g => g.id === selectedGoal);
    if (!selectedGoalObj) return;

    const contributionAmount = amountCents / 100;
    addTransaction({
        date: new Date(),
        description: `Contribuição para meta: ${selectedGoalObj.name}`,
        category: 'Poupança para Metas',
        amount: contributionAmount,
        amountCents,
        type: 'expense',
        paymentMethod,
        isGoalContribution: true,
        goalId: selectedGoal
    });

    if ('editGoal' in financeContext) {
        financeContext.editGoal({
            ...selectedGoalObj,
            currentAmount: selectedGoalObj.currentAmount + contributionAmount
        });
    }
    onOpenChange(false);
  };

  const handleSubmitInvestmentContribution = () => {
    // Mocked for now
    onOpenChange(false);
  };


  const renderTransactionForm = () => (
    <>
      {!defaultTransactionType && (
        <Tabs value={transactionType} onValueChange={(value) => setTransactionType(value as TransactionType)} className="w-full mb-4">
          <TabsList className="grid w-full grid-cols-2 bg-gray-100">
            <TabsTrigger 
              value="income" 
              className="data-[state=active]:bg-green-500 data-[state=active]:text-white"
            >
              Receita
            </TabsTrigger>
            <TabsTrigger 
              value="expense" 
              className="data-[state=active]:bg-red-500 data-[state=active]:text-white"
            >
              Despesa
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}
      <div className="space-y-4">
        <TooltipHelper content={tooltipContent.modals.fields.date} delayDuration={500}>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              Data
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP", { locale: ptBR }) : "Selecione uma data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
        </TooltipHelper>
        <TooltipHelper content={tooltipContent.modals.fields.description} delayDuration={500}>
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex: Salário, Aluguel" required className="bg-gray-50 border-gray-200" />
          </div>
        </TooltipHelper>
        <TooltipHelper content={tooltipContent.modals.fields.category} delayDuration={500}>
          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <CategoryCombobox
              value={category}
              onValueChange={setCategory}
              type={transactionType}
              customCategories={customCategories[transactionType]}
              onCreateCategory={handleCreateCategory}
              onManageCategories={() => {
                setIsManagingCategories(true);
                onOpenChange(false);
                setTimeout(() => setShowManageModal(true), 150);
              }}
            />
          </div>
        </TooltipHelper>
        <TooltipHelper content={tooltipContent.modals.fields.amount} delayDuration={500}>
          <div className="space-y-2">
            <Label htmlFor="amount">Valor (R$)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">R$</span>
                                <Input id="amount" value={amountInput} onChange={handleAmountChange} placeholder="0,00" required className="bg-gray-50 border-gray-200 pl-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
            </div>
          </div>
        </TooltipHelper>
        <TooltipHelper content={tooltipContent.modals.fields.paymentMethod} delayDuration={500}>
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
            <Select value={paymentMethod} onValueChange={v => setPaymentMethod(v as PaymentMethod)}>
              <SelectTrigger className="bg-white border-gray-300 focus:border-[#EE680D] focus:ring-[#EE680D]">
                <SelectValue placeholder="Selecione uma forma" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {Object.entries(PAYMENT_METHODS).map(([key, value]) => <SelectItem key={key} value={key}>{value}</SelectItem>)}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </TooltipHelper>
      </div>
    </>
  );

  const renderRecurringForm = () => (
    <div className="space-y-4">
        <TooltipHelper content={tooltipContent.modals.fields.description} delayDuration={500}>
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex: Assinatura Netflix" required className="bg-gray-50 border-gray-200" />
          </div>
        </TooltipHelper>
        <TooltipHelper content={tooltipContent.modals.fields.category} delayDuration={500}>
          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <CategoryCombobox
              value={category}
              onValueChange={setCategory}
              type="expense"
              customCategories={customCategories.expense}
              onCreateCategory={handleCreateCategory}
              onManageCategories={() => {
                setIsManagingCategories(true);
                onOpenChange(false);
                setTimeout(() => setShowManageModal(true), 150);
              }}
            />
          </div>
        </TooltipHelper>
        <TooltipHelper content={tooltipContent.modals.fields.amount} delayDuration={500}>
          <div className="space-y-2">
            <Label htmlFor="amount">Valor (R$)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">R$</span>
              <Input id="amount" value={amountInput} onChange={handleAmountChange} placeholder="0,00" required className="bg-gray-50 border-gray-200 pl-10" />
            </div>
          </div>
        </TooltipHelper>
        <TooltipHelper content={tooltipContent.modals.fields.dueDay} delayDuration={500}>
          <div className="space-y-2">
            <Label htmlFor="dueDay">Dia de Vencimento</Label>
            <Input id="dueDay" type="number" min="1" max="31" value={dueDay} onChange={e => setDueDay(e.target.value)} placeholder="1-31" required className="bg-gray-50 border-gray-200" />
          </div>
        </TooltipHelper>
        <TooltipHelper content={tooltipContent.modals.fields.paymentMethod} delayDuration={500}>
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
            <Select value={paymentMethod} onValueChange={v => setPaymentMethod(v as PaymentMethod)}>
              <SelectTrigger className="bg-white border-gray-300 focus:border-[#EE680D] focus:ring-[#EE680D]">
                <SelectValue placeholder="Selecione uma forma" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {Object.entries(PAYMENT_METHODS).map(([key, value]) => <SelectItem key={key} value={key}>{value}</SelectItem>)}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </TooltipHelper>
    </div>
  );

  const renderGoalsForm = () => (
    <div className="space-y-4">
        <TooltipHelper content={tooltipContent.modals.fields.goalContribution} delayDuration={500}>
          <div className="space-y-2">
            <Label htmlFor="selectedGoal">Meta</Label>
            <Select value={selectedGoal} onValueChange={setSelectedGoal} required>
              <SelectTrigger className="bg-white border-gray-300 focus:border-[#EE680D] focus:ring-[#EE680D]">
                <SelectValue placeholder="Selecione uma meta" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {goals.map(goal => (
                    <SelectItem key={goal.id} value={goal.id}>
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
            <Label htmlFor="amount">Valor da Contribuição (R$)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">R$</span>
              <Input id="amount" value={amountInput} onChange={handleAmountChange} placeholder="0,00" required className="bg-gray-50 border-gray-200 pl-10" />
            </div>
          </div>
        </TooltipHelper>
    </div>
  );

  const renderInvestForm = () => (
      <div className="text-center text-muted-foreground p-8">
          <TrendingUp className="mx-auto h-12 w-12 mb-4" />
          <h3 className="text-lg font-semibold">Em Breve</h3>
          <p>A funcionalidade de adicionar investimentos está em desenvolvimento.</p>
      </div>
  );

  const getModalTitle = () => {
    if (mode === 'edit') return 'Editar Transação';
    if (defaultTransactionType === 'income') return 'Adicionar Receita';
    if (defaultTransactionType === 'expense') return 'Adicionar Despesa';
    return 'Adicionar Transação';
  };

  const getModalBadge = () => {
    if (defaultTransactionType === 'income') {
      return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium">Receita</span>;
    }
    if (defaultTransactionType === 'expense') {
      return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm font-medium">Despesa</span>;
    }
    return null;
  };

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[520px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              {getModalTitle()}
              {getModalBadge()}
            </DialogTitle>
            <DialogDescription>
              {defaultTransactionType ? 
                `Preencha os dados para ${defaultTransactionType === 'income' ? 'a nova receita' : 'a nova despesa'}.` :
                'Selecione o tipo de entrada que deseja adicionar.'
              }
            </DialogDescription>
          </DialogHeader>
          
          {defaultTransactionType ? (
            <form onSubmit={handleSubmit}>
              <div style={{ minHeight: '350px' }}>
                {renderTransactionForm()}
              </div>
              <DialogFooter className="border-t pt-4 mt-6">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    type="submit"
                    style={{ backgroundColor: '#EE680D' }}
                  >
                    Salvar
                  </Button>
              </DialogFooter>
            </form>
          ) : (
            <Tabs value={activeTab} onValueChange={mode === 'edit' ? undefined : setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger 
                  value="transaction" 
                  className="data-[state=active]:bg-[#EE680D] data-[state=active]:text-white"
                >
                  Transação
                </TabsTrigger>
                <TabsTrigger 
                  value="recurring" 
                  disabled={mode === 'edit'}
                  className="data-[state=active]:bg-[#EE680D] data-[state=active]:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Recorrente
                </TabsTrigger>
                <TabsTrigger 
                  value="goals" 
                  disabled={mode === 'edit'}
                  className="data-[state=active]:bg-[#EE680D] data-[state=active]:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Metas
                </TabsTrigger>
                <TabsTrigger 
                  value="invest" 
                  disabled={mode === 'edit'}
                  className="data-[state=active]:bg-[#EE680D] data-[state=active]:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Investir
                </TabsTrigger>
              </TabsList>
              
              <form onSubmit={handleSubmit}>
                <div style={{ minHeight: '350px' }}>
                  <TabsContent value="transaction" className="mt-4">
                    {renderTransactionForm()}
                  </TabsContent>
                  <TabsContent value="recurring" className="mt-4">
                    {renderRecurringForm()}
                  </TabsContent>
                  <TabsContent value="goals" className="mt-4">
                    {renderGoalsForm()}
                  </TabsContent>
                  <TabsContent value="invest" className="mt-4">
                    {renderInvestForm()}
                  </TabsContent>
                </div>
                <DialogFooter className="border-t pt-4 mt-6">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={activeTab === 'invest'} 
                    style={{ backgroundColor: '#EE680D' }}
                  >
                    Salvar
                  </Button>
                </DialogFooter>
              </form>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      <ManageCategoriesModal
        open={showManageModal}
        onOpenChange={(open) => {
          setShowManageModal(open);
          if (!open) {
            setIsManagingCategories(false);
            setTimeout(() => onOpenChange(true), 150);
          }
        }}
        categories={customCategories[transactionType]}
        type={transactionType}
        onEdit={(id, oldName, newName) => editCustomCategory ? editCustomCategory(id, transactionType, oldName, newName) : Promise.resolve()}
        onDelete={(categoryName) => deleteCustomCategory ? deleteCustomCategory(transactionType, categoryName) : Promise.resolve(false)}
      />
    </TooltipProvider>
  );
};

export default AddTransactionModal;
