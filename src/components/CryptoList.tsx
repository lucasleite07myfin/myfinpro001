
import React, { useState, useMemo } from 'react';
import { Asset } from '@/types/finance';
import { formatCurrency, formatDateToDB } from '@/utils/formatters';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Bitcoin, Coins, FileType, Edit, Trash2, RefreshCw, Clock, Wifi, WifiOff } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useFinance } from '@/contexts/FinanceContext';
import { useAppMode } from '@/contexts/AppModeContext';
import { useBusiness } from '@/contexts/BusinessContext';
import { useCryptoPriceUpdater } from '@/hooks/useCryptoPriceUpdater';
import { toast } from 'sonner';

interface CryptoListProps {
  assets: Asset[];
  onEditCrypto: (asset: Asset) => void;
}

const CryptoList: React.FC<CryptoListProps> = ({ assets, onEditCrypto }) => {
  const { mode } = useAppMode();
  const financeContext = mode === 'personal' ? useFinance() : useBusiness();
  const { deleteAsset, editAsset } = financeContext;
  
  const [showHighValue, setShowHighValue] = useState(false);
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(true);
  
  // Estados para controle do AlertDialog de confirmação
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<string | null>(null);
  
  // Filtrar apenas criptomoedas
  const cryptoAssets = useMemo(() => {
    return assets.filter(asset => asset.type === 'Cripto');
  }, [assets]);

  // Hook para atualização automática de preços
  const handlePriceUpdate = (assetId: string, price: number, change24h: number, lastUpdated: Date) => {
    const asset = cryptoAssets.find(a => a.id === assetId);
    if (asset && asset.quantity) {
      const newTotalValue = asset.quantity * price;
      editAsset({
        ...asset,
        value: newTotalValue,
        lastPriceBrl: price,
        lastUpdated: lastUpdated,
        // priceChange24h: change24h // Campo removido temporariamente
      });
    }
  };

  const {
    isUpdating,
    lastUpdateTime,
    error: updateError,
    manualUpdate,
    retryCount,
    maxRetries
  } = useCryptoPriceUpdater(cryptoAssets, handlePriceUpdate, {
    updateInterval: 300, // 5 minutos (300 segundos)
    enabled: autoUpdateEnabled
  });
  
  // Aplicar filtro de valor alto se ativado
  const filteredCryptos = useMemo(() => {
    if (showHighValue) {
      return cryptoAssets.filter(asset => asset.value >= 10000);
    }
    return cryptoAssets;
  }, [cryptoAssets, showHighValue]);
  
  // Calcular valor total de criptomoedas
  const totalCryptoValue = useMemo(() => {
    return cryptoAssets.reduce((sum, asset) => sum + asset.value, 0);
  }, [cryptoAssets]);

  // Função para formatar preço com precisão adequada
  const formatPriceWithPrecision = (price: number) => {
    if (price === 0) return formatCurrency(0);
    if (price < 0.01) {
      return `R$ ${price.toLocaleString('pt-BR', { 
        minimumFractionDigits: 6, 
        maximumFractionDigits: 8 
      })}`;
    } else if (price < 1) {
      return `R$ ${price.toLocaleString('pt-BR', { 
        minimumFractionDigits: 4, 
        maximumFractionDigits: 6 
      })}`;
    } else {
      return formatCurrency(price);
    }
  };
  
  // Converter dados para CSV/Excel
  const handleExport = () => {
    // Cabeçalhos
    const headers = ['Símbolo', 'Quantidade', 'Preço Atual (R$)', 'Valor Total (R$)', 'Wallet', 'Última Atualização'];
    
    // Linhas de dados
    const rows = cryptoAssets.map(asset => [
      asset.symbol || '',
      asset.quantity?.toString() || '0',
      asset.lastPriceBrl?.toFixed(2) || '0',
      asset.value.toFixed(2),
      asset.wallet || '',
      asset.lastUpdated ? new Date(asset.lastUpdated).toLocaleString() : '-'
    ]);
    
    // Combinar em CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Criar blob e link para download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `criptomoedas_${formatDateToDB(new Date())}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast.success('Relatório exportado com sucesso');
  };
  
  // Excluir criptomoeda
  const handleDelete = (id: string) => {
    setAssetToDelete(id);
    setDeleteDialogOpen(true);
  };
  
  const confirmDelete = () => {
    if (!assetToDelete) return;
    
    deleteAsset(assetToDelete);
    toast.success('Criptomoeda excluída com sucesso');
    
    // Reset state
    setDeleteDialogOpen(false);
    setAssetToDelete(null);
  };
  
  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setAssetToDelete(null);
  };
  
  // Se não houver criptomoedas, exibir mensagem
  if (cryptoAssets.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bitcoin className="h-5 w-5" />
            Carteira de Criptomoedas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Coins className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>Você ainda não adicionou nenhuma criptomoeda</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <>
      <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bitcoin className="h-5 w-5" />
            Carteira de Criptomoedas
            <Badge variant="secondary" className="ml-2">
              {formatCurrency(totalCryptoValue)}
            </Badge>
          </CardTitle>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <div className="flex items-center gap-2">
              
              <Button 
                size="sm"
                variant="outline" 
                onClick={handleExport}
                className="flex items-center gap-1"
              >
                <FileType className="h-4 w-4" />
                Exportar
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Status da atualização */}
        <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {lastUpdateTime ? (
              <span>
                Última atualização: {formatDistanceToNow(lastUpdateTime, { 
                  addSuffix: true, 
                  locale: ptBR 
                })}
              </span>
            ) : (
              <span>Aguardando primeira atualização...</span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {updateError && retryCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                Erro - Tentativa {retryCount}/{maxRetries}
              </Badge>
            )}
            {isUpdating && (
              <Badge variant="secondary" className="text-xs">
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                Atualizando preços...
              </Badge>
            )}
            {autoUpdateEnabled && !isUpdating && (
              <Badge variant="outline" className="text-xs">
                <Wifi className="h-3 w-3 mr-1" />
                Automático (5min)
              </Badge>
            )}
          </div>
        </div>
        
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Símbolo</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead className="text-right">Preço Atual (R$)</TableHead>
                <TableHead className="text-right">Valor Total (R$)</TableHead>
                <TableHead>Wallet</TableHead>
                <TableHead>Última Atualização</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCryptos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                    Nenhuma criptomoeda encontrada com os filtros atuais
                  </TableCell>
                </TableRow>
              ) : (
                filteredCryptos.map((asset) => (
                  <TableRow 
                    key={asset.id} 
                    onClick={() => onEditCrypto(asset)}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-1.5">
                        <Coins className="h-4 w-4" />
                        {asset.symbol}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">
                      {asset.quantity?.toFixed(8)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      <div className="flex flex-col items-end">
                        <span>{formatPriceWithPrecision(asset.lastPriceBrl || 0)}</span>
                        {(asset as any).priceChange24h !== undefined && (
                          <span className={`text-xs ${(asset as any).priceChange24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {(asset as any).priceChange24h >= 0 ? '+' : ''}
                            {(asset as any).priceChange24h.toFixed(2)}% (24h)
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      <Badge variant="outline" className="bg-green-50 border-green-200 text-green-800 font-medium">
                        {formatCurrency(asset.value)}
                      </Badge>
                    </TableCell>
                    <TableCell>{asset.wallet || '-'}</TableCell>
                    <TableCell>
                      {asset.lastUpdated ? (
                        <div className="flex flex-col gap-1">
                          <Badge variant="outline" className="font-normal text-xs">
                            {formatDistanceToNow(new Date(asset.lastUpdated), { 
                              addSuffix: true,
                              locale: ptBR
                            })}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(asset.lastUpdated).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })}
                          </span>
                        </div>
                      ) : (
                        <Badge variant="outline" className="font-normal text-yellow-600">
                          Aguardando atualização
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditCrypto(asset);
                          }}
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(asset.id);
                          }}
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      </Card>
      
      {/* Alert Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta <strong>criptomoeda</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDelete}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CryptoList;
