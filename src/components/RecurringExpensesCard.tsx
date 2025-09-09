import React, { useState, useEffect } from 'react';
import { formatCurrency } from '@/utils/formatters';
import { RecurringExpense } from '@/types/finance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { CheckCircle2, AlertCircle, Calendar, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface RecurringExpensesCardProps {
  expenses: RecurringExpense[];
  currentMonth: string;
  isPaid: (id: string, month: string) => boolean;
  onMarkAsPaid: (id: string, month: string, paid: boolean) => void;
  onEdit?: (expense: RecurringExpense) => void;
  onDelete?: (id: string) => void;
  getMonthlyExpenseValue?: (expenseId: string, month: string) => number | null;
  setMonthlyExpenseValue?: (expenseId: string, month: string, value: number | null) => void;
}

const RecurringExpensesCard: React.FC<RecurringExpensesCardProps> = ({
  expenses,
  currentMonth,
  isPaid,
  onMarkAsPaid,
  onEdit,
  onDelete,
  getMonthlyExpenseValue,
  setMonthlyExpenseValue
}) => {
  const [editingExpense, setEditingExpense] = useState<{ id: string; month: string } | null>(null);
  const [editAmount, setEditAmount] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);

  useEffect(() => {
    const maxRepeatMonths = Math.max(12, ...expenses.map(exp => exp.repeatMonths || 12));
    const months: string[] = [];
    const [currentYear, currentMonthNum] = currentMonth.split('-').map(Number);

    // Generate months from 6 months ago to maxRepeatMonths in the future
    for (let i = -6; i < maxRepeatMonths; i++) {
      let futureMonth = currentMonthNum + i;
      let futureYear = currentYear;
      while (futureMonth > 12) {
        futureMonth -= 12;
        futureYear += 1;
      }
      while (futureMonth < 1) {
        futureMonth += 12;
        futureYear -= 1;
      }
      months.push(`${futureYear}-${String(futureMonth).padStart(2, '0')}`);
    }
    setAvailableMonths(months);
  }, [currentMonth, expenses]);

  const shouldDisplayExpense = (expense: RecurringExpense, month: string) => {
    const repeatMonths = expense.repeatMonths || 12;
    const [monthYear, monthNum] = month.split('-').map(Number);
    const monthDate = new Date(monthYear, monthNum - 1, 1);
    const creationMonth = new Date(expense.createdAt.getFullYear(), expense.createdAt.getMonth(), 1);
    const diffTime = monthDate.getTime() - creationMonth.getTime();
    const diffMonths = Math.round(diffTime / (1000 * 60 * 60 * 24 * 30.5));
    return diffMonths >= 0 && diffMonths < repeatMonths;
  };

  const isOverdue = (dueDay: number, month: string) => {
    const now = new Date();
    const [year, monthNum] = month.split('-').map(Number);
    const dueDate = new Date(year, monthNum - 1, dueDay);
    return now > dueDate;
  };

  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split('-').map(Number);
    const date = new Date(year, monthNum - 1, 1);
    return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date);
  };

  const getExpenseAmountForMonth = (expense: RecurringExpense, month: string): number | null => {
    if (getMonthlyExpenseValue) return getMonthlyExpenseValue(expense.id, month);
    if (expense.monthlyValues && month in expense.monthlyValues) return expense.monthlyValues[month];
    return expense.amount || null;
  };

  const handleStartEdit = (expense: RecurringExpense, month: string) => {
    setEditingExpense({ id: expense.id, month });
    const value = getExpenseAmountForMonth(expense, month);
    setEditAmount(value !== null ? value.toString() : "");
  };

  const handleSaveEdit = (expense: RecurringExpense) => {
    if (!editingExpense) return;
    const { month } = editingExpense;
    try {
      const amount = editAmount.trim() === "" ? null : parseFloat(editAmount);
      if (setMonthlyExpenseValue) {
        setMonthlyExpenseValue(expense.id, month, amount);
        toast.success(`Valor para ${formatMonth(month)} atualizado`);
      } else if (onEdit) {
        const monthlyValues = { ...(expense.monthlyValues || {}) };
        if (amount === null) delete monthlyValues[month];
        else monthlyValues[month] = amount;
        onEdit({ ...expense, monthlyValues });
        toast.success(`Valor para ${formatMonth(month)} atualizado`);
      }
    } catch (error) {
      toast.error("Erro ao atualizar valor.");
    }
    setEditingExpense(null);
    setEditAmount("");
  };

  const handleCancelEdit = () => {
    setEditingExpense(null);
    setEditAmount("");
  };

  const handleDelete = (id: string) => {
    if (onDelete) {
      onDelete(id);
      toast.success("Despesa fixa excluída.");
    }
  };

  const formatExpenseAmount = (expense: RecurringExpense, month: string) => {
    const value = getExpenseAmountForMonth(expense, month);
    return value === null || value === 0 ? "Não definido" : formatCurrency(value);
  };

  const sortedExpenses = [...expenses].sort((a, b) => a.dueDay - b.dueDay);

  if (sortedExpenses.length === 0) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader><CardTitle>Despesas Recorrentes</CardTitle></CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Não há despesas recorrentes.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-base md:text-lg text-black">
            <Calendar className="mr-2 h-3 w-3 md:h-4 md:w-4" /> 
            Despesas Recorrentes
          </CardTitle>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-32 md:w-48">
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent>
              {availableMonths.map(month => (
                <SelectItem key={month} value={month}>
                  {formatMonth(month)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-3 flex-1 overflow-hidden">
        <div className="h-80 overflow-y-auto space-y-2">
          {sortedExpenses.filter(expense => shouldDisplayExpense(expense, selectedMonth)).map(expense => {
            const paid = isPaid(expense.id, selectedMonth);
            const overdue = !paid && isOverdue(expense.dueDay, selectedMonth);
            const isEditing = editingExpense?.id === expense.id && editingExpense?.month === selectedMonth;
            return (
              <div key={`${expense.id}-${selectedMonth}`} className={cn("p-3 rounded-md border", { "bg-green-50 dark:bg-green-950": paid, "bg-red-50 dark:bg-red-950": overdue && !paid })}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-sm">{expense.description}</h3>
                    <p className="text-xs text-muted-foreground">{expense.category}</p>
                  </div>
                  <Badge variant={paid ? "outline" : overdue ? "destructive" : "secondary"}>
                    {paid ? <CheckCircle2 className="h-3 w-3 mr-1" /> : overdue ? <AlertCircle className="h-3 w-3 mr-1" /> : null}
                    {paid ? "Pago" : overdue ? "Vencido" : "A vencer"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center mt-2">
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <Input type="text" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} className="h-8 w-24" placeholder="Valor" autoFocus />
                      <Button size="sm" onClick={() => handleSaveEdit(expense)}>Salvar</Button>
                      <Button size="sm" variant="ghost" onClick={handleCancelEdit}>Cancelar</Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className={cn("text-sm font-semibold", getExpenseAmountForMonth(expense, selectedMonth) === null && "italic text-muted-foreground")}>
                        {formatExpenseAmount(expense, selectedMonth)}
                      </p>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleStartEdit(expense, selectedMonth)}><Pencil className="h-3 w-3" /></Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Editar valor</p></TooltipContent>
                        </Tooltip>
                        {onDelete && (
                          <AlertDialog>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-6 w-6"><Trash2 className="h-3 w-3 text-red-500" /></Button>
                                </AlertDialogTrigger>
                              </TooltipTrigger>
                              <TooltipContent><p>Excluir despesa</p></TooltipContent>
                            </Tooltip>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Essa ação não pode ser desfeita. Isso excluirá permanentemente a despesa recorrente.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(expense.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Deletar</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </TooltipProvider>
                    </div>
                  )}
                  {!isEditing && getExpenseAmountForMonth(expense, selectedMonth) !== null && (
                    <Button size="sm" variant={paid ? "outline" : "default"} onClick={() => onMarkAsPaid(expense.id, selectedMonth, !paid)}>
                      {paid ? "Desmarcar" : "Pagar"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
          {sortedExpenses.filter(expense => shouldDisplayExpense(expense, selectedMonth)).length === 0 && (
            <p className="text-sm text-muted-foreground italic text-center py-4">Nenhuma despesa recorrente para este mês.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecurringExpensesCard;
