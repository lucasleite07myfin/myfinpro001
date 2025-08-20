
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { formatCurrency, formatMonth } from '@/utils/formatters';
import { MonthlyFinanceData, Transaction } from '@/types/finance';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PieChart as PieChartIcon, LineChart as LineChartIcon } from 'lucide-react';
import { TooltipProvider } from '@/components/ui/tooltip';
import TooltipHelper from '@/components/TooltipHelper';
import { tooltipContent } from '@/data/tooltipContent';

interface FinanceChartProps {
  data: MonthlyFinanceData[];
  transactions: Transaction[];
}

// Cores para o gráfico de pizza
const COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', 
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
];

const FinanceChart: React.FC<FinanceChartProps> = ({ data, transactions }) => {
  const [chartType, setChartType] = useState<'line' | 'pie'>('line');

  // Formatar dados para o gráfico de linha
  const lineChartData = data.map(item => ({
    name: formatMonth(item.month),
    Receitas: item.incomeTotal,
    Despesas: item.expenseTotal,
  }));

  // Calcular as despesas por categoria para o gráfico de pizza
  const expensesByCategory: Record<string, number> = {};
  
  // Filtrar apenas as despesas
  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  
  // Somar os valores por categoria
  expenseTransactions.forEach(transaction => {
    if (!expensesByCategory[transaction.category]) {
      expensesByCategory[transaction.category] = 0;
    }
    expensesByCategory[transaction.category] += transaction.amount;
  });
  
  // Converter para o formato de dados do gráfico de pizza
  const pieChartData = Object.entries(expensesByCategory).map(([category, amount]) => ({
    name: category,
    value: amount
  }));
  
  // Ordenar do maior para o menor
  pieChartData.sort((a, b) => b.value - a.value);

  // Configuração do ChartContainer
  const chartConfig = {
    receitas: {
      label: "Receitas",
      color: "hsl(142 76% 36%)",
    },
    despesas: {
      label: "Despesas", 
      color: "hsl(0 84% 60%)",
    },
  };

  const pieChartConfig = pieChartData.reduce((config: any, item, index) => {
    config[item.name.toLowerCase().replace(/\s+/g, '_')] = {
      label: item.name,
      color: COLORS[index % COLORS.length],
    };
    return config;
  }, {});

  return (
    <TooltipProvider>
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">
            {chartType === 'line' ? 'Evolução Financeira (12 meses)' : 'Despesas por Categoria'}
          </CardTitle>
          <ToggleGroup type="single" value={chartType} onValueChange={(value) => value && setChartType(value as 'line' | 'pie')}>
            <TooltipHelper content="Visualizar gráfico de linha">
              <ToggleGroupItem value="line" aria-label="Gráfico de Linha">
                <LineChartIcon className="h-4 w-4" />
              </ToggleGroupItem>
            </TooltipHelper>
            <TooltipHelper content="Visualizar gráfico de pizza">
              <ToggleGroupItem value="pie" aria-label="Gráfico de Pizza">
                <PieChartIcon className="h-4 w-4" />
              </ToggleGroupItem>
            </TooltipHelper>
          </ToggleGroup>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full">
            {chartType === 'line' ? (
              <ChartContainer config={chartConfig}>
                <LineChart
                  data={lineChartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `R$ ${value / 1000}k`}
                  />
                  <ChartTooltip 
                    cursor={false}
                    content={<ChartTooltipContent 
                      formatter={(value) => [formatCurrency(Number(value)), ""]}
                    />} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Receitas" 
                    stroke="var(--color-receitas)" 
                    strokeWidth={3} 
                    dot={{ r: 6, strokeWidth: 2 }}
                    activeDot={{ r: 8, strokeWidth: 2 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Despesas" 
                    stroke="var(--color-despesas)" 
                    strokeWidth={3} 
                    dot={{ r: 6, strokeWidth: 2 }}
                    activeDot={{ r: 8, strokeWidth: 2 }}
                  />
                </LineChart>
              </ChartContainer>
            ) : (
              <ChartContainer config={pieChartConfig}>
                <PieChart>
                  <ChartTooltip 
                    cursor={false}
                    content={<ChartTooltipContent 
                      formatter={(value, name, props) => [
                        formatCurrency(Number(value)), 
                        name,
                        `${((Number(value) / pieChartData.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1)}%`
                      ]}
                    />} 
                  />
                  <Pie
                    data={pieChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={40}
                    strokeWidth={2}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]}
                        stroke={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default FinanceChart;
