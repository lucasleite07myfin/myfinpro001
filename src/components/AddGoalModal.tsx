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
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useFinance } from '@/contexts/FinanceContext';
import { useBusiness } from '@/contexts/BusinessContext';
import { useAppMode } from '@/contexts/AppModeContext';
import { formatDateForInput, formatCurrencyInput, parseCurrencyToNumber } from '@/utils/formatters';
import { Goal } from '@/types/finance';
import { Target, Calendar, PiggyBank, DollarSign, TrendingUp, Edit, Lock } from 'lucide-react';
import { toast } from 'sonner';

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
  const [isEditingValues, setIsEditingValues] = useState(false);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      resetForm();
      setIsEditingValues(false);
    }
  }, [open]);

  // Populate form with initial data when editing
  useEffect(() => {
    if (mode === 'edit' && initialData && open) {
      setName(initialData.name);
      // Corrigir formatação dos valores - multiplicar por 100 para formatCurrencyInput
      const targetAmountCents = Math.round(initialData.targetAmount * 100).toString();
      const currentAmountCents = Math.round(initialData.currentAmount * 100).toString();
      setTargetAmount(formatCurrencyInput(targetAmountCents));
      setCurrentAmount(formatCurrencyInput(currentAmountCents));
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
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    // Validação de valores máximos
    const targetValue = parseCurrencyToNumber(targetAmount);
    const currentValue = parseCurrencyToNumber(currentAmount);

    if (targetValue > 999999999.99) {
      toast.error('O valor da meta não pode exceder R$ 999.999.999,99');
      return;
    }

    if (currentValue > 999999999.99) {
      toast.error('O valor atual não pode exceder R$ 999.999.999,99');
      return;
    }

    // Validação de valores mínimos
    if (targetValue <= 0) {
      toast.error('O valor da meta deve ser maior que zero');
      return;
    }

    if (currentValue < 0) {
      toast.error('O valor atual não pode ser negativo');
      return;
    }

    // Sanitização do nome
    const sanitizedName = name.trim().replace(/[<>]/g, '');
    if (sanitizedName.length === 0) {
      toast.error('O nome da meta não pode estar vazio');
      return;
    }

    const finalSavingLocation = savingLocation === 'Outros' && customSavingLocation.trim() 
      ? customSavingLocation.trim() 
      : savingLocation;

    const goalData = {
      name: sanitizedName,
      targetAmount: targetValue,
      currentAmount: currentValue,
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

  // Calculate progress for preview
  const targetValue = parseCurrencyToNumber(targetAmount);
  const currentValue = parseCurrencyToNumber(currentAmount);
  const percentage = targetValue > 0 ? Math.min(100, (currentValue / targetValue) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Target className="h-5 w-5 text-[#EE680D]" />
            {mode === 'edit' ? 'Editar Meta' : 'Nova Meta Financeira'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit' 
              ? 'Edite os detalhes da sua meta financeira abaixo.'
              : 'Defina uma nova meta financeira e acompanhe seu progresso.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Preview Card */}
          {(name || targetAmount || currentAmount) && (
            <Card className="bg-gradient-to-r from-[#EE680D]/10 to-[#EE680D]/5 border-[#EE680D]/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-[#EE680D]" />
                  <span className="text-sm font-medium text-[#EE680D]">Prévia da Meta</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">{name || 'Nome da meta'}</h3>
                <div className="flex justify-between items-center text-sm mb-2">
                  <span>Progresso</span>
                  <Badge variant="secondary">{percentage.toFixed(1)}%</Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div 
                    className="bg-[#EE680D] h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  ></div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Meta: </span>
                    <span className="font-medium">R$ {targetAmount || '0,00'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Atual: </span>
                    <span className="font-medium text-green-600">R$ {currentAmount || '0,00'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Target className="h-4 w-4" />
                Informações Básicas
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Nome da Meta *
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Fundo de emergência, Viagem, Casa própria"
                  required
                  className="bg-gray-50 border-gray-200"
                />
              </div>
            </div>

            <Separator />

            {/* Financial Information */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  Valores Financeiros
                </div>
                {mode === 'edit' && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingValues(!isEditingValues)}
                    className="flex items-center gap-2"
                  >
                    {isEditingValues ? (
                      <>
                        <Lock className="h-4 w-4" />
                        Bloquear Edição
                      </>
                    ) : (
                      <>
                        <Edit className="h-4 w-4" />
                        Editar Valores
                      </>
                    )}
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="targetAmount" className="text-sm font-medium">
                    Valor da Meta (R$) *
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">R$</span>
                    <Input
                      id="targetAmount"
                      value={targetAmount}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^\d]/g, '');
                        setTargetAmount(formatCurrencyInput(value));
                      }}
                      placeholder="0,00"
                      required
                      disabled={mode === 'edit' && !isEditingValues}
                      className={`pl-10 ${mode === 'edit' && !isEditingValues 
                        ? 'bg-gray-100 border-gray-300 text-gray-600 cursor-not-allowed' 
                        : 'bg-gray-50 border-gray-200'
                      }`}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="currentAmount" className="text-sm font-medium">
                    Valor Atual (R$) *
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">R$</span>
                    <Input
                      id="currentAmount"
                      value={currentAmount}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^\d]/g, '');
                        setCurrentAmount(formatCurrencyInput(value));
                      }}
                      placeholder="0,00"
                      required
                      disabled={mode === 'edit' && !isEditingValues}
                      className={`pl-10 ${mode === 'edit' && !isEditingValues 
                        ? 'bg-gray-100 border-gray-300 text-gray-600 cursor-not-allowed' 
                        : 'bg-gray-50 border-gray-200'
                      }`}
                    />
                  </div>
                </div>
              </div>
              
              {mode === 'edit' && !isEditingValues && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <Lock className="h-4 w-4 text-blue-600" />
                  <span>Os valores estão protegidos contra edição acidental. Clique em "Editar Valores" para modificá-los.</span>
                </div>
              )}
            </div>

            <Separator />

            {/* Timeline and Location */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Prazo e Localização
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="targetDate" className="text-sm font-medium">
                    Data Alvo *
                  </Label>
                  <Input
                    id="targetDate"
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    required
                    className="bg-gray-50 border-gray-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="savingLocation" className="text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <PiggyBank className="h-4 w-4" />
                      Local da Poupança
                    </div>
                  </Label>
                  <Select value={savingLocation} onValueChange={setSavingLocation}>
                    <SelectTrigger className="bg-white border-gray-300 focus:border-[#EE680D] focus:ring-[#EE680D]">
                      <SelectValue placeholder="Onde você guarda o dinheiro?" />
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
              </div>

              {showCustomSavingLocation && (
                <div className="space-y-2">
                  <Label htmlFor="customSavingLocation" className="text-sm font-medium">
                    Especificar Local
                  </Label>
                  <Input
                    id="customSavingLocation"
                    value={customSavingLocation}
                    onChange={(e) => setCustomSavingLocation(e.target.value)}
                    placeholder="Digite o local personalizado"
                    required={showCustomSavingLocation}
                    className="bg-gray-50 border-gray-200"
                  />
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-[#EE680D] hover:bg-[#EE680D]/90">
              {mode === 'edit' ? 'Atualizar Meta' : 'Criar Meta'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddGoalModal;
