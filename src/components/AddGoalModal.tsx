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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFinance } from '@/contexts/FinanceContext';
import { useBusiness } from '@/contexts/BusinessContext';
import { useAppMode } from '@/contexts/AppModeContext';
import { formatDateForInput, formatCurrencyInput, parseCurrencyToNumber } from '@/utils/formatters';
import { Goal } from '@/types/finance';

interface AddGoalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Goal | null;
  mode?: 'add' | 'edit';
}

const SAVING_LOCATIONS = [
  'Conta Poupança',
  'Conta Corrente',
  'CDB',
  'Tesouro Direto',
  'Fundos de Investimento',
  'Ações',
  'Criptomoedas',
  'Dinheiro em Casa',
  'Outros'
];

const AddGoalModal: React.FC<AddGoalModalProps> = ({ 
  open, 
  onOpenChange, 
  initialData = null,
  mode = 'add'
}) => {
  const { mode: appMode } = useAppMode();
  // Use either finance or business context based on current mode
  const financeContext = appMode === 'personal' ? useFinance() : useBusiness();
  const { addGoal, editGoal } = financeContext;
  
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState(formatDateForInput(new Date()));
  const [savingLocation, setSavingLocation] = useState('');
  const [customSavingLocation, setCustomSavingLocation] = useState('');

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  // Populate form with initial data when editing
  useEffect(() => {
    if (mode === 'edit' && initialData && open) {
      setName(initialData.name);
      setTargetAmount(formatCurrencyInput(initialData.targetAmount.toString().replace('.', '')));
      setCurrentAmount(formatCurrencyInput(initialData.currentAmount.toString().replace('.', '')));
      setTargetDate(formatDateForInput(initialData.targetDate));
      
      // Handle custom saving location
      if (initialData.savingLocation && !SAVING_LOCATIONS.includes(initialData.savingLocation)) {
        setSavingLocation('Outros');
        setCustomSavingLocation(initialData.savingLocation);
      } else {
        setSavingLocation(initialData.savingLocation || '');
        setCustomSavingLocation('');
      }
    }
  }, [mode, initialData, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !targetAmount || !currentAmount || !targetDate) {
      return;
    }

    const finalSavingLocation = savingLocation === 'Outros' && customSavingLocation.trim() 
      ? customSavingLocation.trim() 
      : savingLocation;

    const goalData = {
      name,
      targetAmount: parseCurrencyToNumber(targetAmount),
      currentAmount: parseCurrencyToNumber(currentAmount),
      targetDate: new Date(targetDate),
      savingLocation: finalSavingLocation
    };

    if (mode === 'edit' && initialData) {
      editGoal({
        ...goalData,
        id: initialData.id
      });
    } else {
      addGoal(goalData);
    }

    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setName('');
    setTargetAmount('');
    setCurrentAmount('');
    setTargetDate(formatDateForInput(new Date()));
    setSavingLocation('');
    setCustomSavingLocation('');
  };

  const showCustomSavingLocation = savingLocation === 'Outros';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Editar Meta' : 'Adicionar Meta'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit' 
              ? 'Edite os detalhes da sua meta financeira abaixo.'
              : 'Preencha os detalhes da sua meta financeira abaixo.'
            }
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
              <Select value={savingLocation} onValueChange={setSavingLocation}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione onde você guarda o dinheiro" />
                </SelectTrigger>
                <SelectContent>
                  {SAVING_LOCATIONS.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {showCustomSavingLocation && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="customSavingLocation" className="text-right">
                  Especificar
                </Label>
                <Input
                  id="customSavingLocation"
                  value={customSavingLocation}
                  onChange={(e) => setCustomSavingLocation(e.target.value)}
                  className="col-span-3"
                  placeholder="Digite o local personalizado"
                  required={showCustomSavingLocation}
                />
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {mode === 'edit' ? 'Atualizar' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddGoalModal;
