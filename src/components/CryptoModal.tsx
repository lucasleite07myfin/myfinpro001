import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useFinance } from '@/contexts/FinanceContext';
import { useAppMode } from '@/contexts/AppModeContext';
import { useBusiness } from '@/contexts/BusinessContext';
import { useCryptoList } from '@/hooks/useCryptoList';
import { toast } from 'sonner';
import { Asset } from '@/types/finance';
import { 
  Bitcoin, 
  Wallet, 
  Hash, 
  DollarSign,
  FileText,
  TrendingUp,
  Loader2,
  RefreshCw
} from 'lucide-react';
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
import { Check, ChevronDown } from 'lucide-react';

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
  const { coins, loading: coinsLoading, error: coinsError, refetch } = useCryptoList();

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
  const [searchTerm, setSearchTerm] = useState('');
  
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

  // Filtrar moedas baseado na busca
  const filteredCoins = React.useMemo(() => {
    if (!searchTerm) return coins.slice(0, 50); // Mostrar apenas as top 50 inicialmente
    
    return coins.filter(coin => 
      coin.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coin.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 100); // Limitar a 100 resultados
  }, [coins, searchTerm]);

  // Combinar moedas usadas com as da API
  const allCoins = React.useMemo(() => {
    const apiCoins = filteredCoins.map(coin => ({
      symbol: coin.symbol,
      name: coin.name,
      isUsed: false
    }));

    const usedCoinsData = usedCoins.map(coin => ({
      symbol: coin.symbol,
      name: coin.symbol,
      isUsed: true
    }));

    // Remover duplicatas e priorizar moedas já usadas
    const uniqueCoins = new Map();
    
    // Adicionar moedas usadas primeiro
    usedCoinsData.forEach(coin => {
      uniqueCoins.set(coin.symbol, coin);
    });

    // Adicionar moedas da API que não estão sendo usadas
    apiCoins.forEach(coin => {
      if (!uniqueCoins.has(coin.symbol)) {
        uniqueCoins.set(coin.symbol, coin);
      }
    });

    return Array.from(uniqueCoins.values());
  }, [filteredCoins, usedCoins]);

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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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
    setSearchTerm('');
  };

  // Calculate estimated value for preview
  const estimatedValue = formData.quantity * (crypto?.value || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh]">
        <DialogHeader className="pb-3">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Bitcoin className="h-5 w-5 text-[#EE680D]" />
            {crypto ? 'Editar Criptomoeda' : 'Nova Criptomoeda'}
          </DialogTitle>
          <DialogDescription>
            {crypto 
              ? 'Edite as informações da sua criptomoeda abaixo.'
              : 'Adicione uma nova criptomoeda ao seu portfólio.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Preview Card */}
          {(formData.symbol || formData.quantity > 0) && (
            <Card className="bg-gradient-to-r from-[#EE680D]/10 to-[#EE680D]/5 border-[#EE680D]/20">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Bitcoin className="h-4 w-4" />
                  <span className="text-sm font-medium text-[#EE680D]">Prévia</span>
                  <Badge variant="secondary">Cripto</Badge>
                </div>
                <h3 className="font-semibold mb-2">
                  {formData.symbol ? `${formData.symbol.toUpperCase()} (${formData.quantity})` : 'Criptomoeda'}
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Quantidade:</span>
                    <span className="font-medium">{formData.quantity.toFixed(8)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Símbolo:</span>
                    <span className="font-medium">{formData.symbol.toUpperCase() || 'N/A'}</span>
                  </div>
                  {crypto && estimatedValue > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Valor estimado:</span>
                        <span className="font-medium text-green-600">
                          R$ {estimatedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Preço unitário:</span>
                        <span className="font-medium">
                          R$ {(crypto?.value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
              <Hash className="h-4 w-4" />
              Informações da Moeda
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="symbol" className="text-sm font-medium">
                  Símbolo da moeda *
                </Label>
                <Popover open={openCoinSelector} onOpenChange={setOpenCoinSelector}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openCoinSelector}
                      className={`w-full justify-between bg-gray-50 border-gray-200 ${errors.symbol ? 'border-red-500' : ''}`}
                    >
                      {formData.symbol ? formData.symbol.toUpperCase() : "Selecione uma moeda..."}
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput 
                        placeholder="Buscar moeda..." 
                        value={searchTerm}
                        onValueChange={setSearchTerm}
                      />
                      <CommandList className="max-h-[200px]">
                        {coinsLoading ? (
                          <CommandEmpty>
                            <div className="flex items-center gap-2 py-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Carregando moedas...
                            </div>
                          </CommandEmpty>
                        ) : coinsError ? (
                          <CommandEmpty>
                            <div className="flex flex-col items-center gap-2 py-2">
                              <span className="text-sm text-red-600">Erro ao carregar moedas</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={refetch}
                                className="h-6 text-xs"
                              >
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Tentar novamente
                              </Button>
                            </div>
                          </CommandEmpty>
                        ) : allCoins.length === 0 ? (
                          <CommandEmpty>Nenhuma moeda encontrada</CommandEmpty>
                        ) : (
                          <>
                            {usedCoins.length > 0 && (
                              <CommandGroup heading="Moedas já utilizadas">
                                {usedCoins.map(coin => (
                                  <CommandItem
                                    key={`used-${coin.symbol}`}
                                    value={coin.symbol}
                                    onSelect={() => handleCoinSelect(coin.symbol)}
                                    className="cursor-pointer"
                                  >
                                    <Check
                                      className={`mr-2 h-4 w-4 ${formData.symbol.toUpperCase() === coin.symbol ? "opacity-100" : "opacity-0"}`}
                                    />
                                    <div className="flex items-center gap-2">
                                      <Badge variant="secondary" className="text-xs">
                                        {coin.symbol}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">Já usado</span>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            )}
                            
                            <CommandGroup heading={searchTerm ? "Resultados da busca" : "Top criptomoedas"}>
                              {filteredCoins.map(coin => (
                                <CommandItem
                                  key={`api-${coin.symbol}`}
                                  value={`${coin.symbol} ${coin.name}`}
                                  onSelect={() => handleCoinSelect(coin.symbol)}
                                  className="cursor-pointer"
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 ${formData.symbol.toUpperCase() === coin.symbol ? "opacity-100" : "opacity-0"}`}
                                  />
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs font-mono">
                                      {coin.symbol}
                                    </Badge>
                                    <span className="text-sm truncate">{coin.name}</span>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </>
                        )}
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
                  className={`mt-2 bg-gray-50 border-gray-200 ${errors.symbol ? 'border-red-500' : ''}`}
                  maxLength={10}
                />
                {errors.symbol && (
                  <p className="text-xs text-red-500 mt-1">Símbolo é obrigatório</p>
                )}
              </div>

              <div>
                <Label htmlFor="quantity" className="text-sm font-medium">
                  Quantidade *
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
                  className={`bg-gray-50 border-gray-200 ${errors.quantity ? 'border-red-500' : ''}`}
                />
                {errors.quantity && (
                  <p className="text-xs text-red-500 mt-1">Quantidade deve ser maior que zero</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Até 8 casas decimais
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Storage Information */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Wallet className="h-4 w-4" />
              Custódia e Armazenamento
            </div>
            
            <div>
              <Label htmlFor="wallet" className="text-sm font-medium">
                Corretora / Wallet
              </Label>
              <Input
                id="wallet"
                name="wallet"
                value={formData.wallet}
                onChange={handleChange}
                placeholder="ex: Binance, MetaMask, Ledger"
                className="bg-gray-50 border-gray-200"
              />
            </div>
          </div>

          <Separator />

          {/* Additional Information */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <FileText className="h-4 w-4" />
              Informações Adicionais
            </div>
            
            <div>
              <Label htmlFor="notes" className="text-sm font-medium">
                Observações
              </Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Informações adicionais sobre a criptomoeda (opcional)"
                className="min-h-[50px] bg-gray-50 border-gray-200"
              />
            </div>
          </div>

          {/* Info Alert */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Atualização automática de preços</p>
                <p className="text-xs">
                  Os preços das criptomoedas são atualizados automaticamente a cada 5 minutos usando dados de mercado em tempo real.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-[#EE680D] hover:bg-[#EE680D]/90">
              {crypto ? 'Atualizar Criptomoeda' : 'Adicionar Criptomoeda'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CryptoModal;
