
import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFinance } from '@/contexts/FinanceContext';
import { useBusiness } from '@/contexts/BusinessContext';
import { useAppMode } from '@/contexts/AppModeContext';
import { formatDateForInput, formatCurrencyInput, parseCurrencyToNumber } from '@/utils/formatters';

interface AddGoalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddGoalModal: React.FC<AddGoalModalProps> = ({ open, onOpenChange }) => {
  const { mode } = useAppMode();
  // Use either finance or business context based on current mode
  const financeContext = mode === 'personal' ? useFinance() : useBusiness();
  const { addGoal } = financeContext;
  
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState(formatDateForInput(new Date()));
  const [savingLocation, setSavingLocation] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !targetAmount || !currentAmount || !targetDate) {
      return;
    }

    addGoal({
      name,
      targetAmount: parseCurrencyToNumber(targetAmount),
      currentAmount: parseCurrencyToNumber(currentAmount),
      targetDate: new Date(targetDate),
      savingLocation
    });

    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setName('');
    setTargetAmount('');
    setCurrentAmount('');
    setTargetDate(formatDateForInput(new Date()));
    setSavingLocation('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Meta</DialogTitle>
          <DialogDescription>
            Preencha os detalhes da sua meta financeira abaixo.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nome
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                placeholder="Ex: Fundo de emergência"
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="targetAmount" className="text-right">
                Valor alvo (R$)
              </Label>
              <Input
                id="targetAmount"
                value={targetAmount ? `R$ ${targetAmount}` : ''}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^\d]/g, '');
                  setTargetAmount(formatCurrencyInput(value));
                }}
                className="col-span-3 font-inter"
                placeholder="R$ 0,00"
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="currentAmount" className="text-right">
                Valor atual (R$)
              </Label>
              <Input
                id="currentAmount"
                value={currentAmount ? `R$ ${currentAmount}` : ''}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^\d]/g, '');
                  setCurrentAmount(formatCurrencyInput(value));
                }}
                className="col-span-3 font-inter"
                placeholder="R$ 0,00"
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="targetDate" className="text-right">
                Data alvo
              </Label>
              <Input
                id="targetDate"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="col-span-3"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="savingLocation" className="text-right">
                Local de Verba
              </Label>
              <Input
                id="savingLocation"
                value={savingLocation}
                onChange={(e) => setSavingLocation(e.target.value)}
                className="col-span-3"
                placeholder="Ex: Nome do Banco, Cofre, Caixinha..."
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddGoalModal;
