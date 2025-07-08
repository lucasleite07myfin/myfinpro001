
import * as React from 'react';
import { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useFinance } from '@/contexts/FinanceContext';
import { useAppMode } from '@/contexts/AppModeContext';
import { useBusiness } from '@/contexts/BusinessContext';
import { toast } from 'sonner';
import { Asset } from '@/types/finance';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { formatNumberToCurrency, parseCurrencyToNumber } from '@/utils/formatters';

interface PatrimonyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset?: Asset | null;
}

const CATEGORIES = [
  'Imóveis',
  'Veículos',
  'Investimentos Financeiros',
  'Equipamentos',
  'Outros'
];

const PatrimonyModal: React.FC<PatrimonyModalProps> = ({
  open,
  onOpenChange,
  asset,
}) => {
  const { mode } = useAppMode();
  const financeContext = mode === 'personal' ? useFinance() : useBusiness();
  const { addAsset, editAsset } = financeContext;

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    type: CATEGORIES[0],
    value: 0,
    evaluationDate: new Date(),
    acquisitionValue: 0,
    acquisitionDate: null as Date | null,
    location: '',
    insured: false,
    notes: '',
  });

  // State for formatted currency inputs
  const [formattedValue, setFormattedValue] = useState('');
  const [formattedAcquisitionValue, setFormattedAcquisitionValue] = useState('');

  const [errors, setErrors] = useState({
    name: false,
    type: false,
    value: false,
  });

  // Load asset data when editing
  useEffect(() => {
    if (asset) {
      setFormData({
        id: asset.id,
        name: asset.name || '',
        type: asset.type || CATEGORIES[0],
        value: asset.value || 0,
        evaluationDate: asset.evaluationDate ? new Date(asset.evaluationDate) : new Date(),
        acquisitionValue: asset.acquisitionValue || 0,
        acquisitionDate: asset.acquisitionDate ? new Date(asset.acquisitionDate) : null,
        location: asset.location || '',
        insured: asset.insured || false,
        notes: asset.notes || '',
      });
      
      // Format values for display
      setFormattedValue(formatNumberToCurrency(asset.value || 0));
      setFormattedAcquisitionValue(formatNumberToCurrency(asset.acquisitionValue || 0));
    } else {
      // Reset form for new asset
      setFormData({
        id: '',
        name: '',
        type: CATEGORIES[0],
        value: 0,
        evaluationDate: new Date(),
        acquisitionValue: 0,
        acquisitionDate: null,
        location: '',
        insured: false,
        notes: '',
      });
      
      // Reset formatted inputs
      setFormattedValue(formatNumberToCurrency(0));
      setFormattedAcquisitionValue(formatNumberToCurrency(0));
    }
    setErrors({
      name: false,
      type: false,
      value: false,
    });
  }, [asset, open]);

  const validateForm = () => {
    const newErrors = {
      name: !formData.name.trim(),
      type: !formData.type,
      value: formData.value <= 0,
    };
    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    try {
      if (asset) {
        // Update existing asset
        editAsset({
          ...formData,
          id: asset.id,
        });
        toast.success('Patrimônio atualizado com sucesso');
      } else {
        // Add new asset
        addAsset(formData);
        toast.success('Patrimônio adicionado com sucesso');
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving asset:', error);
      toast.error('Erro ao salvar patrimônio');
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name !== 'value' && name !== 'acquisitionValue' ? value : formData[name],
    });
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'value' | 'acquisitionValue') => {
    const input = e.target.value.replace(/[^\d]/g, '');
    const numericValue = input ? parseFloat(input) / 100 : 0;
    
    if (fieldName === 'value') {
      setFormattedValue(formatNumberToCurrency(numericValue));
      setFormData({...formData, value: numericValue});
    } else {
      setFormattedAcquisitionValue(formatNumberToCurrency(numericValue));
      setFormData({...formData, acquisitionValue: numericValue});
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {asset ? 'Editar Patrimônio' : 'Adicionar Patrimônio'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type" className="flex items-center">
              Categoria <span className="text-red-500 ml-1">*</span>
            </Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger id="type" className={errors.type ? 'border-red-500' : ''}>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center">
              Descrição do bem <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="ex: Apartamento Rua X, Bitcoin em carteira Y"
              className={errors.name ? 'border-red-500' : ''}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="value" className="flex items-center">
                Valor atual (R$) <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="value"
                name="value"
                value={formattedValue}
                onChange={(e) => handleCurrencyChange(e, 'value')}
                placeholder="R$ 0,00"
                className={`font-inter ${errors.value ? 'border-red-500' : ''}`}
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
                    {formData.evaluationDate
                      ? format(formData.evaluationDate, 'dd/MM/yyyy')
                      : 'Selecione uma data'}
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="acquisitionValue">Valor de aquisição (R$)</Label>
              <Input
                id="acquisitionValue"
                name="acquisitionValue"
                value={formattedAcquisitionValue}
                onChange={(e) => handleCurrencyChange(e, 'acquisitionValue')}
                placeholder="R$ 0,00"
                className="font-inter"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="acquisitionDate">Data de aquisição</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.acquisitionDate
                      ? format(formData.acquisitionDate, 'dd/MM/yyyy')
                      : 'Selecione uma data'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.acquisitionDate}
                    onSelect={(date) =>
                      setFormData({ ...formData, acquisitionDate: date })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Localização / custódia</Label>
            <Input
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="ex: Banco XYZ, Carteira digital, Garagem"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="insured"
              checked={formData.insured}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, insured: checked === true })
              }
            />
            <Label htmlFor="insured">Segurado?</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Informações adicionais sobre o bem"
              className="min-h-[80px]"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {asset ? 'Salvar alterações' : 'Adicionar patrimônio'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PatrimonyModal;
