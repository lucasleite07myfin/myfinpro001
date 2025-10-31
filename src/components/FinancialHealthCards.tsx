import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, PiggyBank, CreditCard, Shield, Wallet } from 'lucide-react';
import { HealthSnapshot } from '@/types/alerts';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

interface FinancialHealthCardsProps {
  currentHealth: HealthSnapshot | null;
  historicalData: HealthSnapshot[];
}

const FinancialHealthCards: React.FC<FinancialHealthCardsProps> = ({
  currentHealth,
  historicalData
}) => {
  if (!currentHealth) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Ainda não há dados suficientes para calcular sua saúde financeira
      </div>
    );
  }

  const getHealthColor = (value: number, thresholds: { good: number; warning: number }, invert = false) => {
    if (invert) {
      if (value <= thresholds.good) return 'text-green-600';
      if (value <= thresholds.warning) return 'text-yellow-600';
      return 'text-red-600';
    } else {
      if (value >= thresholds.good) return 'text-green-600';
      if (value >= thresholds.warning) return 'text-yellow-600';
      return 'text-red-600';
    }
  };

  const healthMetrics = [
    {
      title: 'Taxa de Poupança',
      value: `${currentHealth.savingsRatePct?.toFixed(1) || 0}%`,
      icon: <PiggyBank className="h-5 w-5" />,
      color: getHealthColor(currentHealth.savingsRatePct || 0, { good: 20, warning: 10 }),
      tooltip: 'Taxa de poupança = (Receita - Despesa) / Receita × 100. Verde: ≥20%, Amarelo: 10-20%, Vermelho: <10%'
    },
    {
      title: 'Índice de Endividamento',
      value: `${currentHealth.debtIncomePct?.toFixed(1) || 0}%`,
      icon: <CreditCard className="h-5 w-5" />,
      color: getHealthColor(currentHealth.debtIncomePct || 0, { good: 30, warning: 50 }, true),
      tooltip: 'Índice de endividamento = Total de dívidas / Renda mensal × 100. Verde: <30%, Amarelo: 30-50%, Vermelho: >50%'
    },
    {
      title: 'Reserva de Emergência',
      value: `${currentHealth.monthsEmergencyFund?.toFixed(1) || 0} meses`,
      icon: <Shield className="h-5 w-5" />,
      color: getHealthColor(currentHealth.monthsEmergencyFund || 0, { good: 6, warning: 3 }),
      tooltip: 'Meses de reserva = Reserva de emergência / Despesa média mensal. Verde: ≥6 meses, Amarelo: 3-5 meses, Vermelho: <3 meses'
    },
    {
      title: 'Crescimento Patrimonial',
      value: `${(currentHealth.netWorthGrowth12m || 0) >= 0 ? '+' : ''}${(currentHealth.netWorthGrowth12m || 0).toFixed(1)}%`,
      icon: (currentHealth.netWorthGrowth12m || 0) >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />,
      color: (currentHealth.netWorthGrowth12m || 0) >= 0 ? 'text-green-600' : 'text-red-600',
      tooltip: 'Crescimento do patrimônio nos últimos 12 meses comparado ao período anterior'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {healthMetrics.map((metric, index) => (
          <Tooltip key={index}>
            <TooltipTrigger asChild>
              <Card className="cursor-help hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {metric.title}
                  </CardTitle>
                  <div className={metric.color}>
                    {metric.icon}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${metric.color}`}>
                    {metric.value}
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">{metric.tooltip}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>

      {historicalData.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Evolução da Saúde Financeira
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historicalData.slice(0, 12).reverse().map(h => ({
                date: h.snapshotDate.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
                savingsRate: h.savingsRatePct || 0,
                debtRatio: h.debtIncomePct || 0,
                emergencyFund: h.monthsEmergencyFund || 0,
              }))}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <RechartsTooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="savingsRate" 
                  stroke="hsl(var(--chart-1))" 
                  name="Taxa de Poupança %"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="debtRatio" 
                  stroke="hsl(var(--chart-2))" 
                  name="Endividamento %"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="emergencyFund" 
                  stroke="hsl(var(--chart-3))" 
                  name="Reserva (meses)"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FinancialHealthCards;
