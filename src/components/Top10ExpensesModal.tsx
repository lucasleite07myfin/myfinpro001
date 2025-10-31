import React, { useMemo } from 'react';
import { Transaction } from '@/types/finance';
import { formatCurrency } from '@/utils/formatters';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TrendingDown, Trophy } from 'lucide-react';

interface Top10ExpensesModalProps {
  transactions: Transaction[];
  currentMonth: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface AggregatedExpense {
  description: string;
  category: string;
  totalAmount: number;
  count: number;
}

const Top10ExpensesModal: React.FC<Top10ExpensesModalProps> = ({
  transactions,
  currentMonth,
  open,
  onOpenChange,
}) => {
  const aggregatedExpenses = useMemo(() => {
    const aggregated = new Map<string, AggregatedExpense>();

    transactions.forEach((transaction) => {
      const key = transaction.description.toLowerCase().trim();
      const existing = aggregated.get(key);

      if (existing) {
        existing.totalAmount += transaction.amount;
        existing.count += 1;
      } else {
        aggregated.set(key, {
          description: transaction.description,
          category: transaction.category,
          totalAmount: transaction.amount,
          count: 1,
        });
      }
    });

    return Array.from(aggregated.values())
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10);
  }, [transactions]);

  const maxAmount = aggregatedExpenses.length > 0 ? aggregatedExpenses[0].totalAmount : 0;

  const formatMonthYear = (monthString: string) => {
    const [year, month] = monthString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  const getPositionLabel = (index: number) => {
    return `${index + 1}º`;
  };

  const getIntensityColor = (amount: number) => {
    const intensity = (amount / maxAmount) * 100;
    if (intensity >= 80) return 'text-red-600';
    if (intensity >= 60) return 'text-red-500';
    if (intensity >= 40) return 'text-orange-500';
    return 'text-orange-400';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Top 10 Maiores Despesas
          </DialogTitle>
          <DialogDescription>
            Ranking das despesas em {formatMonthYear(currentMonth)}
          </DialogDescription>
        </DialogHeader>

        {aggregatedExpenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <TrendingDown className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Nenhuma despesa encontrada neste mês
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[calc(80vh-180px)] pr-4">
            <div className="space-y-4">
              {aggregatedExpenses.map((expense, index) => {
                const progressPercentage = (expense.totalAmount / maxAmount) * 100;
                const intensityColor = getIntensityColor(expense.totalAmount);

                return (
                  <div
                    key={`${expense.description}-${index}`}
                    className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <span
                          className={`font-bold text-lg shrink-0 ${intensityColor}`}
                        >
                          {getPositionLabel(index)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-foreground truncate">
                            {expense.description}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {expense.category}
                            </Badge>
                            {expense.count > 1 && (
                              <span className="text-xs text-muted-foreground">
                                {expense.count} ocorrências
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`font-bold text-lg ${intensityColor}`}>
                          {formatCurrency(expense.totalAmount)}
                        </p>
                      </div>
                    </div>
                    <Progress
                      value={progressPercentage}
                      className="h-2"
                    />
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default Top10ExpensesModal;
