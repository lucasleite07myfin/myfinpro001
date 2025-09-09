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
import { useCryptoPrice } from '@/hooks/useCryptoPrice';
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
  
  // Hook para buscar preço individual da moeda selecionada
  const selectedCoinId = React.useMemo(() => {
    return coins.find(coin => coin.symbol === formData.symbol.toUpperCase())?.id || null;
  }, [coins, formData.symbol]);
  
  const { price: selectedCoinPrice, loading: priceLoading } = useCryptoPrice(selectedCoinId);

  const [errors, setErrors] = useState({
    symbol: false,
    quantity: false,
  });

  const [openCoinSelector, setOpenCoinSelector] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Referência para detectar cliques fora do dropdown
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  
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
    if (!searchTerm) return coins.slice(0, 100); // Mostrar as top 100 inicialmente
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    return coins.filter(coin => 
      coin.symbol.toLowerCase().includes(lowerSearchTerm) ||
      coin.name.toLowerCase().includes(lowerSearchTerm)
    ).slice(0, 150); // Limitar a 150 resultados na busca
  }, [coins, searchTerm]);

  // Filtrar moedas da API para remover as que já estão em uso
  const availableApiCoins = React.useMemo(() => {
    const usedSymbols = new Set(usedCoins.map(coin => coin.symbol.toUpperCase()));
    return filteredCoins.filter(coin => !usedSymbols.has(coin.symbol.toUpperCase()));
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

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenCoinSelector(false);
      }
    };

    if (openCoinSelector) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openCoinSelector]);

  const validateForm = () => {
    const quantityValue = typeof formData.quantity === 'string' ? parseFloat(formData.quantity) : formData.quantity;
    const newErrors = {
      symbol: !formData.symbol.trim(),
      quantity: !quantityValue || quantityValue <= 0,
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
      const finalQuantity = typeof formData.quantity === 'string' ? parseFloat(formData.quantity) : formData.quantity;
      const name = `${formData.symbol.toUpperCase()} (${finalQuantity})`;

      if (existingCrypto) {
        // Atualizar quantidade da criptomoeda existente
        const updatedQuantity = existingCrypto.quantity! + finalQuantity;
        
        const newTotalValue = updatedQuantity * currentPrice;
        editAsset({
          ...existingCrypto,
          name: `${existingCrypto.symbol?.toUpperCase()} (${updatedQuantity})`,
          quantity: updatedQuantity,
          value: newTotalValue,
          lastPriceBrl: currentPrice,
          lastUpdated: new Date(),
          evaluationDate: new Date(),
        });
        
        toast.success(`${formData.symbol.toUpperCase()} atualizado para ${updatedQuantity}`);
      } else if (crypto) {
        // Atualizar criptomoeda existente
        editAsset({
          ...crypto,
          name,
          symbol: formData.symbol.toUpperCase(),
          quantity: finalQuantity,
          value: estimatedValue,
          lastPriceBrl: currentPrice,
          lastUpdated: new Date(),
          wallet: formData.wallet,
          notes: formData.notes,
          evaluationDate: formData.evaluationDate,
        });
        toast.success('Criptomoeda atualizada com sucesso');
      } else {
        // Adicionar nova criptomoeda
        addAsset({
          name,
          type: 'Cripto',
          symbol: formData.symbol.toUpperCase(),
          quantity: finalQuantity,
          value: estimatedValue, // Valor total (quantidade * preço)
          lastPriceBrl: currentPrice, // Preço unitário atual
          lastUpdated: new Date(), // Data da última atualização
          wallet: formData.wallet,
          evaluationDate: new Date(),
          insured: false,
          notes: formData.notes,
        });
        toast.success(`${formData.symbol.toUpperCase()} adicionada com sucesso!`);
      }
      onOpenChange(false);
      
      // Mostra toast informativo sobre o preço
      if (currentPrice > 0) {
        toast.info(`Preço atual: R$ ${currentPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, {
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Error saving crypto asset:', error);
      toast.error('Erro ao salvar criptomoeda');
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      // Permitir valores vazios para edição
      if (value === '') {
        setFormData({
          ...formData,
          [name]: value
        });
      } else {
        const numericValue = parseFloat(value);
        setFormData({
          ...formData,
          [name]: Number.isNaN(numericValue) ? 0 : numericValue,
        });
      }
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleCoinSelect = (coin: string) => {
    const selectedSymbol = coin.toUpperCase();
    setFormData({
      ...formData,
      symbol: selectedSymbol
    });
    setOpenCoinSelector(false);
    setSearchTerm(selectedSymbol);
  };

  // Calculate estimated value for preview
  const currentPrice = selectedCoinPrice?.current_price || crypto?.value || 0;
  const quantityValue = typeof formData.quantity === 'string' ? parseFloat(formData.quantity) || 0 : formData.quantity;
  const estimatedValue = quantityValue * currentPrice;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto">
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
          {(formData.symbol || quantityValue > 0) && (
            <Card className="bg-gradient-to-r from-[#EE680D]/10 to-[#EE680D]/5 border-[#EE680D]/20">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Bitcoin className="h-4 w-4" />
                  <span className="text-sm font-medium text-[#EE680D]">Prévia</span>
                  <Badge variant="secondary">Cripto</Badge>
                </div>
                <h3 className="font-semibold mb-2">
                  {formData.symbol ? `${formData.symbol.toUpperCase()} (${quantityValue})` : 'Criptomoeda'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Quantidade:</span>
                    <span className="font-medium">{quantityValue.toFixed(8)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Símbolo:</span>
                    <span className="font-medium">{formData.symbol.toUpperCase() || 'N/A'}</span>
                  </div>
                  {currentPrice > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Valor estimado:</span>
                        <span className="font-medium text-green-600">
                          R$ {estimatedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Preço atual:</span>
                        <div className="flex flex-col items-end">
                          <span className="font-medium">
                            {priceLoading ? (
                              <div className="flex items-center gap-1">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                <span className="text-xs">Atualizando...</span>
                              </div>
                            ) : (
                              `R$ ${currentPrice.toLocaleString('pt-BR', { 
                                minimumFractionDigits: 2,
                                maximumFractionDigits: currentPrice < 1 ? 6 : 2
                              })}`
                            )}
                          </span>
                          {selectedCoinPrice?.price_change_percentage_24h !== undefined && (
                            <span className={`text-xs ${selectedCoinPrice.price_change_percentage_24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {selectedCoinPrice.price_change_percentage_24h >= 0 ? '+' : ''}
                              {selectedCoinPrice.price_change_percentage_24h.toFixed(2)}% (24h)
                            </span>
                          )}
                        </div>
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
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="symbol" className="text-sm font-medium">
                  Símbolo da moeda *
                </Label>
                <div className="relative" ref={dropdownRef}>
                  <Input
                    id="symbol"
                    name="symbol"
                    value={formData.symbol}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase();
                      setFormData({
                        ...formData,
                        symbol: value
                      });
                      setSearchTerm(value);
                      setOpenCoinSelector(value.length > 0);
                    }}
                    onFocus={() => {
                      if (formData.symbol.length > 0) {
                        setSearchTerm(formData.symbol);
                        setOpenCoinSelector(true);
                      }
                    }}
                    placeholder="Digite o símbolo (ex: BTC, ETH, DOT)"
                    className={`bg-gray-50 border-gray-200 ${errors.symbol ? 'border-red-500' : ''}`}
                    maxLength={10}
                  />
                  
                  {/* Dropdown com sugestões */}
                  {openCoinSelector && (searchTerm.length > 0 || usedCoins.length > 0) && (
                    <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-60 sm:max-h-80 overflow-y-auto">
                      {coinsLoading ? (
                        <div className="flex items-center gap-2 p-3">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm text-gray-600">Carregando moedas...</span>
                        </div>
                      ) : coinsError ? (
                        <div className="p-3 text-center">
                          <p className="text-sm text-red-600 mb-2">Erro ao carregar moedas</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={refetch}
                            className="h-8 text-xs"
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Tentar novamente
                          </Button>
                        </div>
                      ) : (
                        <>
                          {/* Moedas já utilizadas */}
                          {usedCoins.length > 0 && searchTerm.length === 0 && (
                            <div className="border-b border-gray-100">
                              <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50">
                                Moedas já utilizadas
                              </div>
                              {usedCoins.map(coin => (
                                <div
                                  key={`used-${coin.symbol}`}
                                  onClick={() => handleCoinSelect(coin.symbol)}
                                  className="px-3 py-2 hover:bg-blue-50 cursor-pointer flex items-center gap-2"
                                >
                                  <Badge variant="secondary" className="text-xs">
                                    {coin.symbol}
                                  </Badge>
                                  <span className="text-xs text-gray-500">Já usado</span>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Moedas da API filtradas */}
                          {availableApiCoins.length > 0 && (
                            <div>
                              {(usedCoins.length > 0 && searchTerm.length === 0) && (
                                <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50">
                                  Top criptomoedas
                                </div>
                              )}
                              {availableApiCoins.slice(0, 50).map(coin => (
                                <div
                                  key={`api-${coin.symbol}`}
                                  onClick={() => handleCoinSelect(coin.symbol)}
                                  className="px-3 py-2 hover:bg-blue-50 cursor-pointer flex items-center justify-between"
                                >
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs font-mono">
                                      {coin.symbol}
                                    </Badge>
                                    <span className="text-sm text-gray-700 truncate">{coin.name}</span>
                                  </div>
                                  {coin.current_price && (
                                    <div className="flex flex-col items-end text-xs">
                                      <span className="font-medium text-gray-900">
                                        R$ {coin.current_price.toLocaleString('pt-BR', { 
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: coin.current_price < 1 ? 6 : 2 
                                        })}
                                      </span>
                                      {coin.price_change_24h !== undefined && (
                                        <span className={`text-xs ${coin.price_change_24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                          {coin.price_change_24h >= 0 ? '+' : ''}{coin.price_change_24h?.toFixed(2)}%
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Nenhum resultado */}
                          {availableApiCoins.length === 0 && usedCoins.length === 0 && (
                            <div className="px-3 py-6 text-center text-sm text-gray-500">
                              Nenhuma moeda encontrada
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
                
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
                <p className="font-medium mb-1">Preços em tempo real</p>
                <p className="text-xs">
                  Os preços são atualizados automaticamente usando a API do CoinGecko. 
                  Valores mostrados em Real (BRL) com variação das últimas 24 horas.
                </p>
                {selectedCoinPrice?.last_updated && (
                  <p className="text-xs mt-1 opacity-75">
                    Última atualização: {selectedCoinPrice.last_updated}
                  </p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 pt-3">
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
