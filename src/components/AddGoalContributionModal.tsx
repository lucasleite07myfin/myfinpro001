import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFinance } from '@/contexts/FinanceContext';
import { useBusiness } from '@/contexts/BusinessContext';
import { useAppMode } from '@/contexts/AppModeContext';
import { formatCurrency, formatNumberToCurrency } from '@/utils/formatters';
import { Goal } from '@/types/finance';
import { PlusCircle, MinusCircle, Target } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { logger } from '@/utils/logger';

interface AddGoalContributionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: Goal | null;
}

const AddGoalContributionModal: React.FC<AddGoalContributionModalProps> = ({
  open,
  onOpenChange,
  goal
}) => {
  const { mode } = useAppMode();
  const financeContext = mode === 'personal' ? useFinance() : useBusiness();
  const { addTransaction } = financeContext;
  
  const [amount, setAmount] = useState('');
  const [formattedAmount, setFormattedAmount] = useState('');
  const [isAdding, setIsAdding] = useState(true); // true = adicionar, false = remover
  const [isLoading, setIsLoading] = useState(false);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numericValue = e.target.value.replace(/\D/g, '');
    const floatValue = numericValue ? parseFloat(numericValue) / 100 : 0;
    setAmount(floatValue.toString());
    setFormattedAmount(formatNumberToCurrency(floatValue));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!goal || !amount || parseFloat(amount) <= 0) {
      toast.error('Por favor, insira um valor válido');
      return;
    }

    setIsLoading(true);
    
    try {
      const contributionAmount = parseFloat(amount);
      const finalAmount = isAdding ? contributionAmount : -contributionAmount;
      
      // Verificar se não vai deixar o valor atual negativo
      if (!isAdding && goal.currentAmount < contributionAmount) {
        toast.error('Não é possível remover mais do que o valor atual da meta');
        setIsLoading(false);
        return;
      }

      // Add transaction for the contribution/withdrawal
      await addTransaction({
        amount: contributionAmount,
        type: isAdding ? 'expense' : 'income',
        category: isAdding ? 'Poupança' : 'Resgate de Poupança',
        description: `${isAdding ? 'Contribuição para' : 'Retirada da'} meta: ${goal.name}`,
        date: new Date(),
        paymentMethod: 'other',
        goalId: goal.id,
        isGoalContribution: true
      });

      // Update goal current amount
      const newCurrentAmount = goal.currentAmount + finalAmount;
      const updatedGoal: Goal = {
        ...goal,
        currentAmount: Math.max(0, newCurrentAmount) // Garantir que não fique negativo
      };
      
      // Use the appropriate updateGoal method based on mode
      if (mode === 'personal') {
        const personalContext = financeContext as ReturnType<typeof useFinance>;
        await personalContext.updateGoal(goal.id, { currentAmount: updatedGoal.currentAmount });
      } else {
        const businessContext = financeContext as ReturnType<typeof useBusiness>;
        businessContext.updateGoal(updatedGoal);
      }

      toast.success(
        `${isAdding ? 'Contribuição' : 'Retirada'} de ${formatCurrency(contributionAmount)} ${isAdding ? 'adicionada à' : 'removida da'} meta "${goal.name}"`
      );
      
      // Reset form
      setAmount('');
      setFormattedAmount('');
      setIsAdding(true);
      onOpenChange(false);
      
    } catch (error) {
      logger.error('Erro ao processar operação:', error);
      toast.error('Erro ao processar operação. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setAmount('');
    setFormattedAmount('');
    setIsAdding(true);
    onOpenChange(false);
  };

  if (!goal) return null;

  const newAmount = isAdding 
    ? goal.currentAmount + (parseFloat(amount) || 0)
    : goal.currentAmount - (parseFloat(amount) || 0);
  
  const newPercentage = Math.min(100, (newAmount / goal.targetAmount) * 100);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <Target className="h-5 w-5 text-[#EE680D]" />
            {isAdding ? 'Adicionar Valor' : 'Remover Valor'}
          </DialogTitle>
          <DialogDescription>
            Meta: <span className="font-medium">{goal.name}</span>
            <br />
            Valor atual: <span className="font-medium text-green-600">{formatCurrency(goal.currentAmount)}</span>
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Toggle Adicionar/Remover */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={isAdding ? "default" : "outline"}
              className={cn(
                "flex-1 flex items-center gap-2",
                isAdding && "bg-green-600 hover:bg-green-700"
              )}
              onClick={() => setIsAdding(true)}
            >
              <PlusCircle className="h-4 w-4" />
              Adicionar
            </Button>
            <Button
              type="button"
              variant={!isAdding ? "default" : "outline"}
              className={cn(
                "flex-1 flex items-center gap-2",
                !isAdding && "bg-red-600 hover:bg-red-700"
              )}
              onClick={() => setIsAdding(false)}
            >
              <MinusCircle className="h-4 w-4" />
              Remover
            </Button>
          </div>

          {/* Campo de Valor */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-medium">
              Valor (R$)
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                R$
              </span>
              <Input
                id="amount"
                value={formattedAmount}
                onChange={handleAmountChange}
                placeholder="0,00"
                required
                className="pl-10 text-lg font-medium"
                autoFocus
              />
            </div>
          </div>

          {/* Preview do resultado */}
          {amount && parseFloat(amount) > 0 && (
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Novo valor:</span>
                <span className="font-medium">
                  {formatCurrency(Math.max(0, newAmount))}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Novo progresso:</span>
                <span className="font-medium">
                  {Math.max(0, newPercentage).toFixed(1)}%
                </span>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div 
                  className={cn(
                    "h-full transition-all duration-300",
                    newPercentage >= 100 ? "bg-green-500" :
                    newPercentage >= 75 ? "bg-blue-500" :
                    newPercentage >= 50 ? "bg-yellow-500" : "bg-orange-500"
                  )}
                  style={{ width: `${Math.min(100, Math.max(0, newPercentage))}%` }}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={!amount || parseFloat(amount) <= 0 || isLoading}
              className={cn(
                isAdding ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
              )}
            >
              {isLoading ? 'Processando...' : (isAdding ? 'Adicionar' : 'Remover')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddGoalContributionModal;
