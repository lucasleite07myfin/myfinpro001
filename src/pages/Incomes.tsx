import React, { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { useBusiness } from '@/contexts/BusinessContext';
import { useAppMode } from '@/contexts/AppModeContext';
import MainLayout from '@/components/MainLayout';
import EmptyState from '@/components/EmptyState';
import TransactionsTable from '@/components/TransactionsTable';
import MonthSelector from '@/components/MonthSelector';
import AddTransactionModal from '@/components/AddTransactionModal';
import { formatCurrency, formatCategoryForDisplay } from '@/utils/formatters';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
  FileText, 
  FileSpreadsheet, 
  ChevronDown, 
  TrendingUp, 
  DollarSign, 
  Calendar,
  Search,
  Filter,
  Download,
  Plus,
  BarChart3,
  Trash2
} from 'lucide-react';
import { INCOME_CATEGORIES, FinanceContextType, BusinessContextType, Transaction } from '@/types/finance';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { TooltipProvider } from '@/components/ui/tooltip';
import TooltipHelper from '@/components/TooltipHelper';

const Incomes: React.FC = () => {
  const { mode } = useAppMode();
  // Use either finance or business context based on current mode
  const financeContext = mode === 'personal' ? useFinance() : useBusiness();
  const { transactions, currentMonth, setCurrentMonth, deleteTransaction, customCategories } = financeContext as FinanceContextType | BusinessContextType;
  
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Get all income categories including custom ones
  const getAllIncomeCategories = () => {
    const userCustomCategories = customCategories?.income || [];
    return [...userCustomCategories, ...INCOME_CATEGORIES.filter(cat => cat !== 'Crie sua categoria')];
  };
  
  // Filter only income transactions
  const incomeTransactions = transactions.filter(t => t.type === 'income');
  
  // Filter income transactions for current month
  let currentMonthIncomes = incomeTransactions.filter(t => {
    const transactionMonth = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
    return transactionMonth === currentMonth;
  });

  // Apply filter by category, if selected
  if (filterCategory && filterCategory !== 'all') {
    currentMonthIncomes = currentMonthIncomes.filter(t => {
      // Handle both regular categories and custom categories with prefixes
      if (t.category.startsWith('Crie sua categoria: ') || t.category.startsWith('Outros: ')) {
        if (filterCategory.startsWith('Crie sua categoria: ') || filterCategory.startsWith('Outros: ')) {
          return t.category === filterCategory;
        }
        return false;
      }
      return t.category === filterCategory;
    });
  }

  // Apply filter by search term
  if (searchTerm) {
    currentMonthIncomes = currentMonthIncomes.filter(t => 
      t.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  // Calculate total income for the month
  const totalIncome = currentMonthIncomes.reduce((sum, t) => sum + t.amount, 0);

  // Calculate statistics
  const stats = {
    totalTransactions: currentMonthIncomes.length,
    averageTransaction: currentMonthIncomes.length > 0 ? totalIncome / currentMonthIncomes.length : 0,
    categoriesCount: new Set(currentMonthIncomes.map(t => t.category)).size,
    highestTransaction: currentMonthIncomes.length > 0 ? Math.max(...currentMonthIncomes.map(t => t.amount)) : 0,
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactionToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (transactionToDelete) {
      deleteTransaction(transactionToDelete);
      toast.success("Receita excluída com sucesso!");
    }
    setDeleteDialogOpen(false);
    setTransactionToDelete(null);
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setTransactionToDelete(null);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsEditModalOpen(true);
  };

  const exportToCSV = () => {
    setIsLoading(true);
    // Preparar dados para exportação
    const csvHeader = 'Data,Descrição,Categoria,Valor\n';
    const csvData = currentMonthIncomes.map(income => {
      const date = income.date.toLocaleDateString('pt-BR');
      const amount = income.amount.toFixed(2).replace('.', ',');
      return `${date},"${income.description}",${formatCategoryForDisplay(income.category)},${amount}`;
    }).join('\n');
    
    const csvContent = csvHeader + csvData;
    
    // Criar e fazer download do arquivo CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `receitas_${currentMonth}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Arquivo CSV exportado com sucesso!");
    setIsLoading(false);
  };

  const exportToExcel = () => {
    setIsLoading(true);
    // Preparar os dados para exportação
    let excelContent = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
    excelContent += '<head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Receitas</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>';
    excelContent += '<body>';
    excelContent += '<table>';
    excelContent += '<tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Valor</th></tr>';
    
    currentMonthIncomes.forEach(income => {
      const date = income.date.toLocaleDateString('pt-BR');
      const amount = income.amount.toFixed(2).replace('.', ',');
      
      excelContent += `<tr>`;
      excelContent += `<td>${date}</td>`;
      excelContent += `<td>${income.description}</td>`;
      excelContent += `<td>${formatCategoryForDisplay(income.category)}</td>`;
      excelContent += `<td>${amount}</td>`;
      excelContent += `</tr>`;
    });
    
    excelContent += '</table></body></html>';
    
    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `receitas_${currentMonth}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Arquivo Excel exportado com sucesso!");
    setIsLoading(false);
  };

  const exportToPDF = () => {
    setIsLoading(true);
    // Criar uma tabela HTML que será convertida para PDF
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
        <h1>Relatório de Receitas - ${currentMonth}</h1>
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Descrição</th>
              <th>Categoria</th>
              <th>Valor</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    currentMonthIncomes.forEach(income => {
      const date = income.date.toLocaleDateString('pt-BR');
      const amount = formatCurrency(income.amount);
      
      pdfContent += `
        <tr>
          <td>${date}</td>
          <td>${income.description}</td>
          <td>${formatCategoryForDisplay(income.category)}</td>
          <td>${amount}</td>
        </tr>
      `;
    });
    
    pdfContent += `
          </tbody>
          <tfoot>
            <tr class="total">
              <td colspan="3">Total</td>
              <td>${formatCurrency(totalIncome)}</td>
            </tr>
          </tfoot>
        </table>
      </body>
      </html>
    `;
    
    const blob = new Blob([pdfContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `receitas_${currentMonth}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Arquivo PDF exportado com sucesso! (HTML formatado para impressão)");
    setIsLoading(false);
  };

  // Get all categories for the filter dropdown
  const allCategories = getAllIncomeCategories();

  return (
    <MainLayout>
      <TooltipProvider>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-[#EE680D]" />
                Receitas
              </h1>
              <p className="text-muted-foreground mt-1">
                Gerencie e acompanhe suas receitas mensais
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <MonthSelector value={currentMonth} onChange={setCurrentMonth} />
              <TooltipHelper content="Adicionar nova receita">
                <Button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex items-center justify-center gap-2 bg-[#EE680D] hover:bg-[#EE680D]/90 w-full sm:w-auto whitespace-nowrap"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Nova Receita</span>
                  <span className="sm:hidden">Nova</span>
                </Button>
              </TooltipHelper>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total do Mês</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Transações</p>
                    <p className="text-2xl font-bold">{stats.totalTransactions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Média por Transação</p>
                    <p className="text-2xl font-bold">{formatCurrency(stats.averageTransaction)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Categorias Ativas</p>
                    <p className="text-2xl font-bold">{stats.categoriesCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros e Ações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por descrição..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="w-full md:w-64">
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filtrar por categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Todas</Badge>
                          <span>Todas as categorias</span>
                        </div>
                      </SelectItem>
                      <Separator />
                      {allCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {category.startsWith('Crie sua categoria: ') || category.startsWith('Outros: ') ? 'Personalizada' : 'Padrão'}
                            </Badge>
                            <span>{formatCategoryForDisplay(category)}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" disabled={isLoading} className="w-full md:w-auto">
                      <Download className="mr-2 h-4 w-4" />
                      Exportar 
                      <ChevronDown className="ml-1 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Formatos de Exportação</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={exportToCSV} className="cursor-pointer">
                      <FileText className="mr-2 h-4 w-4" />
                      <span>Exportar CSV</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={exportToExcel} className="cursor-pointer">
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      <span>Exportar Excel</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={exportToPDF} className="cursor-pointer">
                      <FileText className="mr-2 h-4 w-4" />
                      <span>Exportar PDF</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              {/* Active Filters */}
              {(filterCategory !== 'all' || searchTerm) && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-muted-foreground">Filtros ativos:</span>
                  {filterCategory !== 'all' && (
                    <Badge variant="secondary" className="gap-1">
                      Categoria: {formatCategoryForDisplay(filterCategory)}
                      <button 
                        onClick={() => setFilterCategory('all')}
                        className="ml-1 hover:bg-muted rounded-full"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {searchTerm && (
                    <Badge variant="secondary" className="gap-1">
                      Busca: "{searchTerm}"
                      <button 
                        onClick={() => setSearchTerm('')}
                        className="ml-1 hover:bg-muted rounded-full"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Recent Income Transactions */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-neutral-800">Receitas Recentes</h2>
          {isLoading ? (
            <div className="p-6 space-y-3 bg-white rounded-lg border">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                  <Skeleton className="h-4 w-[100px]" />
                </div>
              ))}
            </div>
          ) : currentMonthIncomes.length === 0 ? (
            <EmptyState
              title="Nenhuma receita encontrada"
              description="Comece adicionando suas primeiras receitas para acompanhar seus ganhos."
              actionLabel="Adicionar Receita"
              onAction={() => setIsAddModalOpen(true)}
            />
          ) : (
            <TransactionsTable 
              transactions={[...currentMonthIncomes]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())} 
              onDelete={handleDeleteTransaction}
              onEdit={handleEditTransaction}
              type="income"
            />
          )}
        </div>

        {/* Modal de adição */}
        <AddTransactionModal
          open={isAddModalOpen}
          onOpenChange={setIsAddModalOpen}
          mode="add"
          defaultTransactionType="income"
        />

        {/* Modal de edição */}
        <AddTransactionModal
          open={isEditModalOpen}
          onOpenChange={(open) => {
            setIsEditModalOpen(open);
            if (!open) {
              setEditingTransaction(null);
            }
          }}
          initialData={editingTransaction || undefined}
          mode={editingTransaction ? 'edit' : 'add'}
          defaultTransactionType="income"
        />

        {/* Alert Dialog de confirmação de exclusão */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-destructive" />
                Excluir Receita
              </AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir esta receita?
                <br />
                <span className="text-sm text-muted-foreground mt-2 block">
                  Esta ação não pode ser desfeita. Todos os dados relacionados a esta receita serão perdidos permanentemente.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={cancelDelete}>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDelete}
                className="bg-destructive hover:bg-destructive/90"
              >
                Excluir Receita
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </TooltipProvider>
    </MainLayout>
  );
};

export default Incomes;
