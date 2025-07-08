import React, { useState, useMemo } from 'react';
import MainLayout from '@/components/MainLayout';
import { useFinance } from '@/contexts/FinanceContext';
import { useBusiness } from '@/contexts/BusinessContext';
import { useAppMode } from '@/contexts/AppModeContext';
import { formatCurrency } from '@/utils/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Edit, Trash2, Plus, FileType, FileText, Bitcoin } from 'lucide-react';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import PatrimonyModal from '@/components/PatrimonyModal';
import CryptoModal from '@/components/CryptoModal';
import CryptoList from '@/components/CryptoList';
import { usePatrimonyHistory } from '@/hooks/usePatrimonyHistory';
import FloatingActionButton from '@/components/FloatingActionButton';
import BatchUpdateModal from '@/components/BatchUpdateModal';
import { Asset } from '@/types/finance';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este patrimônio?')) {
      deleteAsset(id);
      toast.success('Patrimônio excluído com sucesso');
    }
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
  
  // Export functions implementation
  const exportToCSV = () => {
    // Prepare data for export
    const csvHeader = 'Categoria,Nome,Valor,Data de avaliação,Segurado\n';
    const csvData = filteredAssets.map(asset => {
      const date = asset.evaluationDate ? format(new Date(asset.evaluationDate), 'dd/MM/yyyy') : 'N/A';
      const value = asset.value.toFixed(2).replace('.', ',');
      const insured = asset.insured ? 'Sim' : 'Não';
      return `${asset.type},"${asset.name}",${value},${date},${insured}`;
    }).join('\n');
    
    const csvContent = csvHeader + csvData;
    
    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `patrimonio_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Patrimônio exportado com sucesso para CSV');
  };
  
  const exportToExcel = () => {
    // Prepare data for Excel export
    let excelContent = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
    excelContent += '<head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Patrimônio</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>';
    excelContent += '<body>';
    excelContent += '<table>';
    excelContent += '<tr><th>Categoria</th><th>Nome</th><th>Valor (R$)</th><th>Data de avaliação</th><th>Segurado</th></tr>';
    
    filteredAssets.forEach(asset => {
      const date = asset.evaluationDate ? format(new Date(asset.evaluationDate), 'dd/MM/yyyy') : 'N/A';
      const value = asset.value.toFixed(2).replace('.', ',');
      const insured = asset.insured ? 'Sim' : 'Não';
      
      excelContent += `<tr>`;
      excelContent += `<td>${asset.type}</td>`;
      excelContent += `<td>${asset.name}</td>`;
      excelContent += `<td>${value}</td>`;
      excelContent += `<td>${date}</td>`;
      excelContent += `<td>${insured}</td>`;
      excelContent += `</tr>`;
    });
    
    excelContent += '</table></body></html>';
    
    // Create and download Excel file
    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `patrimonio_${new Date().toISOString().split('T')[0]}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Patrimônio exportado com sucesso para Excel');
  };
  
  const exportToPDF = () => {
    // Prepare data for PDF (HTML format)
    let pdfContent = `
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; }
          th { background-color: #f2f2f2; }
          .total { font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>Relatório de Patrimônio</h1>
        <p>Data: ${format(new Date(), 'dd/MM/yyyy')}</p>
        <table>
          <thead>
            <tr>
              <th>Categoria</th>
              <th>Nome</th>
              <th>Valor (R$)</th>
              <th>Data de avaliação</th>
              <th>Segurado</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    filteredAssets.forEach(asset => {
      const date = asset.evaluationDate ? format(new Date(asset.evaluationDate), 'dd/MM/yyyy') : 'N/A';
      const value = formatCurrency(asset.value);
      const insured = asset.insured ? 'Sim' : 'Não';
      
      pdfContent += `
        <tr>
          <td>${asset.type}</td>
          <td>${asset.name}</td>
          <td>${value}</td>
          <td>${date}</td>
          <td>${insured}</td>
        </tr>
      `;
    });
    
    pdfContent += `
          </tbody>
          <tfoot>
            <tr class="total">
              <td colspan="2">Total</td>
              <td>${formatCurrency(totalValue)}</td>
              <td colspan="2"></td>
            </tr>
          </tfoot>
        </table>
      </body>
      </html>
    `;
    
    // Create and download PDF (HTML) file
    const blob = new Blob([pdfContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `patrimonio_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Patrimônio exportado com sucesso (HTML formatado para impressão)');
  };
  
  return (
    <MainLayout>
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h1 className="text-2xl font-bold text-neutral-800 dark:text-white">Patrimônio</h1>
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={() => {
              setEditingAsset(null);
              setIsModalOpen(true);
            }}
            variant="default" 
            size="sm" 
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Adicionar Patrimônio
          </Button>
          <Button 
            onClick={() => {
              setEditingCrypto(null);
              setIsCryptoModalOpen(true);
            }}
            variant="secondary" 
            size="sm" 
            className="flex items-center gap-2 bg-[#F97316] text-black hover:bg-[#F97316]/90"
          >
            <Bitcoin className="h-4 w-4" />
            Adicionar Cripto
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Exportar
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
              <DropdownMenuItem onClick={exportToPDF} className="cursor-pointer">
                <FileText className="mr-2 h-4 w-4" />
                <span>Exportar PDF</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Summary Cards - Reduced size */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Card className="bg-neutral-50 dark:bg-card">
          <CardHeader className="pb-1 pt-3">
            <CardTitle className="text-base">Total Patrimônio</CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <p className="text-xl font-bold">{formatCurrency(totalValue)}</p>
          </CardContent>
        </Card>
        
        {/* Filters Card - Reduced size and removed minimum value filter */}
        <Card className="bg-neutral-50 dark:bg-card">
          <CardHeader className="pb-1 pt-3">
            <CardTitle className="text-base">Filtros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pb-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Categoria</label>
                <Select 
                  onValueChange={(value) => setFilters({...filters, categories: value ? [value] : []})}
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
                <Input 
                  placeholder="Digite para pesquisar" 
                  value={filters.searchText} 
                  onChange={e => setFilters({...filters, searchText: e.target.value})}
                />
              </div>
              <div className="flex items-center space-x-2">
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
      </div>
      
      {/* Crypto Assets Section */}
      <div className="mb-6">
        <CryptoList 
          assets={assets}
          onEditCrypto={handleEditCrypto}
        />
      </div>
      
      {/* Historical Chart */}
      {historyData.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Evolução Patrimonial</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => {
                    try {
                      return format(new Date(date), 'MM/yyyy');
                    } catch (e) {
                      return date;
                    }
                  }}
                />
                <YAxis 
                  tickFormatter={(value) => value.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                />
                <Tooltip 
                  formatter={(value: any) => [value.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }), 'Valor Total']}
                  labelFormatter={(label) => format(new Date(label), 'dd/MM/yyyy')}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#8884d8" 
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Valor Total"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
      
      {/* Batch Actions */}
      {selectedAssets.length > 0 && (
        <div className="flex items-center justify-between bg-muted/20 p-2 rounded-md mb-4">
          <span className="font-medium">{selectedAssets.length} itens selecionados</span>
          <Button 
            variant="outline" 
            onClick={() => setIsBatchModalOpen(true)}
            size="sm"
          >
            Atualizar valor atual
          </Button>
        </div>
      )}
      
      {/* Assets Table */}
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30px]"></TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right">Valor atual (R$)</TableHead>
              <TableHead>Data da avaliação</TableHead>
              <TableHead>Segurado?</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAssets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  Nenhum patrimônio encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredAssets.map((asset) => (
                <TableRow key={asset.id} onDoubleClick={() => handleEdit(asset)}>
                  <TableCell>
                    <Checkbox 
                      checked={selectedAssets.includes(asset.id)} 
                      onCheckedChange={() => toggleSelection(asset.id)}
                    />
                  </TableCell>
                  <TableCell>{asset.type}</TableCell>
                  <TableCell>{asset.name}</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(asset.value)}
                  </TableCell>
                  <TableCell>
                    {asset.evaluationDate 
                      ? format(new Date(asset.evaluationDate), 'dd/MM/yyyy')
                      : '-'}
                  </TableCell>
                  <TableCell>{asset.insured ? 'Sim' : 'Não'}</TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleEdit(asset)}
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDelete(asset.id)}
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
    </MainLayout>
  );
};

export default Patrimony;
