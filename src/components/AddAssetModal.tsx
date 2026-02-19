
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
import { TrendingUp } from 'lucide-react';
import { TooltipProvider } from '@/components/ui/tooltip';
import TooltipHelper from './TooltipHelper';
import { useFinance } from '@/contexts/FinanceContext';
import { useBusiness } from '@/contexts/BusinessContext';
import { useAppMode } from '@/contexts/AppModeContext';
import { formatNumberFromCentsForInput } from '@/utils/money';
import { sanitizeText } from '@/utils/xssSanitizer';

interface AddAssetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ASSET_TYPES = [
  'Imóvel',
  'Veículo',
  'Investimento',
  'Conta Bancária',
  'Equipamentos',
  'Joias',
  'Arte',
  'Outros'
];

const AddAssetModal: React.FC<AddAssetModalProps> = ({ open, onOpenChange }) => {
  const { mode } = useAppMode();
  const personalContext = useFinance();
  const businessContext = useBusiness();
  const financeContext = mode === 'personal' ? personalContext : businessContext;
  const { addAsset } = financeContext;
  
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [valueInput, setValueInput] = useState('');
  const [valueCents, setValueCents] = useState(0);
  const [customType, setCustomType] = useState('');
  const [isCustomType, setIsCustomType] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !type || valueCents <= 0) {
      return;
    }

    const finalType = isCustomType && customType ? sanitizeText(customType) : type;
    
    addAsset({
      name: sanitizeText(name),
      type: finalType,
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
    setCustomType('');
    setIsCustomType(false);
  };

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] max-w-[520px] max-h-[90vh] overflow-y-auto bg-card border-border shadow-lg">
          <DialogHeader className="border-b border-border pb-4 mb-6">
            <DialogTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Adicionar Ativo
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Preencha os detalhes do seu ativo abaixo.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6 bg-card">
            <div className="space-y-4">
              <TooltipHelper content="Nome identificador do ativo" delayDuration={500}>
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-foreground">
                    Nome do Ativo
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    placeholder="Ex: Apartamento Centro"
                    required
                  />
                </div>
              </TooltipHelper>
              
              <TooltipHelper content="Categoria do ativo" delayDuration={500}>
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-sm font-medium text-foreground">
                    Tipo de Ativo
                  </Label>
                  <Select 
                    value={type} 
                    onValueChange={(value) => {
                      setType(value);
                      setIsCustomType(value === 'Outros');
                    }} 
                    required
                  >
                    <SelectTrigger className="bg-white border-gray-300 focus:border-[#EE680D] focus:ring-[#EE680D]">
                      <SelectValue placeholder="Selecione um tipo" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-lg">
                      <SelectGroup>
                        {ASSET_TYPES.map((assetType) => (
                          <SelectItem key={assetType} value={assetType} className="hover:bg-muted/50">
                            {assetType}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </TooltipHelper>

              {isCustomType && (
                <TooltipHelper content="Especifique o tipo personalizado do ativo" delayDuration={500}>
                  <div className="space-y-2">
                    <Label htmlFor="customType" className="text-sm font-medium text-foreground">
                      Especificar tipo personalizado
                    </Label>
                    <Input
                      id="customType"
                      value={customType}
                      onChange={(e) => setCustomType(e.target.value)}
                      className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      placeholder="Digite o tipo personalizado"
                      required={isCustomType}
                    />
                  </div>
                </TooltipHelper>
              )}
              
              <TooltipHelper content="Valor atual estimado do ativo" delayDuration={500}>
                <div className="space-y-2">
                  <Label htmlFor="value" className="text-sm font-medium text-foreground">
                    Valor Atual (R$)
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
                    className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring focus:ring-offset-2 font-mono text-lg"
                    placeholder="R$ 0,00"
                    required
                  />
                </div>
              </TooltipHelper>
            </div>
            
            <DialogFooter className="border-t pt-4 mt-6 flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="hover:bg-muted/50">
                Cancelar
              </Button>
              <TooltipHelper content="Salvar ativo" delayDuration={500}>
                <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium">
                  Salvar Ativo
                </Button>
              </TooltipHelper>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};

export default AddAssetModal;
