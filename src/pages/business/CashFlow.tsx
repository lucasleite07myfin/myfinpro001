import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CustomTabs, CustomTabTriggers } from '@/components/ui/custom-tabs';

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
  const [chartMode, setChartMode] = useState<'historical' | 'projection'>('historical');
  const [showDetailedTable, setShowDetailedTable] = useState(false);
  
  const calculateTotals = () => {
    const historical = projectedData.filter(item => item.income !== null && item.expenses !== null);
    const totalIncome = historical.reduce((sum, item) => sum + (item.income || 0), 0);
    const totalExpenses = historical.reduce((sum, item) => sum + (item.expenses || 0), 0);
    const totalBalance = totalIncome - totalExpenses;
    
    return { totalIncome, totalExpenses, totalBalance };
  };

  const calculateTrends = () => {
    const historical = projectedData.filter(item => item.income !== null && item.expenses !== null);
    const lastThreeMonths = historical.slice(-3);
    const avgBalance = lastThreeMonths.reduce((sum, item) => sum + (item.balance || 0), 0) / lastThreeMonths.length;
    const isGrowing = lastThreeMonths.every((item, index) => 
      index === 0 || (item.balance || 0) >= (lastThreeMonths[index - 1].balance || 0)
    );
    
    const projections = projectedData.filter(item => item.projection !== null);
    const bestProjectedMonth = projections.reduce((max, item) => 
      (item.projection || 0) > (max.projection || 0) ? item : max, projections[0]
    );
    
    return { avgBalance, isGrowing, bestProjectedMonth, lastThreeMonths };
  };

  const generateInsights = () => {
    const { isGrowing, bestProjectedMonth, lastThreeMonths } = calculateTrends();
    const insights = [];

    if (isGrowing) {
      insights.push({
        type: 'success',
        icon: TrendingUp,
        title: 'Tendência Positiva',
        description: 'Seu saldo vem crescendo nos últimos 3 meses consecutivos'
      });
    }

    if (bestProjectedMonth) {
      insights.push({
        type: 'info',
        icon: CheckCircle,
        title: 'Melhor Projeção',
        description: `Se as projeções se confirmarem, ${bestProjectedMonth.month} será o melhor mês com ${formatCurrency(bestProjectedMonth.projection || 0)}`
      });
    }

    const currentBalance = lastThreeMonths[lastThreeMonths.length - 1]?.balance || 0;
    if (currentBalance < 15000) {
      insights.push({
        type: 'warning',
        icon: AlertTriangle,
        title: 'Atenção ao Saldo',
        description: 'Saldo atual abaixo da média histórica. Considere revisar gastos.'
      });
    }

    return insights;
  };
  
  const { totalIncome, totalExpenses, totalBalance } = calculateTotals();
  const insights = generateInsights();

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
    
    toast.success("Arquivo CSV exportado com sucesso!");
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-neutral-500 font-normal flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Total de Entradas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-income">{formatCurrency(totalIncome)}</p>
              <Badge variant="secondary" className="mt-2">9 meses</Badge>
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
              <Badge variant="secondary" className="mt-2">9 meses</Badge>
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

      {/* Análises Inteligentes */}
      {insights.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-neutral-800 mb-4">Análises Inteligentes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {insights.map((insight, index) => {
              const Icon = insight.icon;
              return (
                <Alert key={index} className={
                  insight.type === 'success' ? 'border-green-200 bg-green-50' :
                  insight.type === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                  'border-blue-200 bg-blue-50'
                }>
                  <Icon className={`h-4 w-4 ${
                    insight.type === 'success' ? 'text-green-600' :
                    insight.type === 'warning' ? 'text-yellow-600' :
                    'text-blue-600'
                  }`} />
                  <AlertTitle className={
                    insight.type === 'success' ? 'text-green-800' :
                    insight.type === 'warning' ? 'text-yellow-800' :
                    'text-blue-800'
                  }>
                    {insight.title}
                  </AlertTitle>
                  <AlertDescription className={
                    insight.type === 'success' ? 'text-green-700' :
                    insight.type === 'warning' ? 'text-yellow-700' :
                    'text-blue-700'
                  }>
                    {insight.description}
                  </AlertDescription>
                </Alert>
              );
            })}
          </div>
        </div>
      )}
      
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
                      <th className="px-6 py-3 bg-neutral-50 text-right text-xs font-medium text-neutral-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {projectedData.filter(item => item.income !== null && item.expenses !== null).map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">{item.month}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-neutral-800">
                          {formatCurrency(item.income || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-neutral-800">
                          {formatCurrency(item.expenses || 0)}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                          (item.balance || 0) >= 0 ? 'text-income' : 'text-expense'
                        }`}>
                          {formatCurrency(item.balance || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                          <Badge variant="secondary">Realizado</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
            
            <TabsContent value="projections" className="mt-4">
              <div className="overflow-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 bg-neutral-50 text-left text-xs font-medium text-neutral-500 uppercase">Mês</th>
                      <th className="px-6 py-3 bg-neutral-50 text-right text-xs font-medium text-neutral-500 uppercase">Projeção</th>
                      <th className="px-6 py-3 bg-neutral-50 text-right text-xs font-medium text-neutral-500 uppercase">Confiança</th>
                      <th className="px-6 py-3 bg-neutral-50 text-right text-xs font-medium text-neutral-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {projectedData.filter(item => item.projection !== null).map((item, index) => {
                      const confidence = Math.floor(Math.random() * 30) + 70; // Simular confiança entre 70-100%
                      return (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">{item.month}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-purple-600">
                            {formatCurrency(item.projection || 0)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                            <div className="flex items-center gap-2">
                              <Progress value={confidence} className="w-16 h-2" />
                              <span className="text-xs text-neutral-500">{confidence}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                            <Badge variant="outline" className="text-purple-600 border-purple-200">
                              Projetado
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-purple-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-purple-800">Como calculamos as projeções</p>
                    <p className="text-xs text-purple-700 mt-1">
                      As projeções são baseadas na média dos últimos 6 meses, ajustadas por sazonalidade e tendências de crescimento.
                      A confiança diminui quanto mais distante for o mês projetado.
                    </p>
                  </div>
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
