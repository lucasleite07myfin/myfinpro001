
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, PiggyBank, CreditCard, Shield, Wallet } from 'lucide-react';
import { HealthSnapshot } from '@/types/alerts';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

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
      if (value <= thresholds.good) return 'text-green-600 dark:text-green-400';
      if (value <= thresholds.warning) return 'text-yellow-600 dark:text-yellow-400';
      return 'text-red-600 dark:text-red-400';
    } else {
      if (value >= thresholds.good) return 'text-green-600 dark:text-green-400';
      if (value >= thresholds.warning) return 'text-yellow-600 dark:text-yellow-400';
      return 'text-red-600 dark:text-red-400';
    }
  };

  const healthMetrics = [
    {
      title: 'Taxa de Poupança',
      value: `${currentHealth.savings_rate_pct.toFixed(1)}%`,
      icon: <PiggyBank className="h-5 w-5" />,
      color: getHealthColor(currentHealth.savings_rate_pct, { good: 20, warning: 10 }),
      tooltip: 'Taxa de poupança = (Receita - Despesa) / Receita × 100. Verde: ≥20%, Amarelo: 10-20%, Vermelho: <10%'
    },
    {
      title: 'Índice de Endividamento',
      value: `${currentHealth.debt_income_pct.toFixed(1)}%`,
      icon: <CreditCard className="h-5 w-5" />,
      color: getHealthColor(currentHealth.debt_income_pct, { good: 30, warning: 50 }, true),
      tooltip: 'Índice de endividamento = Total de dívidas / Renda mensal × 100. Verde: <30%, Amarelo: 30-50%, Vermelho: >50%'
    },
    {
      title: 'Reserva de Emergência',
      value: `${currentHealth.months_emergency_fund.toFixed(1)} meses`,
      icon: <Shield className="h-5 w-5" />,
      color: getHealthColor(currentHealth.months_emergency_fund, { good: 6, warning: 3 }),
      tooltip: 'Meses de reserva = Reserva de emergência / Despesa média mensal. Verde: ≥6 meses, Amarelo: 3-5 meses, Vermelho: <3 meses'
    },
    {
      title: 'Crescimento Patrimonial',
      value: `${currentHealth.net_worth_growth_12m >= 0 ? '+' : ''}${currentHealth.net_worth_growth_12m.toFixed(1)}%`,
      icon: currentHealth.net_worth_growth_12m >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />,
      color: currentHealth.net_worth_growth_12m >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
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
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Mini-gráfico de linha dos últimos 12 meses seria implementado aqui usando recharts
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FinancialHealthCards;
