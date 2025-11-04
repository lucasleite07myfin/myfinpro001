import React, { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { useBusiness } from '@/contexts/BusinessContext';
import { useAppMode } from '@/contexts/AppModeContext';
import MainLayout from '@/components/MainLayout';
import EmptyState from '@/components/EmptyState';
import TransactionsTable from '@/components/TransactionsTable';
import MonthSelector from '@/components/MonthSelector';
import AddTransactionModal from '@/components/AddTransactionModal';
import Top10ExpensesModal from '@/components/Top10ExpensesModal';
import { formatCurrency, formatCategoryForDisplay } from '@/utils/formatters';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  TrendingDown, 
  DollarSign, 
  Calendar,
  Search,
  Filter,
  Download,
  Plus,
  BarChart3,
  Target,
  TrendingUp,
  Clock,
  CreditCard,
  Trash2,
  ChevronUp,
  Repeat,
  AlertTriangle
} from 'lucide-react';
import { EXPENSE_CATEGORIES, FinanceContextType, BusinessContextType, Transaction } from '@/types/finance';
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
  AlertDialogTrigger,
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const Expenses: React.FC = () => {
  const { mode } = useAppMode();
  // Use either finance or business context based on current mode
  const financeContext = mode === 'personal' ? useFinance() : useBusiness();
  const { transactions, currentMonth, setCurrentMonth, deleteTransaction, goals, customCategories, recurringExpenses, deleteRecurringExpense } = financeContext as FinanceContextType | BusinessContextType;
  
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showSpecialTransactions, setShowSpecialTransactions] = useState<
    'all' | 'goals' | 'investments' | 'recurring' | 'regular'
  >('all');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<{ id: string; message: string } | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecurringExpensesOpen, setIsRecurringExpensesOpen] = useState(false);
  const [top10ModalOpen, setTop10ModalOpen] = useState(false);
  
  // Get all expense categories including custom ones
  const getAllExpenseCategories = () => {
    const userCustomCategories = customCategories?.expense || [];
    return [...userCustomCategories, ...EXPENSE_CATEGORIES.filter(cat => cat !== 'Crie sua categoria')];
  };
  
  // Filter only expense transactions
  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  
  // Filter expense transactions for current month
  let currentMonthExpenses = expenseTransactions.filter(t => {
    const transactionMonth = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
    return transactionMonth === currentMonth;
  });

  // Apply filter by category, if selected
  if (filterCategory && filterCategory !== 'all') {
    currentMonthExpenses = currentMonthExpenses.filter(t => {
      // Handle both regular categories and 'Outros: X' categories
      if (t.category.startsWith('Outros: ')) {
        if (filterCategory.startsWith('Outros: ')) {
          return t.category === filterCategory;
        }
        return false;
      }
      return t.category === filterCategory;
    });
  }

  // Apply filter by search term
  if (searchTerm) {
    currentMonthExpenses = currentMonthExpenses.filter(t => 
      t.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  // Apply filter by special transaction type
  if (showSpecialTransactions === 'goals') {
    currentMonthExpenses = currentMonthExpenses.filter(t => t.isGoalContribution);
  } else if (showSpecialTransactions === 'investments') {
    currentMonthExpenses = currentMonthExpenses.filter(t => t.isInvestmentContribution);
  } else if (showSpecialTransactions === 'recurring') {
    currentMonthExpenses = currentMonthExpenses.filter(t => t.isRecurringPayment);
  } else if (showSpecialTransactions === 'regular') {
    currentMonthExpenses = currentMonthExpenses.filter(t => 
      !t.isGoalContribution && !t.isInvestmentContribution && !t.isRecurringPayment
    );
  }

  // Calculate total expense for the month
  const totalExpense = currentMonthExpenses.reduce((sum, t) => sum + t.amount, 0);

  // Calculate statistics
  const stats = {
    totalTransactions: currentMonthExpenses.length,
    averageTransaction: currentMonthExpenses.length > 0 ? totalExpense / currentMonthExpenses.length : 0,
    categoriesCount: new Set(currentMonthExpenses.map(t => t.category)).size,
    highestTransaction: currentMonthExpenses.length > 0 ? Math.max(...currentMonthExpenses.map(t => t.amount)) : 0,
    goalContributions: currentMonthExpenses.filter(t => t.isGoalContribution).length,
    investments: currentMonthExpenses.filter(t => t.isInvestmentContribution).length,
    recurringPayments: currentMonthExpenses.filter(t => t.isRecurringPayment).length,
  };

  const handleDeleteTransaction = (id: string) => {
    const transaction = transactions.find(t => t.id === id);
    
    if (!transaction) return;
    
    let confirmMessage = 'Tem certeza que deseja excluir esta despesa?';
    
    // Add warning for special transactions
    if (transaction.isGoalContribution) {
      confirmMessage = 'ATENÇÃO: Esta é uma contribuição para uma meta. Excluir esta transação também removerá o valor da meta. Deseja continuar?';
    } else if (transaction.isInvestmentContribution) {
      confirmMessage = 'ATENÇÃO: Esta é uma contribuição para um investimento. Excluir esta transação também removerá o valor do investimento. Deseja continuar?';
    } else if (transaction.isRecurringPayment) {
      confirmMessage = 'ATENÇÃO: Esta é uma despesa fixa. Excluir esta transação também removerá o valor da despesa fixa. Deseja continuar?';
    }
    
    setTransactionToDelete({ id, message: confirmMessage });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!transactionToDelete) return;
    
    const transaction = transactions.find(t => t.id === transactionToDelete.id);
    if (!transaction) return;
    
    // If it's a goal contribution, we need to update the goal
    if (transaction.isGoalContribution && transaction.goalId) {
      const goal = goals.find(g => g.id === transaction.goalId);
      if (goal) {
        // Subtract the contribution from the goal's current amount
        financeContext.editGoal({
          ...goal,
          currentAmount: Math.max(0, goal.currentAmount - transaction.amount)
        });
      }
    }
    
    // Delete the transaction
    deleteTransaction(transactionToDelete.id);
    
    toast.success("Despesa excluída com sucesso!");
    
    // Reset state
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
    const csvHeader = 'Data,Descrição,Categoria,Valor,Forma de Pagamento,Tipo\n';
    const csvData = currentMonthExpenses.map(expense => {
      const date = expense.date.toLocaleDateString('pt-BR');
      const amount = expense.amount.toFixed(2).replace('.', ',');
      const type = expense.isGoalContribution ? 'Contribuição para Meta' : 
                  expense.isInvestmentContribution ? 'Investimento' : 
                  expense.isRecurringPayment ? 'Despesa Fixa' : 'Despesa Regular';
      return `${date},"${expense.description}",${formatCategoryForDisplay(expense.category)},${amount},${expense.paymentMethod || 'N/A'},${type}`;
    }).join('\n');
    
    const csvContent = csvHeader + csvData;
    
    // Criar e fazer download do arquivo CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `despesas_${currentMonth}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Arquivo CSV exportado com sucesso!");
    setIsLoading(false);
  };

  const handleDeleteRecurringExpense = async (id: string, description: string) => {
    try {
      await deleteRecurringExpense(id);
      toast.success(`Despesa recorrente "${description}" excluída permanentemente!`);
    } catch (error) {
      console.error('Erro ao excluir despesa recorrente:', error);
      toast.error('Erro ao excluir despesa recorrente');
    }
  };

  const exportToExcel = () => {
    setIsLoading(true);
    // Preparar os dados para exportação
    let excelContent = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
    excelContent += '<head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Despesas</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>';
    excelContent += '<body>';
    excelContent += '<table>';
    excelContent += '<tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Valor</th><th>Forma de Pagamento</th><th>Tipo</th></tr>';
    
    currentMonthExpenses.forEach(expense => {
      const date = expense.date.toLocaleDateString('pt-BR');
      const amount = expense.amount.toFixed(2).replace('.', ',');
      const type = expense.isGoalContribution ? 'Contribuição para Meta' : 
                expense.isInvestmentContribution ? 'Investimento' : 
                expense.isRecurringPayment ? 'Despesa Fixa' : 'Despesa Regular';
      
      excelContent += `<tr>`;
      excelContent += `<td>${date}</td>`;
      excelContent += `<td>${expense.description}</td>`;
      excelContent += `<td>${formatCategoryForDisplay(expense.category)}</td>`;
      excelContent += `<td>${amount}</td>`;
      excelContent += `<td>${expense.paymentMethod || 'N/A'}</td>`;
      excelContent += `<td>${type}</td>`;
      excelContent += `</tr>`;
    });
    
    excelContent += '</table></body></html>';
    
    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `despesas_${currentMonth}.xls`;
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
        <h1>Relatório de Despesas - ${currentMonth}</h1>
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Descrição</th>
              <th>Categoria</th>
              <th>Valor</th>
              <th>Forma de Pagamento</th>
              <th>Tipo</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    currentMonthExpenses.forEach(expense => {
      const date = expense.date.toLocaleDateString('pt-BR');
      const amount = formatCurrency(expense.amount);
      const type = expense.isGoalContribution ? 'Contribuição para Meta' : 
                expense.isInvestmentContribution ? 'Investimento' : 
                expense.isRecurringPayment ? 'Despesa Fixa' : 'Despesa Regular';
      
      pdfContent += `
        <tr>
          <td>${date}</td>
          <td>${expense.description}</td>
          <td>${formatCategoryForDisplay(expense.category)}</td>
          <td>${amount}</td>
          <td>${expense.paymentMethod || 'N/A'}</td>
          <td>${type}</td>
        </tr>
      `;
    });
    
    pdfContent += `
          </tbody>
          <tfoot>
            <tr class="total">
              <td colspan="3">Total</td>
              <td>${formatCurrency(totalExpense)}</td>
              <td colspan="2"></td>
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
    link.download = `despesas_${currentMonth}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Arquivo PDF exportado com sucesso! (HTML formatado para impressão)");
    setIsLoading(false);
  };

  // Helper function to render a transaction badge based on its type
  const renderTransactionBadge = (transaction: any) => {
    if (transaction.isGoalContribution) {
      return (
        <Badge variant="outline" className="flex items-center gap-1 bg-primary/10">
          <Target className="h-3 w-3" />
          <span>Meta</span>
        </Badge>
      );
    } else if (transaction.isInvestmentContribution) {
      return (
        <Badge variant="outline" className="flex items-center gap-1 bg-primary-action/10">
          <TrendingUp className="h-3 w-3" />
          <span>Investimento</span>
        </Badge>
      );
    } else if (transaction.isRecurringPayment) {
      return (
        <Badge variant="outline" className="flex items-center gap-1 bg-blue-500/10">
          <Clock className="h-3 w-3" />
          <span>Despesa Fixa</span>
        </Badge>
      );
    }
    return null;
  };

  // Get all categories for the filter dropdown
  const allCategories = getAllExpenseCategories();

  return (
    <MainLayout>
      <TooltipProvider>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
                <TrendingDown className="h-6 w-6 text-red-500" />
                Despesas
              </h1>
              <p className="text-muted-foreground mt-1">
                Gerencie e acompanhe suas despesas mensais
              </p>
            </div>
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 w-full md:w-auto">
              <MonthSelector value={currentMonth} onChange={setCurrentMonth} />
              <TooltipHelper content="Ver ranking das 10 maiores despesas do mês">
                <Button 
                  onClick={() => setTop10ModalOpen(true)}
                  variant="outline"
                  className="flex items-center justify-center gap-2 border-neutral-300 hover:bg-neutral-100 w-full md:w-auto whitespace-nowrap"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden lg:inline">Top 10 Despesas</span>
                  <span className="lg:hidden">Top 10</span>
                </Button>
              </TooltipHelper>
              <TooltipHelper content="Adicionar nova despesa">
                <Button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 w-full md:w-auto whitespace-nowrap"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden md:inline">Nova Despesa</span>
                  <span className="md:hidden">Nova</span>
                </Button>
              </TooltipHelper>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <DollarSign className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total do Mês</p>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpense)}</p>
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
                    <TrendingDown className="h-5 w-5 text-purple-600" />
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

          {/* Special Transactions Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Target className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Contribuições para Metas</p>
                    <p className="text-xl font-bold">{stats.goalContributions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Investimentos</p>
                    <p className="text-xl font-bold">{stats.investments}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Clock className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Despesas Fixas</p>
                    <p className="text-xl font-bold">{stats.recurringPayments}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Seção de Gerenciamento de Despesas Recorrentes */}
          <Collapsible
            open={isRecurringExpensesOpen}
            onOpenChange={setIsRecurringExpensesOpen}
            className="space-y-2"
          >
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Repeat className="h-5 w-5 text-blue-600" />
                      Gerenciar Despesas Recorrentes
                      <Badge variant="secondary" className="ml-2">
                        {recurringExpenses.length}
                      </Badge>
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="gap-2">
                      {isRecurringExpensesOpen ? (
                        <>
                          Recolher <ChevronUp className="h-4 w-4" />
                        </>
                      ) : (
                        <>
                          Expandir <ChevronDown className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground text-left">
                    Visualize e gerencie suas despesas recorrentes cadastradas
                  </p>
                </CardHeader>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <CardContent className="pt-0 space-y-3">
                  {recurringExpenses.length === 0 ? (
                    <div className="text-center py-8">
                      <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">
                        Nenhuma despesa recorrente cadastrada
                      </p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="space-y-2">
                        {recurringExpenses
                          .sort((a, b) => a.dueDay - b.dueDay)
                          .map((expense) => {
                            const nextDueDate = new Date();
                            nextDueDate.setDate(expense.dueDay);
                            if (nextDueDate < new Date()) {
                              nextDueDate.setMonth(nextDueDate.getMonth() + 1);
                            }
                            
                            return (
                              <Card key={expense.id} className="p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-base flex items-center gap-2">
                                      {expense.description}
                                    </h4>
                                     <div className="flex flex-wrap gap-2 mt-2">
                                      <Badge variant="outline">{formatCategoryForDisplay(expense.category)}</Badge>
                                      <Badge variant="secondary" className="gap-1">
                                        <Calendar className="h-3 w-3" />
                                        Dia {expense.dueDay}
                                      </Badge>
                                      <Badge variant="secondary">
                                        {formatCurrency(expense.amount)}
                                      </Badge>
                                      {expense.repeatMonths && (
                                        <Badge variant="secondary">
                                          {expense.repeatMonths === 1 ? '1 mês' : `${expense.repeatMonths} meses`}
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">
                                      Próximo vencimento: {nextDueDate.toLocaleDateString('pt-BR', { 
                                        day: '2-digit', 
                                        month: '2-digit', 
                                        year: 'numeric' 
                                      })}
                                    </p>
                                  </div>
                                  <AlertDialog>
                                    <TooltipHelper content="Excluir permanentemente">
                                      <AlertDialogTrigger asChild>
                                        <Button 
                                          variant="ghost" 
                                          size="icon"
                                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                    </TooltipHelper>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle className="flex items-center gap-2">
                                          <Trash2 className="h-5 w-5 text-destructive" />
                                          Excluir Despesa Recorrente
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                          <div className="space-y-3">
                                            <p>
                                              Tem certeza que deseja excluir permanentemente a despesa recorrente 
                                              <strong className="text-foreground"> "{expense.description}"</strong>?
                                            </p>
                                            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
                                               <p className="text-sm text-destructive font-medium flex items-center gap-2">
                                                <AlertTriangle className="h-4 w-4" />
                                                ATENÇÃO: Esta ação não pode ser desfeita!
                                               </p>
                                              <ul className="text-xs text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                                                <li>A despesa não aparecerá mais nos próximos meses</li>
                                                <li>Transações já criadas não serão excluídas</li>
                                                <li>Você precisará cadastrar novamente se mudar de ideia</li>
                                              </ul>
                                            </div>
                                          </div>
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction 
                                          onClick={() => handleDeleteRecurringExpense(expense.id, expense.description)}
                                          className="bg-destructive hover:bg-destructive/90"
                                        >
                                          Excluir Permanentemente
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </Card>
                            );
                          })}
                      </div>
                    </ScrollArea>
                  )}
                  
                  {recurringExpenses.length > 0 && (
                    <div className="border-t pt-3 mt-3">
                      <p className="text-sm text-muted-foreground text-center">
                        📝 Total de <strong>{recurringExpenses.length}</strong> {recurringExpenses.length === 1 ? 'despesa recorrente cadastrada' : 'despesas recorrentes cadastradas'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

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
                            <Badge variant="secondary">
                              {category.startsWith('Crie sua categoria: ') || category.startsWith('Outros: ') ? 'Personalizada' : 'Padrão'}
                            </Badge>
                            <span>{formatCategoryForDisplay(category)}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full md:w-64">
                  <Select value={showSpecialTransactions} onValueChange={(value) => setShowSpecialTransactions(value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filtrar por tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Todos</Badge>
                          <span>Todos os tipos</span>
                        </div>
                      </SelectItem>
                      <Separator />
                      <SelectItem value="goals">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          <span>Contribuições para metas</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="investments">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          <span>Investimentos</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="recurring">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>Despesas fixas</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="regular">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          <span>Despesas regulares</span>
                        </div>
                      </SelectItem>
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
              {(filterCategory !== 'all' || searchTerm || showSpecialTransactions !== 'all') && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-muted-foreground">Filtros ativos:</span>
                  {filterCategory !== 'all' && (
                    <Badge variant="secondary" className="gap-1">
                      Categoria: {filterCategory.startsWith('Outros: ') ? filterCategory.substring(7) : filterCategory}
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
                  {showSpecialTransactions !== 'all' && (
                    <Badge variant="secondary" className="gap-1">
                      Tipo: {showSpecialTransactions === 'goals' ? 'Metas' : 
                             showSpecialTransactions === 'investments' ? 'Investimentos' :
                             showSpecialTransactions === 'recurring' ? 'Despesas Fixas' : 'Regulares'}
                      <button 
                        onClick={() => setShowSpecialTransactions('all')}
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

          {/* Recent Expense Transactions */}
        </div>

        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4 text-neutral-800">Despesas Recentes</h2>
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
          ) : currentMonthExpenses.length === 0 ? (
            <EmptyState
              title="Nenhuma despesa encontrada"
              description="Comece adicionando suas primeiras despesas para acompanhar seus gastos."
              actionLabel="Adicionar Despesa"
              onAction={() => setIsAddModalOpen(true)}
            />
          ) : (
            <TransactionsTable 
              transactions={[...currentMonthExpenses]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 5)} 
              onDelete={handleDeleteTransaction}
              onEdit={handleEditTransaction}
              type="expense"
              renderBadge={renderTransactionBadge}
            />
          )}
        </div>

        {/* Modal de adição */}
        <AddTransactionModal
          open={isAddModalOpen}
          onOpenChange={setIsAddModalOpen}
          mode="add"
          defaultTransactionType="expense"
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
          defaultTransactionType="expense"
        />

        {/* Alert Dialog de confirmação de exclusão */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-destructive" />
                Excluir Despesa
              </AlertDialogTitle>
              <AlertDialogDescription>
                {transactionToDelete?.message}
                <br />
                <span className="text-sm text-muted-foreground mt-2 block">
                  Esta ação não pode ser desfeita. Todos os dados relacionados a esta despesa serão perdidos permanentemente.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={cancelDelete}>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDelete}
                className="bg-destructive hover:bg-destructive/90"
              >
                Excluir Despesa
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Modal Top 10 Despesas */}
        <Top10ExpensesModal
          transactions={currentMonthExpenses}
          currentMonth={currentMonth}
          open={top10ModalOpen}
          onOpenChange={setTop10ModalOpen}
        />

      </TooltipProvider>
    </MainLayout>
  );
};

export default Expenses;
