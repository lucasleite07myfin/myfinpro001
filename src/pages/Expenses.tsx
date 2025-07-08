
import React, { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { useBusiness } from '@/contexts/BusinessContext';
import { useAppMode } from '@/contexts/AppModeContext';
import MainLayout from '@/components/MainLayout';
import TransactionsTable from '@/components/TransactionsTable';
import MonthSelector from '@/components/MonthSelector';
import { formatCurrency } from '@/utils/formatters';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge";
import { EXPENSE_CATEGORIES, FinanceContextType, BusinessContextType } from '@/types/finance';
import { toast } from '@/components/ui/use-toast';
import { Target, TrendingUp, FileText, FileSpreadsheet, ChevronDown, Clock } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Expenses: React.FC = () => {
  const { mode } = useAppMode();
  // Use either finance or business context based on current mode
  const financeContext = mode === 'personal' ? useFinance() : useBusiness();
  const { transactions, currentMonth, setCurrentMonth, deleteTransaction, goals, customCategories } = financeContext as FinanceContextType | BusinessContextType;
  
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showSpecialTransactions, setShowSpecialTransactions] = useState<
    'all' | 'goals' | 'investments' | 'recurring' | 'regular'
  >('all');
  
  // Get all expense categories including custom ones
  const getAllExpenseCategories = () => {
    const userCustomCategories = customCategories?.expense || [];
    return [...userCustomCategories, ...EXPENSE_CATEGORIES.filter(cat => cat !== 'Outros')];
  };
  
  // Filtrar apenas despesas
  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  
  // Filtrar despesas do mês atual
  let currentMonthExpenses = expenseTransactions.filter(t => {
    const transactionMonth = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
    return transactionMonth === currentMonth;
  });

  // Aplicar filtro por categoria, se selecionado
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

  // Aplicar filtro por termo de busca
  if (searchTerm) {
    currentMonthExpenses = currentMonthExpenses.filter(t => 
      t.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  // Aplicar filtro por tipo de transação especial
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

  // Calcular total de despesas filtradas
  const totalExpense = currentMonthExpenses.reduce((sum, t) => sum + t.amount, 0);

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
    
    if (window.confirm(confirmMessage)) {
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
      deleteTransaction(id);
    }
  };

  const exportToCSV = () => {
    // Preparar dados para exportação
    const csvHeader = 'Data,Descrição,Categoria,Valor,Forma de Pagamento,Tipo\n';
    const csvData = currentMonthExpenses.map(expense => {
      const date = expense.date.toLocaleDateString('pt-BR');
      const amount = expense.amount.toFixed(2).replace('.', ',');
      const type = expense.isGoalContribution ? 'Contribuição para Meta' : 
                  expense.isInvestmentContribution ? 'Investimento' : 'Despesa Regular';
      return `${date},"${expense.description}",${expense.category},${amount},${expense.paymentMethod || 'N/A'},${type}`;
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
    
    toast({
      title: "Sucesso",
      description: "Arquivo CSV exportado com sucesso!",
      variant: "default"
    });
  };

  const exportToExcel = () => {
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
                expense.isInvestmentContribution ? 'Investimento' : 'Despesa Regular';
      
      excelContent += `<tr>`;
      excelContent += `<td>${date}</td>`;
      excelContent += `<td>${expense.description}</td>`;
      excelContent += `<td>${expense.category}</td>`;
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
    
    toast({
      title: "Sucesso",
      description: "Arquivo Excel exportado com sucesso!",
      variant: "default"
    });
  };

  const exportToPDF = () => {
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
                expense.isInvestmentContribution ? 'Investimento' : 'Despesa Regular';
      
      pdfContent += `
        <tr>
          <td>${date}</td>
          <td>${expense.description}</td>
          <td>${expense.category}</td>
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
    
    toast({
      title: "Sucesso",
      description: "Arquivo PDF exportado com sucesso! (HTML formatado para impressão)",
      variant: "default"
    });
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
        <Badge variant="outline" className="flex items-center gap-1 bg-orange-500/10">
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
      <div className="mb-4 md:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h1 className="text-xl md:text-2xl font-bold text-neutral-800 dark:text-white">Despesas</h1>
        <MonthSelector value={currentMonth} onChange={setCurrentMonth} />
      </div>

      <Card className="p-3 md:p-4 mb-4 md:mb-6 bg-neutral-50 dark:bg-card border border-neutral-200 dark:border-border/50">
        <h2 className="text-base md:text-lg font-semibold text-neutral-700 dark:text-white mb-1 md:mb-2">Total de Despesas</h2>
        <p className="text-xl md:text-2xl font-bold text-expense-force">{formatCurrency(totalExpense)}</p>
      </Card>

      <div className="flex flex-col md:flex-row gap-3 mb-4 md:mb-6">
        <div className="flex-1">
          <Input
            placeholder="Buscar por descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full md:w-48">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {allCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category.startsWith('Outros: ') ? category.substring(7) : category}
                </SelectItem>
              ))}
              {customCategories?.expense?.map((category) => (
                category.startsWith('Outros: ') && (
                  <SelectItem key={category} value={category}>
                    {category.substring(7)}
                  </SelectItem>
                )
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full md:w-48">
          <Select value={showSpecialTransactions} onValueChange={(value) => setShowSpecialTransactions(value as any)}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="goals">Apenas contribuições para metas</SelectItem>
              <SelectItem value="investments">Apenas investimentos</SelectItem>
              <SelectItem value="recurring">Apenas despesas fixas</SelectItem>
              <SelectItem value="regular">Apenas despesas regulares</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="default" className="w-full md:w-auto">
              Exportar <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
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

      <TransactionsTable 
        transactions={currentMonthExpenses} 
        onDelete={handleDeleteTransaction}
        type="expense"
        renderBadge={renderTransactionBadge}
      />
    </MainLayout>
  );
};

export default Expenses;
