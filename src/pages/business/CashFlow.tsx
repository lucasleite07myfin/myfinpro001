import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import MainLayout from '@/components/MainLayout';
import MonthSelector from '@/components/MonthSelector';
import { useBusiness } from '@/contexts/BusinessContext';
import { formatCurrency } from '@/utils/formatters';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { FileText, FileSpreadsheet, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const projectedData = [
  { month: 'Jan', income: 50000, expenses: 35000, balance: 15000, projection: 15000 },
  { month: 'Fev', income: 45000, expenses: 30000, balance: 15000, projection: 15000 },
  { month: 'Mar', income: 60000, expenses: 40000, balance: 20000, projection: 20000 },
  { month: 'Abr', income: 48000, expenses: 38000, balance: 10000, projection: 10000 },
  { month: 'Mai', income: 55000, expenses: 42000, balance: 13000, projection: 13000 },
  { month: 'Jun', income: 65000, expenses: 45000, balance: 20000, projection: 20000 },
  // Add historical data
  { month: 'Jul', income: 70000, expenses: 50000, balance: 20000, projection: null },
  { month: 'Ago', income: 72000, expenses: 48000, balance: 24000, projection: null },
  { month: 'Set', income: 68000, expenses: 52000, balance: 16000, projection: null },
  { month: 'Out', income: null, expenses: null, balance: null, projection: 18000 },
  { month: 'Nov', income: null, expenses: null, balance: null, projection: 20000 },
  { month: 'Dez', income: null, expenses: null, balance: null, projection: 22000 }
];

const CashFlow: React.FC = () => {
  const { currentMonth, setCurrentMonth } = useBusiness();
  const [view, setView] = useState<'monthly' | 'accumulated'>('monthly');
  
  const calculateTotals = () => {
    const historical = projectedData.filter(item => item.income !== null && item.expenses !== null);
    const totalIncome = historical.reduce((sum, item) => sum + (item.income || 0), 0);
    const totalExpenses = historical.reduce((sum, item) => sum + (item.expenses || 0), 0);
    const totalBalance = totalIncome - totalExpenses;
    
    return { totalIncome, totalExpenses, totalBalance };
  };
  
  const { totalIncome, totalExpenses, totalBalance } = calculateTotals();

  const exportToCSV = () => {
    // Preparar dados para exportação
    const csvHeader = 'Mês,Entradas,Saídas,Saldo,Projeção\n';
    const csvData = projectedData.map(item => {
      return `${item.month},${item.income !== null ? item.income : ''},${item.expenses !== null ? item.expenses : ''},${item.balance !== null ? item.balance : ''},${item.projection !== null ? item.projection : ''}`;
    }).join('\n');
    
    const csvContent = csvHeader + csvData;
    
    // Criar e fazer download do arquivo CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `fluxo-de-caixa_${currentMonth}.csv`);
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
    excelContent += '<head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Fluxo de Caixa</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>';
    excelContent += '<body>';
    excelContent += '<table>';
    excelContent += '<tr><th>Mês</th><th>Entradas</th><th>Saídas</th><th>Saldo</th><th>Projeção</th></tr>';
    
    projectedData.forEach(item => {
      excelContent += `<tr>`;
      excelContent += `<td>${item.month}</td>`;
      excelContent += `<td>${item.income !== null ? formatCurrency(item.income) : ''}</td>`;
      excelContent += `<td>${item.expenses !== null ? formatCurrency(item.expenses) : ''}</td>`;
      excelContent += `<td>${item.balance !== null ? formatCurrency(item.balance) : ''}</td>`;
      excelContent += `<td>${item.projection !== null ? formatCurrency(item.projection) : ''}</td>`;
      excelContent += `</tr>`;
    });
    
    excelContent += '</table></body></html>';
    
    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fluxo-de-caixa_${currentMonth}.xls`;
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
        <h1>Relatório de Fluxo de Caixa - ${currentMonth}</h1>
        <table>
          <thead>
            <tr>
              <th>Mês</th>
              <th>Entradas</th>
              <th>Saídas</th>
              <th>Saldo</th>
              <th>Projeção</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    projectedData.forEach(item => {
      pdfContent += `
        <tr>
          <td>${item.month}</td>
          <td>${item.income !== null ? formatCurrency(item.income) : '-'}</td>
          <td>${item.expenses !== null ? formatCurrency(item.expenses) : '-'}</td>
          <td>${item.balance !== null ? formatCurrency(item.balance) : '-'}</td>
          <td>${item.projection !== null ? formatCurrency(item.projection) : '-'}</td>
        </tr>
      `;
    });
    
    pdfContent += `
          </tbody>
          <tfoot>
            <tr class="total">
              <td>Total</td>
              <td>${formatCurrency(totalIncome)}</td>
              <td>${formatCurrency(totalExpenses)}</td>
              <td>${formatCurrency(totalBalance)}</td>
              <td>-</td>
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
    link.download = `fluxo-de-caixa_${currentMonth}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Sucesso",
      description: "Arquivo PDF exportado com sucesso! (HTML formatado para impressão)",
      variant: "default"
    });
  };

  return (
    <MainLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-2">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-neutral-800 mb-1">Fluxo de Caixa</h1>
          <p className="text-neutral-500">Acompanhe entradas, saídas e projeções</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setView('monthly')}
              className={`px-3 py-1 text-sm rounded-md ${
                view === 'monthly' 
                  ? 'bg-primary text-white' 
                  : 'bg-neutral-100 text-neutral-600'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setView('accumulated')}
              className={`px-3 py-1 text-sm rounded-md ${
                view === 'accumulated' 
                  ? 'bg-primary text-white' 
                  : 'bg-neutral-100 text-neutral-600'
              }`}
            >
              Acumulado
            </button>
          </div>
          <div className="flex items-center gap-2">
            <MonthSelector value={currentMonth} onChange={setCurrentMonth} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="default" size="sm">
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
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-neutral-500 font-normal">
              Total de Entradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-income">{formatCurrency(totalIncome)}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-neutral-500 font-normal">
              Total de Saídas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-expense">{formatCurrency(totalExpenses)}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-neutral-500 font-normal">
              Saldo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${totalBalance >= 0 ? 'text-income' : 'text-expense'}`}>
              {formatCurrency(totalBalance)}
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Fluxo de Caixa {view === 'accumulated' ? 'Acumulado' : 'Mensal'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={view === 'accumulated' 
                  ? projectedData.map((item, index, arr) => ({
                      ...item,
                      accIncome: arr.slice(0, index + 1).reduce((sum, i) => sum + (i.income || 0), 0),
                      accExpenses: arr.slice(0, index + 1).reduce((sum, i) => sum + (i.expenses || 0), 0),
                      accBalance: arr.slice(0, index + 1).reduce((sum, i) => sum + (i.balance || 0), 0),
                    }))
                  : projectedData
                }
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
                {view === 'accumulated' ? (
                  <>
                    <Bar dataKey="accIncome" name="Entradas Acumuladas" stackId="a" fill="#4ade80" />
                    <Bar dataKey="accExpenses" name="Saídas Acumuladas" stackId="b" fill="#f87171" />
                    <Line type="monotone" dataKey="accBalance" name="Saldo Acumulado" stroke="#6366f1" strokeWidth={2} />
                  </>
                ) : (
                  <>
                    <Bar dataKey="income" name="Entradas" fill="#4ade80" />
                    <Bar dataKey="expenses" name="Saídas" fill="#f87171" />
                    <Line type="monotone" dataKey="balance" name="Saldo" stroke="#6366f1" strokeWidth={2} />
                    <Line type="monotone" dataKey="projection" name="Projeção" stroke="#a855f7" strokeDasharray="5 5" strokeWidth={2} />
                  </>
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Projeção de Fluxo de Caixa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-neutral-50 text-left text-xs font-medium text-neutral-500 uppercase">Mês</th>
                  <th className="px-6 py-3 bg-neutral-50 text-right text-xs font-medium text-neutral-500 uppercase">Entradas</th>
                  <th className="px-6 py-3 bg-neutral-50 text-right text-xs font-medium text-neutral-500 uppercase">Saídas</th>
                  <th className="px-6 py-3 bg-neutral-50 text-right text-xs font-medium text-neutral-500 uppercase">Saldo</th>
                  <th className="px-6 py-3 bg-neutral-50 text-right text-xs font-medium text-neutral-500 uppercase">Projeção</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {projectedData.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">{item.month}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-neutral-800">
                      {item.income !== null ? formatCurrency(item.income) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-neutral-800">
                      {item.expenses !== null ? formatCurrency(item.expenses) : '-'}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                      item.balance !== null ? (item.balance >= 0 ? 'text-income' : 'text-expense') : 'text-neutral-400'
                    }`}>
                      {item.balance !== null ? formatCurrency(item.balance) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-purple-600">
                      {item.projection !== null ? formatCurrency(item.projection) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  );
};

export default CashFlow;
