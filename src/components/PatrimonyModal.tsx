import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useFinance } from '@/contexts/FinanceContext';
import { useAppMode } from '@/contexts/AppModeContext';
import { useBusiness } from '@/contexts/BusinessContext';
import { toast } from 'sonner';
import { Asset } from '@/types/finance';
import { format } from 'date-fns';
import { formatNumberToCurrency, parseCurrencyToNumber, formatCurrencyInput } from '@/utils/formatters';
import { 
  CalendarIcon, 
  Wallet, 
  Building2, 
  Car, 
  TrendingUp, 
  Shield, 
  MapPin, 
  FileText,
  DollarSign,
  Calendar as CalendarLucide
} from 'lucide-react';

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
      setFormattedValue(formatCurrencyInput((asset.value * 100).toString()));
      setFormattedAcquisitionValue(formatCurrencyInput(((asset.acquisitionValue || 0) * 100).toString()));
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
      setFormattedValue('');
      setFormattedAcquisitionValue('');
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
      [name]: value,
    });
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'value' | 'acquisitionValue') => {
    const input = e.target.value.replace(/[^\d]/g, '');
    const numericValue = input ? parseFloat(input) / 100 : 0;
    
    if (fieldName === 'value') {
      setFormattedValue(formatCurrencyInput(input));
      setFormData({...formData, value: numericValue});
    } else {
      setFormattedAcquisitionValue(formatCurrencyInput(input));
      setFormData({...formData, acquisitionValue: numericValue});
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Imóveis': return <Building2 className="h-4 w-4" />;
      case 'Veículos': return <Car className="h-4 w-4" />;
      case 'Investimentos Financeiros': return <TrendingUp className="h-4 w-4" />;
      default: return <Wallet className="h-4 w-4" />;
    }
  };

  // Calculate potential gain/loss for preview
  const gainLoss = formData.value - (formData.acquisitionValue || 0);
  const gainLossPercentage = formData.acquisitionValue > 0 
    ? ((gainLoss / formData.acquisitionValue) * 100) 
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh]">
        <DialogHeader className="pb-3">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Wallet className="h-5 w-5 text-[#EE680D]" />
            {asset ? 'Editar Patrimônio' : 'Novo Patrimônio'}
          </DialogTitle>
          <DialogDescription>
            {asset 
              ? 'Edite as informações do seu patrimônio abaixo.'
              : 'Adicione um novo bem ou investimento ao seu patrimônio.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Preview Card */}
          {(formData.name || formData.value > 0) && (
            <Card className="bg-gradient-to-r from-[#EE680D]/10 to-[#EE680D]/5 border-[#EE680D]/20">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  {getCategoryIcon(formData.type)}
                  <span className="text-sm font-medium text-[#EE680D]">Prévia</span>
                  <Badge variant="secondary">{formData.type}</Badge>
                  {formData.insured && (
                    <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
                      <Shield className="h-3 w-3 mr-1" />
                      Segurado
                    </Badge>
                  )}
                </div>
                <h3 className="font-semibold mb-2">{formData.name || 'Nome do patrimônio'}</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Atual:</span>
                    <span className="font-medium text-green-600">R$ {formattedValue || '0,00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Aquisição:</span>
                    <span className="font-medium">R$ {formattedAcquisitionValue || '0,00'}</span>
                  </div>
                  {formData.acquisitionValue > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Ganho/Perda:</span>
                        <span className={`font-medium ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          R$ {Math.abs(gainLoss).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Variação:</span>
                        <span className={`font-medium ${gainLossPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {gainLossPercentage >= 0 ? '+' : ''}{gainLossPercentage.toFixed(1)}%
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Basic Information */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Wallet className="h-4 w-4" />
              Informações Básicas
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="type" className="text-sm font-medium">Categoria *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger id="type" className={`bg-white border-gray-300 focus:border-[#EE680D] focus:ring-[#EE680D] ${errors.type ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(category)}
                          {category}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="name" className="text-sm font-medium">Descrição do bem *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Ex: Apartamento Rua X"
                  required
                  className={`bg-gray-50 border-gray-200 ${errors.name ? 'border-red-500' : ''}`}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Financial Information */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              Valores Financeiros
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="value" className="text-sm font-medium">Valor atual (R$) *</Label>
                <Input
                  id="value"
                  name="value"
                  value={formattedValue ? `R$ ${formattedValue}` : ''}
                  onChange={(e) => handleCurrencyChange(e, 'value')}
                  placeholder="R$ 0,00"
                  required
                  className={`bg-gray-50 border-gray-200 ${errors.value ? 'border-red-500' : ''}`}
                />
              </div>

              <div>
                <Label htmlFor="acquisitionValue" className="text-sm font-medium">Valor de aquisição (R$)</Label>
                <Input
                  id="acquisitionValue"
                  name="acquisitionValue"
                  value={formattedAcquisitionValue ? `R$ ${formattedAcquisitionValue}` : ''}
                  onChange={(e) => handleCurrencyChange(e, 'acquisitionValue')}
                  placeholder="R$ 0,00"
                  className="bg-gray-50 border-gray-200"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Dates */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CalendarLucide className="h-4 w-4" />
              Datas
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="evaluationDate" className="text-sm font-medium">Data da avaliação *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal bg-gray-50 border-gray-200"
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

              <div>
                <Label htmlFor="acquisitionDate" className="text-sm font-medium">Data de aquisição</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal bg-gray-50 border-gray-200"
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
          </div>

          <Separator />

          {/* Additional Information */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <MapPin className="h-4 w-4" />
              Informações Adicionais
            </div>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="location" className="text-sm font-medium">Localização / custódia</Label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Ex: Banco XYZ, Carteira digital"
                  className="bg-gray-50 border-gray-200"
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
                <Label htmlFor="insured" className="text-sm font-medium flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100 flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    Este bem está segurado?
                  </Badge>
                </Label>
              </div>

              <div>
                <Label htmlFor="notes" className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Observações
                </Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Informações adicionais (opcional)"
                  className="min-h-[50px] bg-gray-50 border-gray-200"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-[#EE680D] hover:bg-[#EE680D]/90">
              {asset ? 'Atualizar Patrimônio' : 'Adicionar Patrimônio'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PatrimonyModal;
