import React, { useState, useMemo } from 'react';
import MainLayout from '@/components/MainLayout';
import { useFinance } from '@/contexts/FinanceContext';
import { useBusiness } from '@/contexts/BusinessContext';
import { useAppMode } from '@/contexts/AppModeContext';
import { formatCurrency, formatDateToDB } from '@/utils/formatters';
import { generateCSV, generateExcelHTML, downloadFile } from '@/utils/exportUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  Edit, 
  Trash2, 
  Plus, 
  FileType, 
  FileText, 
  Bitcoin, 
  Building2, 
  Car, 
  TrendingUp, 
  Shield, 
  ShieldOff,
  Search,
  Filter,
  BarChart3,
  Wallet,
  PieChart
} from 'lucide-react';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart as RechartsPieChart, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import PatrimonyModal from '@/components/PatrimonyModal';
import CryptoModal from '@/components/CryptoModal';
import CryptoList from '@/components/CryptoList';
import { usePatrimonyHistory } from '@/hooks/usePatrimonyHistory';
import FloatingActionButton from '@/components/FloatingActionButton';
import BatchUpdateModal from '@/components/BatchUpdateModal';
import { Asset } from '@/types/finance';
import { TooltipProvider } from '@/components/ui/tooltip';
import TooltipHelper from '@/components/TooltipHelper';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const COLORS = ['#EE680D', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

const Patrimony: React.FC = () => {
  const { mode } = useAppMode();
  const financeContext = mode === 'personal' ? useFinance() : useBusiness();
  const { assets, deleteAsset } = financeContext;
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCryptoModalOpen, setIsCryptoModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [editingCrypto, setEditingCrypto] = useState<Asset | null>(null);
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);
  const [filters, setFilters] = useState({
    uninsuredOnly: false,
    categories: [] as string[],
    searchText: '',
  });

  // Get patrimony history data
  const { historyData } = usePatrimonyHistory(assets);
  
  // Calculate total patrimony value
  const totalValue = useMemo(() => 
    assets.reduce((sum, asset) => sum + asset.value, 0), 
  [assets]);
  
  // Handle edit action
  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setIsModalOpen(true);
  };

  const handleEditCrypto = (asset: Asset) => {
    setEditingCrypto(asset);
    setIsCryptoModalOpen(true);
  };
  
  // Handle delete action with confirmation
  const handleDelete = (assetId: string) => {
    deleteAsset(assetId);
    setAssetToDelete(null);
    toast.success('Patrimônio excluído com sucesso');
  };

  const confirmDeleteAsset = (asset: Asset) => {
    setAssetToDelete(asset);
  };
  
  // Toggle selection for batch operations
  const toggleSelection = (id: string) => {
    setSelectedAssets(prev => 
      prev.includes(id) 
        ? prev.filter(assetId => assetId !== id) 
        : [...prev, id]
    );
  };

  // Filtrar ativos que não são criptomoedas para exibição na tabela principal
  const nonCryptoAssets = useMemo(() => {
    return assets.filter(asset => asset.type !== 'Cripto');
  }, [assets]);
  
  // Apply filters to assets
  const filteredAssets = useMemo(() => {
    return nonCryptoAssets.filter(asset => {
      // Apply insurance filter
      if (filters.uninsuredOnly && asset.insured) return false;
      
      // Apply category filter if any selected
      if (filters.categories.length > 0 && !filters.categories.includes(asset.type)) return false;
      
      // Apply text search if any
      if (filters.searchText && !asset.name.toLowerCase().includes(filters.searchText.toLowerCase())) return false;
      
      return true;
    });
  }, [nonCryptoAssets, filters]);

  // Calculate category distribution for pie chart
  const categoryData = useMemo(() => {
    const categoryTotals = filteredAssets.reduce((acc, asset) => {
      acc[asset.type] = (acc[asset.type] || 0) + asset.value;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryTotals).map(([name, value]) => ({
      name,
      value,
      percentage: ((value / totalValue) * 100).toFixed(1)
    }));
  }, [filteredAssets, totalValue]);

  // Calculate insurance stats
  const insuranceStats = useMemo(() => {
    const insured = filteredAssets.filter(asset => asset.insured);
    const uninsured = filteredAssets.filter(asset => !asset.insured);
    const insuredValue = insured.reduce((sum, asset) => sum + asset.value, 0);
    const uninsuredValue = uninsured.reduce((sum, asset) => sum + asset.value, 0);
    
    return {
      insuredCount: insured.length,
      uninsuredCount: uninsured.length,
      insuredValue,
      uninsuredValue,
      insuredPercentage: totalValue > 0 ? (insuredValue / totalValue) * 100 : 0
    };
  }, [filteredAssets, totalValue]);
  
  // Export functions implementation
  const exportToCSV = () => {
    // Sort assets by evaluation date
    const sortedAssets = [...filteredAssets].sort((a, b) => {
      const dateA = a.evaluationDate ? new Date(a.evaluationDate).getTime() : 0;
      const dateB = b.evaluationDate ? new Date(b.evaluationDate).getTime() : 0;
      return dateA - dateB;
    });
    
    const headers = ['Categoria', 'Nome', 'Valor', 'Data de avaliação', 'Segurado'];
    const rows = sortedAssets.map(asset => {
      const date = asset.evaluationDate ? format(new Date(asset.evaluationDate), 'dd/MM/yyyy') : 'N/A';
      const value = asset.value.toFixed(2).replace('.', ',');
      const insured = asset.insured ? 'Sim' : 'Não';
      return [asset.type, asset.name, value, date, insured];
    });
    
    const csvContent = generateCSV(headers, rows);
    downloadFile(csvContent, `patrimonio_${formatDateToDB(new Date())}.csv`, 'text/csv;charset=utf-8;');
    
    toast.success('Patrimônio exportado com sucesso para CSV');
  };
  
  const exportToExcel = () => {
    // Sort assets by evaluation date
    const sortedAssets = [...filteredAssets].sort((a, b) => {
      const dateA = a.evaluationDate ? new Date(a.evaluationDate).getTime() : 0;
      const dateB = b.evaluationDate ? new Date(b.evaluationDate).getTime() : 0;
      return dateA - dateB;
    });
    
    const headers = ['Categoria', 'Nome', 'Valor (R$)', 'Data de avaliação', 'Segurado'];
    const rows = sortedAssets.map(asset => {
      const date = asset.evaluationDate ? format(new Date(asset.evaluationDate), 'dd/MM/yyyy') : 'N/A';
      const value = asset.value.toFixed(2).replace('.', ',');
      const insured = asset.insured ? 'Sim' : 'Não';
      return [asset.type, asset.name, value, date, insured];
    });
    
    const excelContent = generateExcelHTML('Patrimônio', headers, rows);
    downloadFile(excelContent, `patrimonio_${formatDateToDB(new Date())}.xls`, 'application/vnd.ms-excel');
    
    toast.success('Patrimônio exportado com sucesso para Excel');
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Imóveis': return <Building2 className="h-4 w-4" />;
      case 'Veículos': return <Car className="h-4 w-4" />;
      case 'Investimentos Financeiros': return <TrendingUp className="h-4 w-4" />;
      default: return <Wallet className="h-4 w-4" />;
    }
  };
  
  return (
    <MainLayout>
      <TooltipProvider>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
                <Wallet className="h-6 w-6 text-[#EE680D]" />
                Patrimônio
              </h1>
              <p className="text-muted-foreground mt-1">
                Gerencie e acompanhe seus bens e investimentos
              </p>
            </div>
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full sm:w-auto">
              <TooltipHelper content="Adicionar novo patrimônio">
                <Button 
                  onClick={() => {
                    setEditingAsset(null);
                    setIsModalOpen(true);
                  }}
                  className="flex items-center justify-center gap-2 bg-[#EE680D] hover:bg-[#EE680D]/90 w-full sm:w-auto whitespace-nowrap"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Adicionar Patrimônio</span>
                  <span className="sm:hidden">Patrimônio</span>
                </Button>
              </TooltipHelper>
              <TooltipHelper content="Adicionar criptomoeda">
                <Button 
                  onClick={() => {
                    setEditingCrypto(null);
                    setIsCryptoModalOpen(true);
                  }}
                  variant="secondary" 
                  className="flex items-center justify-center gap-2 border-2 border-orange-500 w-full sm:w-auto whitespace-nowrap"
                >
                  <Bitcoin className="h-4 w-4" />
                  <span className="hidden sm:inline">Adicionar Cripto</span>
                  <span className="sm:hidden">Cripto</span>
                </Button>
              </TooltipHelper>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center justify-center gap-2 w-full sm:w-auto whitespace-nowrap">
                    <FileText className="h-4 w-4" />
                    <span className="hidden sm:inline">Exportar</span>
                    <span className="sm:hidden">Export</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={exportToCSV} className="cursor-pointer">
                    <FileText className="mr-2 h-4 w-4" />
                    <span>Exportar CSV</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportToExcel} className="cursor-pointer">
                    <FileType className="mr-2 h-4 w-4" />
                    <span>Exportar Excel</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Wallet className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Patrimônio</p>
                    <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Itens</p>
                    <p className="text-2xl font-bold">{filteredAssets.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Shield className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Segurados</p>
                    <p className="text-2xl font-bold">{insuranceStats.insuredCount}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(insuranceStats.insuredValue)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <ShieldOff className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Não Segurados</p>
                    <p className="text-2xl font-bold">{insuranceStats.uninsuredCount}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(insuranceStats.uninsuredValue)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Categoria</label>
                  <Select 
                    onValueChange={(value) => setFilters({...filters, categories: value === 'all' ? [] : [value]})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="Imóveis">Imóveis</SelectItem>
                      <SelectItem value="Veículos">Veículos</SelectItem>
                      <SelectItem value="Investimentos Financeiros">Investimentos Financeiros</SelectItem>
                      <SelectItem value="Equipamentos">Equipamentos</SelectItem>
                      <SelectItem value="Outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Pesquisar</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Digite para pesquisar" 
                      value={filters.searchText} 
                      onChange={e => setFilters({...filters, searchText: e.target.value})}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Checkbox 
                    id="uninsured" 
                    checked={filters.uninsuredOnly} 
                    onCheckedChange={(checked) => 
                      setFilters({...filters, uninsuredOnly: checked === true})}
                  />
                  <label htmlFor="uninsured" className="text-sm">
                    Apenas itens não segurados
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Crypto Assets Section */}
          <div>
            <CryptoList 
              assets={assets}
              onEditCrypto={handleEditCrypto}
            />
          </div>

          {/* Charts Section */}
          {filteredAssets.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Historical Chart */}
              {historyData.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Evolução Patrimonial
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="h-56 w-full overflow-hidden relative">
                      <ChartContainer 
                        config={{
                          total: {
                            label: "Patrimônio Total",
                            color: "hsl(var(--primary))",
                          },
                        }}
                        className="absolute inset-0"
                      >
                        <LineChart 
                          data={historyData}
                          margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="date" 
                            tickLine={false}
                            axisLine={false}
                            fontSize={11}
                            tickFormatter={(date) => {
                              try {
                                return format(new Date(date), 'MM/yy');
                              } catch (e) {
                                return date;
                              }
                            }}
                          />
                          <YAxis 
                            tickLine={false}
                            axisLine={false}
                            fontSize={11}
                            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                          />
                          <ChartTooltip 
                            cursor={false}
                            content={<ChartTooltipContent 
                              formatter={(value: any) => [value.toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              }), 'Patrimônio Total']}
                            />}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="value" 
                            stroke="var(--color-total)" 
                            strokeWidth={2}
                            dot={{ r: 3, strokeWidth: 1 }}
                            activeDot={{ r: 5, strokeWidth: 2 }}
                            name="Valor Total"
                          />
                        </LineChart>
                      </ChartContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Category Distribution */}
              {categoryData.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <PieChart className="h-5 w-5" />
                      Distribuição por Categoria
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {categoryData.map((category, index) => (
                        <div key={category.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(category.name)}
                            <span className="text-sm font-medium">{category.name}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold">{formatCurrency(category.value)}</div>
                            <div className="text-xs text-muted-foreground">{category.percentage}%</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Batch Actions */}
          {selectedAssets.length > 0 && (
            <Card className="border-[#EE680D]/20 bg-[#EE680D]/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{selectedAssets.length} itens selecionados</span>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsBatchModalOpen(true)}
                    size="sm"
                  >
                    Atualizar valor atual
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Assets Grid */}
          {filteredAssets.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 bg-muted rounded-full">
                    <Wallet className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Nenhum patrimônio encontrado</h3>
                    <p className="text-muted-foreground mb-4">
                      Comece adicionando seus bens e investimentos para acompanhar seu patrimônio.
                    </p>
                    <TooltipHelper content="Adicionar primeiro patrimônio">
                      <Button onClick={() => setIsModalOpen(true)} className="bg-[#EE680D] hover:bg-[#EE680D]/90">
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar primeiro patrimônio
                      </Button>
                    </TooltipHelper>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAssets.map((asset) => (
                <Card key={asset.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Checkbox 
                            checked={selectedAssets.includes(asset.id)} 
                            onCheckedChange={() => toggleSelection(asset.id)}
                          />
                          {getCategoryIcon(asset.type)}
                          <Badge variant="secondary">{asset.type}</Badge>
                        </div>
                        <CardTitle className="text-lg">{asset.name}</CardTitle>
                      </div>
                      <div className="flex gap-1">
                        <TooltipHelper content="Editar patrimônio">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(asset)}
                            className="h-8 w-8 p-0 hover:bg-muted"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TooltipHelper>
                        <TooltipHelper content="Excluir patrimônio">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => confirmDeleteAsset(asset)}
                            className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipHelper>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Valor atual</span>
                        <span className="text-lg font-bold text-green-600">{formatCurrency(asset.value)}</span>
                      </div>
                      
                      {asset.acquisitionValue && asset.acquisitionValue > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Valor de aquisição</span>
                          <span className="text-sm font-medium">{formatCurrency(asset.acquisitionValue)}</span>
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Avaliação</span>
                        <span className="font-medium">
                          {asset.evaluationDate 
                            ? format(new Date(asset.evaluationDate), 'dd/MM/yyyy')
                            : 'Não informado'}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Seguro</span>
                        <div className="flex items-center gap-1">
                          {asset.insured ? (
                            <>
                              <Shield className="h-4 w-4 text-green-600" />
                              <span className="text-green-600 font-medium">Sim</span>
                            </>
                          ) : (
                            <>
                              <ShieldOff className="h-4 w-4 text-red-600" />
                              <span className="text-red-600 font-medium">Não</span>
                            </>
                          )}
                        </div>
                      </div>

                      {asset.location && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Local</span>
                          <span className="font-medium text-right max-w-[150px] truncate">{asset.location}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
        
        {/* Modals */}
        <PatrimonyModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          asset={editingAsset}
        />
        
        <CryptoModal
          open={isCryptoModalOpen}
          onOpenChange={setIsCryptoModalOpen}
          crypto={editingCrypto}
        />
        
        <BatchUpdateModal
          open={isBatchModalOpen}
          onOpenChange={setIsBatchModalOpen}
          selectedAssets={selectedAssets}
          onClearSelection={() => setSelectedAssets([])}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!assetToDelete} onOpenChange={() => setAssetToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-destructive" />
                Excluir Patrimônio
              </AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o patrimônio "{assetToDelete?.name}"?
                <br />
                <span className="text-sm text-muted-foreground mt-2 block">
                  Esta ação não pode ser desfeita. Todos os dados relacionados a este patrimônio serão perdidos permanentemente.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => assetToDelete && handleDelete(assetToDelete.id)}
                className="bg-destructive hover:bg-destructive/90"
              >
                Excluir Patrimônio
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TooltipProvider>
    </MainLayout>
  );
};

export default Patrimony;
