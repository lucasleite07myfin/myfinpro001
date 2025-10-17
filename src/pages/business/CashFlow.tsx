import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, BarChart } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import MainLayout from '@/components/MainLayout';
import MonthSelector from '@/components/MonthSelector';
import { useBusiness } from '@/contexts/BusinessContext';
import { formatCurrency } from '@/utils/formatters';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import { FileText, FileSpreadsheet, ChevronDown, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Info, Eye, EyeOff } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CustomTabs, CustomTabTriggers } from '@/components/ui/custom-tabs';

const CashFlow: React.FC = () => {
  const { currentMonth, setCurrentMonth, monthlyData, transactions } = useBusiness();
  const [view, setView] = useState<'monthly' | 'accumulated'>('monthly');
  
  // Process data for the chart
  const chartData = React.useMemo(() => {
    const now = new Date();
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    return Array.from({ length: 12 }, (_, i) => {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      const monthStr = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
      const monthName = monthNames[monthDate.getMonth()];
      
      // Find the monthly data for this month
      const monthData = monthlyData.find(m => m.month === monthStr);
      
      return {
        month: monthName,
        income: monthData?.incomeTotal || 0,
        expenses: monthData?.expenseTotal || 0,
        balance: (monthData?.incomeTotal || 0) - (monthData?.expenseTotal || 0),
        projection: null
      };
    });
  }, [monthlyData]);
  
  const calculateTotals = () => {
    const totalIncome = chartData.reduce((sum, item) => sum + item.income, 0);
    const totalExpenses = chartData.reduce((sum, item) => sum + item.expenses, 0);
    const totalBalance = totalIncome - totalExpenses;
    
    return { totalIncome, totalExpenses, totalBalance };
  };


  
  const { totalIncome, totalExpenses, totalBalance } = calculateTotals();

  // Chart configuration for modern Recharts with income/expense colors
  const chartConfig: ChartConfig = {
    income: {
      label: "Entradas",
      color: "#22c55e", // Green for income
    },
    expenses: {
      label: "Saídas", 
      color: "#ef4444", // Red for expenses
    },
    balance: {
      label: "Saldo",
      color: "hsl(var(--chart-3))",
    },
    projection: {
      label: "Projeção",
      color: "hsl(var(--chart-4))",
    },
  };

  const exportToCSV = () => {
    // Preparar dados para exportação
    const csvHeader = 'Mês,Entradas,Saídas,Saldo\n';
    const csvData = chartData.map(item => {
      return `${item.month},${item.income},${item.expenses},${item.balance}`;
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
    
    toast.success("Arquivo CSV exportado com sucesso!");
  };

  const exportToExcel = () => {
    // Preparar os dados para exportação
    let excelContent = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
    excelContent += '<head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Fluxo de Caixa</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>';
    excelContent += '<body>';
    excelContent += '<table>';
    excelContent += '<tr><th>Mês</th><th>Entradas</th><th>Saídas</th><th>Saldo</th></tr>';
    
    chartData.forEach(item => {
      excelContent += `<tr>`;
      excelContent += `<td>${item.month}</td>`;
      excelContent += `<td>${formatCurrency(item.income)}</td>`;
      excelContent += `<td>${formatCurrency(item.expenses)}</td>`;
      excelContent += `<td>${formatCurrency(item.balance)}</td>`;
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
    
    toast.success("Arquivo Excel exportado com sucesso!");
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
            </tr>
          </thead>
          <tbody>
    `;
    
    chartData.forEach(item => {
      pdfContent += `
        <tr>
          <td>${item.month}</td>
          <td>${formatCurrency(item.income)}</td>
          <td>${formatCurrency(item.expenses)}</td>
          <td>${formatCurrency(item.balance)}</td>
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
    
    toast.success("Arquivo PDF exportado com sucesso! (HTML formatado para impressão)");
  };

  return (
    <MainLayout>
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-neutral-800 mb-1">Fluxo de Caixa</h1>
          <p className="text-neutral-500">Acompanhe entradas, saídas e projeções</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
          <Tabs value={view} onValueChange={(value) => setView(value as 'monthly' | 'accumulated')} className="w-full sm:w-auto">
            <TabsList className="grid grid-cols-2 w-full sm:w-[200px]">
              <TabsTrigger value="monthly">Mensal</TabsTrigger>
              <TabsTrigger value="accumulated">Acumulado</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <MonthSelector value={currentMonth} onChange={setCurrentMonth} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="default" size="sm" className="w-full sm:w-auto">
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

      {/* Resumo Financeiro */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-neutral-800 mb-4">Resumo Financeiro</h2>
        <div className="grid grid-cols-1 tablet:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-neutral-500 font-normal flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Total de Entradas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-income">{formatCurrency(totalIncome)}</p>
              <Badge variant="secondary" className="mt-2">12 meses</Badge>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-neutral-500 font-normal flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Total de Saídas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-expense">{formatCurrency(totalExpenses)}</p>
              <Badge variant="secondary" className="mt-2">12 meses</Badge>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-neutral-500 font-normal flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Saldo Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${totalBalance >= 0 ? 'text-income' : 'text-expense'}`}>
                {formatCurrency(totalBalance)}
              </p>
              <div className="flex items-center gap-2 mt-2">
                {totalBalance >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-income" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-expense" />
                )}
                <Badge variant={totalBalance >= 0 ? "default" : "destructive"}>
                  {totalBalance >= 0 ? "Positivo" : "Negativo"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cash Flow Chart */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-neutral-800">
          Fluxo de Caixa {view === 'accumulated' ? 'Acumulado' : 'Mensal'}
        </h2>
        
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  Análise de Fluxo {view === 'accumulated' ? 'Acumulado' : 'Mensal'}
                </CardTitle>
                <p className="text-neutral-500 text-sm mt-1">
                  {view === 'accumulated' 
                    ? 'Valores acumulados ao longo do período' 
                    : 'Entradas e saídas por mês'
                  }
                </p>
              </div>
              <div className="flex items-center gap-2">
                {totalBalance >= 0 ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm font-medium">Superávit</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-600">
                    <TrendingDown className="h-4 w-4" />
                    <span className="text-sm font-medium">Déficit</span>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[400px] w-full">
              <ChartContainer config={chartConfig} className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {view === 'monthly' ? (
                    <BarChart
                      data={chartData}
                      margin={{ top: 20, right: 30, bottom: 20, left: 20 }}
                    >
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        fontSize={12}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        fontSize={12}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                      />
                      <ChartTooltip
                        content={<ChartTooltipContent 
                          formatter={(value, name) => [
                            value ? formatCurrency(Number(value)) : 'Sem dados',
                            name
                          ]}
                          className="bg-white border border-gray-200 shadow-md rounded-lg p-3"
                        />}
                      />
                      <Bar 
                        dataKey="income" 
                        name="Entradas"
                        fill="var(--color-income)" 
                        radius={[4, 4, 0, 0]}
                        maxBarSize={60}
                      />
                      <Bar 
                        dataKey="expenses" 
                        name="Saídas"
                        fill="var(--color-expenses)" 
                        radius={[4, 4, 0, 0]}
                        maxBarSize={60}
                      />
                    </BarChart>
                  ) : (
                    <BarChart
                      data={chartData.map((item, index, arr) => ({
                        ...item,
                        accIncome: arr.slice(0, index + 1).reduce((sum, i) => sum + i.income, 0),
                        accExpenses: arr.slice(0, index + 1).reduce((sum, i) => sum + i.expenses, 0),
                      }))}
                      margin={{ top: 20, right: 30, bottom: 20, left: 20 }}
                    >
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        fontSize={12}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        fontSize={12}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                      />
                      <ChartTooltip
                        content={<ChartTooltipContent 
                          formatter={(value, name) => [
                            formatCurrency(Number(value)),
                            name
                          ]}
                          className="bg-white border border-gray-200 shadow-md rounded-lg p-3"
                        />}
                      />
                      <Bar 
                        dataKey="accIncome" 
                        name="Entradas Acumuladas"
                        fill="var(--color-income)" 
                        radius={[4, 4, 0, 0]}
                        maxBarSize={60}
                      />
                      <Bar 
                        dataKey="accExpenses" 
                        name="Saídas Acumuladas"
                        fill="var(--color-expenses)" 
                        radius={[4, 4, 0, 0]}
                        maxBarSize={60}
                      />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </ChartContainer>
            </div>
            
            <div className="mt-6 pt-6 border-t">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-neutral-500">Total de Entradas</p>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(totalIncome)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-neutral-500">Total de Saídas</p>
                  <p className="text-lg font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-neutral-500">Resultado</p>
                  <p className={`text-lg font-bold ${totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(totalBalance)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabela Detalhada com Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Dados Detalhados</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="historical" className="w-full">
            <TabsList className="grid grid-cols-2 w-full max-w-[400px]">
              <TabsTrigger value="historical">Histórico Real (Jan-Set)</TabsTrigger>
              <TabsTrigger value="projections">Projeções (Out-Dez)</TabsTrigger>
            </TabsList>
            
            <TabsContent value="historical" className="mt-4">
              <div className="overflow-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 bg-neutral-50 text-left text-xs font-medium text-neutral-500 uppercase">Mês</th>
                      <th className="px-6 py-3 bg-neutral-50 text-right text-xs font-medium text-neutral-500 uppercase">Entradas</th>
                      <th className="px-6 py-3 bg-neutral-50 text-right text-xs font-medium text-neutral-500 uppercase">Saídas</th>
                      <th className="px-6 py-3 bg-neutral-50 text-right text-xs font-medium text-neutral-500 uppercase">Saldo</th>
                      <th className="px-6 py-3 bg-neutral-50 text-center text-xs font-medium text-neutral-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {chartData.filter(item => item.income > 0 || item.expenses > 0).map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">{item.month}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-neutral-800">
                          {formatCurrency(item.income)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-neutral-800">
                          {formatCurrency(item.expenses)}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                          item.balance >= 0 ? 'text-income' : 'text-expense'
                        }`}>
                          {formatCurrency(item.balance)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          <Badge variant="secondary">Realizado</Badge>
                        </td>
                      </tr>
                    ))}
                    {chartData.filter(item => item.income > 0 || item.expenses > 0).length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-neutral-500">
                          Nenhuma transação registrada ainda. Adicione transações para visualizar o histórico.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>
            
            <TabsContent value="projections" className="mt-4">
              <div className="overflow-auto">
                <div className="text-center py-12">
                  <Info className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                  <p className="text-neutral-500 mb-2">Projeções em desenvolvimento</p>
                  <p className="text-sm text-neutral-400">
                    As projeções de fluxo de caixa serão baseadas no seu histórico de transações
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </MainLayout>
  );
};

export default CashFlow;
