
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/utils/formatters';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number | string;
  isCurrency?: boolean;
  isPercentage?: boolean;
  icon?: React.ReactNode;
  className?: string;
  isPositive?: boolean;
  trend?: number;
  trendInverted?: boolean;
  description?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  isCurrency = false,
  isPercentage = false,
  icon,
  className = '',
  isPositive = true,
  trend,
  trendInverted = false,
  description
}) => {
  const formattedValue = typeof value === 'string' 
    ? value 
    : isCurrency 
      ? formatCurrency(value)
      : isPercentage 
        ? `${value.toFixed(1)}%`
        : value.toString();

  // Determine color class based on title content
  const getValueColorClass = () => {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('receita') || titleLower.includes('income')) {
      return 'text-income-force';
    }
    if (titleLower.includes('despesa') || titleLower.includes('expense')) {
      return 'text-expense-force';
    }
    if (titleLower.includes('lucro') || titleLower.includes('fluxo') || titleLower.includes('balanço')) {
      return isPositive ? 'text-income-force' : 'text-expense-force';
    }
    return isPositive ? 'text-neutral-800 dark:text-white' : 'text-expense-force';
  };

  return (
    <Card className={`${className} hover:shadow-md transition-shadow dark:border-border/50 dark:hover:shadow-none`}>
      <CardContent className="p-3 md:p-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-300">{title}</h3>
          {icon && <div className="text-neutral-400 dark:text-neutral-300">{icon}</div>}
        </div>
        <p className={`text-lg sm:text-xl font-bold ${getValueColorClass()}`}>
          {formattedValue}
        </p>
        {trend !== undefined && (
          <div className="flex items-center mt-1 text-xs">
            {trend > 0 ? (
              <span className={`flex items-center ${trendInverted ? 'text-expense-force' : 'text-income-force'}`}>
                <TrendingUp className="mr-1 h-3 w-3" />
                {trend}%
              </span>
            ) : (
              <span className={`flex items-center ${trendInverted ? 'text-income-force' : 'text-expense-force'}`}>
                <TrendingDown className="mr-1 h-3 w-3" />
                {Math.abs(trend)}%
              </span>
            )}
            {description && (
              <span className="ml-1 text-neutral-500 dark:text-neutral-300">{description}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatsCard;
