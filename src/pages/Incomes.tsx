
import React, { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { useBusiness } from '@/contexts/BusinessContext';
import { useAppMode } from '@/contexts/AppModeContext';
import MainLayout from '@/components/MainLayout';
import TransactionsTable from '@/components/TransactionsTable';
import MonthSelector from '@/components/MonthSelector';
import AddTransactionModal from '@/components/AddTransactionModal';
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
import { toast } from '@/components/ui/use-toast';
import { FileText, FileSpreadsheet, ChevronDown } from 'lucide-react';
import { INCOME_CATEGORIES, FinanceContextType, BusinessContextType, Transaction } from '@/types/finance';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Incomes: React.FC = () => {
  const { mode } = useAppMode();
  // Use either finance or business context based on current mode
  const financeContext = mode === 'personal' ? useFinance() : useBusiness();
  const { transactions, currentMonth, setCurrentMonth, deleteTransaction, customCategories } = financeContext as FinanceContextType | BusinessContextType;
  
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Get all income categories including custom ones
  const getAllIncomeCategories = () => {
    const userCustomCategories = customCategories?.income || [];
    return [...userCustomCategories, ...INCOME_CATEGORIES.filter(cat => cat !== 'Outros')];
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
    currentMonthIncomes = currentMonthIncomes.filter(t => 
      t.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  // Calculate total income for the month
  const totalIncome = currentMonthIncomes.reduce((sum, t) => sum + t.amount, 0);

  const handleDeleteTransaction = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta receita?')) {
      deleteTransaction(id);
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsEditModalOpen(true);
  };

  const handleUpdateTransaction = (updatedTransaction: Omit<Transaction, 'id'>) => {
    if (editingTransaction) {
      const fullTransaction = { ...updatedTransaction, id: editingTransaction.id };
      // Use the appropriate context method based on mode
      if ('updateTransaction' in financeContext) {
        financeContext.updateTransaction(fullTransaction);
      }
      setIsEditModalOpen(false);
      setEditingTransaction(null);
    }
  };

  const exportToCSV = () => {
    // Preparar dados para exportação
    const csvHeader = 'Data,Descrição,Categoria,Valor\n';
    const csvData = currentMonthIncomes.map(income => {
      const date = income.date.toLocaleDateString('pt-BR');
      const amount = income.amount.toFixed(2).replace('.', ',');
      return `${date},"${income.description}",${income.category},${amount}`;
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
    
    toast({
      title: "Sucesso",
      description: "Arquivo CSV exportado com sucesso!",
      variant: "default"
    });
  };

  const exportToExcel = () => {
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
      excelContent += `<td>${income.category}</td>`;
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
          <td>${income.category}</td>
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
    
    toast({
      title: "Sucesso",
      description: "Arquivo PDF exportado com sucesso! (HTML formatado para impressão)",
      variant: "default"
    });
  };

  // Get all categories for the filter dropdown
  const allCategories = getAllIncomeCategories();

  return (
    <MainLayout>
      <div className="mb-4 md:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h1 className="text-xl md:text-2xl font-bold text-neutral-800 dark:text-white">Receitas</h1>
        <MonthSelector value={currentMonth} onChange={setCurrentMonth} />
      </div>

      <Card className="p-3 md:p-4 mb-4 md:mb-6 bg-neutral-50 dark:bg-card border border-neutral-200 dark:border-border/50">
        <h2 className="text-base md:text-lg font-semibold text-neutral-700 dark:text-white mb-1 md:mb-2">Total de Receitas</h2>
        <p className="text-xl md:text-2xl font-bold text-income-force">{formatCurrency(totalIncome)}</p>
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
              {customCategories?.income?.map((category) => (
                category.startsWith('Outros: ') && (
                  <SelectItem key={category} value={category}>
                    {category.substring(7)}
                  </SelectItem>
                )
              ))}
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
        transactions={currentMonthIncomes} 
        onDelete={handleDeleteTransaction}
        onEdit={handleEditTransaction}
        type="income"
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
      />
    </MainLayout>
  );
};

export default Incomes;
