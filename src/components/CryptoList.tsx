
import React, { useState, useMemo } from 'react';
import { Asset } from '@/types/finance';
import { formatCurrency } from '@/utils/formatters';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Bitcoin, Coins, FileType, Edit, Trash2 } from 'lucide-react';
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
import { toast } from 'sonner';

interface CryptoListProps {
  assets: Asset[];
  onEditCrypto: (asset: Asset) => void;
}

const CryptoList: React.FC<CryptoListProps> = ({ assets, onEditCrypto }) => {
  const { mode } = useAppMode();
  const financeContext = mode === 'personal' ? useFinance() : useBusiness();
  const { deleteAsset } = financeContext;
  
  const [showHighValue, setShowHighValue] = useState(false);
  
  // Estados para controle do AlertDialog de confirmação
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<string | null>(null);
  
  // Filtrar apenas criptomoedas
  const cryptoAssets = useMemo(() => {
    return assets.filter(asset => asset.type === 'Cripto');
  }, [assets]);
  
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
    a.setAttribute('download', `criptomoedas_${new Date().toISOString().split('T')[0]}.csv`);
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
          <div className="flex items-center gap-2">
            <div className="flex items-center space-x-2">
              <Switch
                id="high-value-filter"
                checked={showHighValue}
                onCheckedChange={setShowHighValue}
              />
              <label htmlFor="high-value-filter" className="text-sm">
                Mostrar apenas acima de R$ 10.000
              </label>
            </div>
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
      </CardHeader>
      <CardContent>
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
                      {formatCurrency(asset.lastPriceBrl || 0)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(asset.value)}
                    </TableCell>
                    <TableCell>{asset.wallet || '-'}</TableCell>
                    <TableCell>
                      {asset.lastUpdated ? (
                        <Badge variant="outline" className="font-normal">
                          Atualizado há {formatDistanceToNow(new Date(asset.lastUpdated), { 
                            addSuffix: false,
                            locale: ptBR
                          })}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="font-normal">Aguardando atualização</Badge>
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
