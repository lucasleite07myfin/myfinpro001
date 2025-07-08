
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
import { useFinance } from '@/contexts/FinanceContext';
import { useAppMode } from '@/contexts/AppModeContext';
import { useBusiness } from '@/contexts/BusinessContext';
import { toast } from 'sonner';
import { Asset } from '@/types/finance';
import { Bitcoin } from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Check } from 'lucide-react';

interface CryptoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  crypto?: Asset | null;
}

const CryptoModal: React.FC<CryptoModalProps> = ({
  open,
  onOpenChange,
  crypto,
}) => {
  const { mode } = useAppMode();
  const financeContext = mode === 'personal' ? useFinance() : useBusiness();
  const { addAsset, editAsset, assets } = financeContext;

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    type: 'Cripto',
    symbol: '',
    quantity: 0,
    value: 0,
    wallet: '',
    evaluationDate: new Date(),
    notes: '',
  });

  const [errors, setErrors] = useState({
    symbol: false,
    quantity: false,
  });

  const [openCoinSelector, setOpenCoinSelector] = useState(false);
  
  // Extrair moedas únicas já utilizadas
  const usedCoins = React.useMemo(() => {
    const uniqueCoins = new Set<string>();
    assets
      .filter(asset => asset.type === 'Cripto' && asset.symbol)
      .forEach(asset => uniqueCoins.add(asset.symbol?.toUpperCase() || ''));
    
    return Array.from(uniqueCoins).map(symbol => ({
      symbol,
      label: symbol
    }));
  }, [assets]);

  // Carregar dados da criptomoeda quando editando
  useEffect(() => {
    if (crypto) {
      setFormData({
        id: crypto.id,
        name: crypto.name || '',
        type: 'Cripto',
        symbol: crypto.symbol || '',
        quantity: crypto.quantity || 0,
        value: crypto.value || 0,
        wallet: crypto.wallet || '',
        evaluationDate: crypto.evaluationDate ? new Date(crypto.evaluationDate) : new Date(),
        notes: crypto.notes || '',
      });
    } else {
      // Reset form for new crypto asset
      setFormData({
        id: '',
        name: '',
        type: 'Cripto',
        symbol: '',
        quantity: 0,
        value: 0,
        wallet: '',
        evaluationDate: new Date(),
        notes: '',
      });
    }
    setErrors({
      symbol: false,
      quantity: false,
    });
  }, [crypto, open]);

  const validateForm = () => {
    const newErrors = {
      symbol: !formData.symbol.trim(),
      quantity: formData.quantity <= 0,
    };
    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    try {
      // Verificar se já existe um ativo de criptomoeda com o mesmo símbolo
      const existingCrypto = crypto?.id 
        ? null 
        : assets.find(
            asset => 
              asset.type === 'Cripto' && 
              asset.symbol?.toUpperCase() === formData.symbol.toUpperCase()
          );
      
      // Criar nome baseado no símbolo para exibição na lista
      const name = `${formData.symbol.toUpperCase()} (${formData.quantity})`;

      if (existingCrypto) {
        // Atualizar quantidade da criptomoeda existente
        const updatedQuantity = existingCrypto.quantity! + formData.quantity;
        
        editAsset({
          ...existingCrypto,
          name: `${existingCrypto.symbol?.toUpperCase()} (${updatedQuantity})`,
          quantity: updatedQuantity,
          evaluationDate: new Date(),
        });
        
        toast.success(`${formData.symbol.toUpperCase()} atualizado para ${updatedQuantity}`);
      } else if (crypto) {
        // Atualizar criptomoeda existente
        editAsset({
          ...crypto,
          name,
          symbol: formData.symbol.toUpperCase(),
          quantity: formData.quantity,
          wallet: formData.wallet,
          notes: formData.notes,
          evaluationDate: formData.evaluationDate,
          // Manter o valor atual até a próxima atualização automatizada
        });
        toast.success('Criptomoeda atualizada com sucesso');
      } else {
        // Adicionar nova criptomoeda
        addAsset({
          name,
          type: 'Cripto',
          symbol: formData.symbol.toUpperCase(),
          quantity: formData.quantity,
          value: 0, // Será atualizado automaticamente
          wallet: formData.wallet,
          evaluationDate: new Date(),
          insured: false,
          notes: formData.notes,
        });
        toast.success('Criptomoeda adicionada com sucesso');
      }
      onOpenChange(false);
      
      // Mostra toast informativo sobre a atualização automática
      toast.info('Os preços das criptomoedas serão atualizados automaticamente a cada 5 minutos', {
        duration: 5000,
      });
    } catch (error) {
      console.error('Error saving crypto asset:', error);
      toast.error('Erro ao salvar criptomoeda');
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === 'number' && name === 'quantity') {
      // Limitar a 8 casas decimais para quantidade
      const decimalValue = parseFloat(value);
      const formattedValue = Number.isNaN(decimalValue) ? 0 : parseFloat(decimalValue.toFixed(8));
      
      setFormData({
        ...formData,
        [name]: formattedValue
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === 'number' ? parseFloat(value) || 0 : value,
      });
    }
  };

  const handleCoinSelect = (coin: string) => {
    setFormData({
      ...formData,
      symbol: coin
    });
    setOpenCoinSelector(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bitcoin className="h-5 w-5" />
            {crypto ? 'Editar Criptomoeda' : 'Adicionar Criptomoeda'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="symbol" className="flex items-center">
              Moeda <span className="text-red-500 ml-1">*</span>
            </Label>
            
            <Popover open={openCoinSelector} onOpenChange={setOpenCoinSelector}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCoinSelector}
                  className="w-full justify-between"
                >
                  {formData.symbol ? formData.symbol.toUpperCase() : "Selecione uma moeda..."}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput 
                    placeholder="Buscar moeda..." 
                    value={formData.symbol}
                    onValueChange={(value) => setFormData({...formData, symbol: value})}
                  />
                  <CommandList>
                    <CommandEmpty>Nenhuma moeda encontrada</CommandEmpty>
                    <CommandGroup>
                      {usedCoins.length > 0 ? (
                        usedCoins.map(coin => (
                          <CommandItem
                            key={coin.symbol}
                            value={coin.symbol}
                            onSelect={() => handleCoinSelect(coin.symbol)}
                            className="cursor-pointer"
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${formData.symbol.toUpperCase() === coin.symbol ? "opacity-100" : "opacity-0"}`}
                            />
                            {coin.symbol}
                          </CommandItem>
                        ))
                      ) : (
                        <CommandItem disabled>
                          Nenhuma moeda usada anteriormente
                        </CommandItem>
                      )}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            
            <Input
              id="symbol"
              name="symbol"
              value={formData.symbol}
              onChange={handleChange}
              placeholder="ex: BTC, ETH, DOT"
              className={`mt-2 ${errors.symbol ? 'border-red-500' : ''}`}
              maxLength={10}
            />
            {errors.symbol && (
              <p className="text-xs text-red-500">Moeda é obrigatória</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity" className="flex items-center">
              Quantidade <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              value={formData.quantity}
              onChange={handleChange}
              step="0.00000001"
              min="0.00000001"
              placeholder="0.00000000"
              className={errors.quantity ? 'border-red-500' : ''}
            />
            {errors.quantity && (
              <p className="text-xs text-red-500">Quantidade deve ser maior que zero</p>
            )}
            <p className="text-xs text-muted-foreground">
              Você pode inserir até 8 casas decimais
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="wallet">Corretora/Wallet</Label>
            <Input
              id="wallet"
              name="wallet"
              value={formData.wallet}
              onChange={handleChange}
              placeholder="ex: Binance, MetaMask, Ledger"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {crypto ? 'Salvar alterações' : 'Adicionar criptomoeda'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CryptoModal;
