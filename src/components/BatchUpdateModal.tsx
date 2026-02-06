
import * as React from 'react';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFinance } from '@/contexts/FinanceContext';
import { useAppMode } from '@/contexts/AppModeContext';
import { useBusiness } from '@/contexts/BusinessContext';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

interface BatchUpdateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedAssets: string[];
  onClearSelection: () => void;
}

const BatchUpdateModal: React.FC<BatchUpdateModalProps> = ({
  open,
  onOpenChange,
  selectedAssets,
  onClearSelection,
}) => {
  const { mode } = useAppMode();
  const personalContext = useFinance();
  const businessContext = useBusiness();
  const financeContext = mode === 'personal' ? personalContext : businessContext;
  const { assets, editAsset } = financeContext;

  const [formData, setFormData] = useState({
    value: 0,
    evaluationDate: new Date(),
  });

  const [errors, setErrors] = useState({
    value: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.value <= 0) {
      setErrors({ value: true });
      toast.error('Por favor, informe um valor válido');
      return;
    }

    try {
      // Update all selected assets
      let updatedCount = 0;
      selectedAssets.forEach(assetId => {
        const asset = assets.find(a => a.id === assetId);
        if (asset) {
          editAsset({
            ...asset,
            value: formData.value,
            evaluationDate: formData.evaluationDate,
          });
          updatedCount++;
        }
      });
      
      toast.success(`${updatedCount} patrimônios atualizados com sucesso`);
      onOpenChange(false);
      onClearSelection();
    } catch (error) {
      console.error('Error updating assets:', error);
      toast.error('Erro ao atualizar patrimônios');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Atualizar {selectedAssets.length} patrimônios
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="value" className="flex items-center">
              Novo valor (R$) <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="value"
              type="number"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
              placeholder="0,00"
              step="0.01"
              min="0"
              className={errors.value ? 'border-red-500' : ''}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="evaluationDate">Data da avaliação</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(formData.evaluationDate, 'dd/MM/yyyy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.evaluationDate}
                  onSelect={(date) =>
                    date && setFormData({ ...formData, evaluationDate: date })
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Atualizar valores
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BatchUpdateModal;
