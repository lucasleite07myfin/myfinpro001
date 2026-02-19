
import React, { useState } from 'react';
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
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useFinance } from '@/contexts/FinanceContext';
import { useBusiness } from '@/contexts/BusinessContext';
import { useAppMode } from '@/contexts/AppModeContext';
import { formatNumberFromCentsForInput } from '@/utils/money';
import { sanitizeText } from '@/utils/xssSanitizer';

interface AddLiabilityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LIABILITY_TYPES = [
  'Empréstimo',
  'Financiamento',
  'Cartão de Crédito',
  'Outros'
];

const AddLiabilityModal: React.FC<AddLiabilityModalProps> = ({ open, onOpenChange }) => {
  const { mode } = useAppMode();
  const personalContext = useFinance();
  const businessContext = useBusiness();
  const financeContext = mode === 'personal' ? personalContext : businessContext;
  const { addLiability } = financeContext;
  
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [valueInput, setValueInput] = useState('');
  const [valueCents, setValueCents] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !type || valueCents <= 0) {
      return;
    }

    addLiability({
      name: sanitizeText(name),
      type,
      value: valueCents / 100
    });

    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setName('');
    setType('');
    setValueInput('');
    setValueCents(0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Passivo</DialogTitle>
          <DialogDescription>
            Preencha os detalhes do seu passivo abaixo.
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
                placeholder="Ex: Empréstimo pessoal"
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Tipo
              </Label>
              <Select value={type} onValueChange={setType} required>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione um tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {LIABILITY_TYPES.map((liabilityType) => (
                      <SelectItem key={liabilityType} value={liabilityType}>
                        {liabilityType}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="value" className="text-right">
                Valor (R$)
              </Label>
              <Input
                id="value"
                value={valueInput ? `R$ ${valueInput}` : ''}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '');
                  const cents = digits ? parseInt(digits, 10) : 0;
                  setValueCents(cents);
                  setValueInput(cents > 0 ? formatNumberFromCentsForInput(cents) : '');
                }}
                className="col-span-3 font-inter"
                placeholder="R$ 0,00"
                required
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

export default AddLiabilityModal;
