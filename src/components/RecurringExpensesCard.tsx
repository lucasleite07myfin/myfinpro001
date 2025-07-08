import React, { useState, useEffect } from 'react';
import { formatCurrency } from '@/utils/formatters';
import { RecurringExpense } from '@/types/finance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, AlertCircle, Calendar, Pencil, Trash2, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
  const [editingExpense, setEditingExpense] = useState<{id: string, month: string} | null>(null);
  const [editAmount, setEditAmount] = useState<string>("");
  const [showFutureMonths, setShowFutureMonths] = useState<boolean>(true);
  const [displayMonths, setDisplayMonths] = useState<string[]>([]);
  const [expandedMonths, setExpandedMonths] = useState<string[]>([]);
  
  // Generate the next months based on recurring expenses configuration
  useEffect(() => {
    // Determine maximum repeat months
    const maxRepeatMonths = Math.max(
      6, // Minimum 6 months
      ...expenses.map(exp => exp.repeatMonths || 12)
    );
    
    const months: string[] = [currentMonth];
    const [currentYear, currentMonthNum] = currentMonth.split('-').map(Number);
    
    for (let i = 1; i <= maxRepeatMonths; i++) {
      let futureMonth = currentMonthNum + i;
      let futureYear = currentYear;
      
      while (futureMonth > 12) {
        futureMonth = futureMonth - 12;
        futureYear += 1;
      }
      
      months.push(`${futureYear}-${String(futureMonth).padStart(2, '0')}`);
    }
    
    setDisplayMonths(months);
    // Initially expand current month only
    setExpandedMonths([currentMonth]);
  }, [currentMonth, expenses]);
  
  // Check if an expense should be displayed for a given month
  const shouldDisplayExpense = (expense: RecurringExpense, month: string) => {
    // If no repeat months specified, use default of 12 months
    const repeatMonths = expense.repeatMonths || 12;
    
    // Convert month strings to Date objects for comparison
    const [monthYear, monthNum] = month.split('-').map(Number);
    const monthDate = new Date(monthYear, monthNum - 1, 1);
    
    // Get creation month
    const creationMonth = new Date(
      expense.createdAt.getFullYear(),
      expense.createdAt.getMonth(),
      1
    );
    
    // Calculate months difference
    const diffTime = monthDate.getTime() - creationMonth.getTime();
    const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.5));
    
    // Show if within repeat range
    return diffMonths >= 0 && diffMonths < repeatMonths;
  };
  
  // Toggle month expansion
  const toggleMonthExpansion = (month: string) => {
    setExpandedMonths(prev => 
      prev.includes(month) 
        ? prev.filter(m => m !== month) 
        : [...prev, month]
    );
  };

  // Function to check if expense is overdue
  const isOverdue = (dueDay: number, month: string) => {
    const now = new Date();
    const [year, monthNum] = month.split('-').map(Number);
    
    // If we're checking past months
    if (year < now.getFullYear() || 
       (year === now.getFullYear() && monthNum - 1 < now.getMonth())) {
      return true;
    }
    
    // If we're checking current month
    if (year === now.getFullYear() && monthNum - 1 === now.getMonth()) {
      return now.getDate() > dueDay;
    }
    
    // If we're checking future months
    return false;
  };

  // Format due date with month and year
  const formatDueDate = (dueDay: number, month: string) => {
    const [year, monthNum] = month.split('-').map(Number);
    return `${String(dueDay).padStart(2, '0')}/${String(monthNum).padStart(2, '0')}/${year}`;
  };

  // Format month name
  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split('-').map(Number);
    const date = new Date(year, monthNum - 1, 1);
    return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date);
  };

  // Get expense amount for specific month
  const getExpenseAmountForMonth = (expense: RecurringExpense, month: string): number | null => {
    if (getMonthlyExpenseValue) {
      return getMonthlyExpenseValue(expense.id, month);
    }
    
    // Fallback if the prop isn't provided
    if (expense.monthlyValues && month in expense.monthlyValues) {
      return expense.monthlyValues[month];
    }
    return expense.amount || null;
  };

  // Start editing expense
  const handleStartEdit = (expense: RecurringExpense, month: string) => {
    setEditingExpense({ id: expense.id, month });
    
    // Get existing value for this month
    const value = getExpenseAmountForMonth(expense, month);
    setEditAmount(value !== null ? value.toString() : "");
  };

  // Save edit
  const handleSaveEdit = (expense: RecurringExpense) => {
    if (!editingExpense) return;
    
    const { month } = editingExpense;
    
    try {
      // Handle empty string as null (value not defined)
      const amount = editAmount.trim() === "" ? null : parseFloat(editAmount);
      
      // If we're using single value (empty string) or explicit null value
      if (amount === null) {
        // Set month-specific null value if the function is available
        if (setMonthlyExpenseValue) {
          setMonthlyExpenseValue(expense.id, month, null);
          toast.success("Valor personalizado removido. Será necessário definir o valor ao pagar.");
        } 
        // Otherwise update through the main edit function
        else if (onEdit) {
          // Create or update the monthlyValues object
          const monthlyValues = { ...(expense.monthlyValues || {}) };
          delete monthlyValues[month]; // Remove the value for this month
          
          onEdit({
            ...expense,
            monthlyValues
          });
          toast.success("Valor personalizado removido. Será necessário definir o valor ao pagar.");
        }
      }
      // If we're setting a specific value for this month
      else if (amount !== expense.amount || (expense.monthlyValues && expense.monthlyValues[month] !== undefined)) {
        // Use the specific function if available
        if (setMonthlyExpenseValue) {
          setMonthlyExpenseValue(expense.id, month, amount);
          toast.success(`Valor para ${formatMonth(month)} atualizado`);
        }
        // Otherwise update through the main edit function
        else if (onEdit) {
          // Create or update the monthlyValues object
          const monthlyValues = { ...(expense.monthlyValues || {}) };
          monthlyValues[month] = amount;
          
          onEdit({
            ...expense,
            monthlyValues
          });
          toast.success(`Valor para ${formatMonth(month)} atualizado`);
        }
      }
      // If we're setting the default value for all months
      else if (onEdit) {
        onEdit({
          ...expense,
          amount
        });
        toast.success("Valor padrão atualizado para todos os meses");
      }
    } catch (error) {
      toast.error("Erro ao atualizar valor. Verifique o formato.");
    }
    
    setEditingExpense(null);
    setEditAmount("");
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingExpense(null);
    setEditAmount("");
  };

  // Delete expense
  const handleDelete = (id: string) => {
    if (onDelete) {
      if (window.confirm("Tem certeza que deseja excluir esta despesa fixa? Isso a removerá de todos os meses futuros.")) {
        onDelete(id);
        toast.success("Despesa fixa excluída com sucesso");
      }
    }
  };
  
  // Toggle showing future months
  const toggleFutureMonths = () => {
    setShowFutureMonths(prev => !prev);
  };
  
  // Format expense amount for display
  const formatExpenseAmount = (expense: RecurringExpense, month: string) => {
    const value = getExpenseAmountForMonth(expense, month);
    
    if (value === null || value === 0) {
      return "Valor não definido";
    }
    
    return formatCurrency(value);
  };
  
  // Sort expenses by due date
  const sortedExpenses = [...expenses].sort((a, b) => a.dueDay - b.dueDay);
  
  if (sortedExpenses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-md md:text-lg">Despesas Recorrentes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground italic">
            Não há despesas recorrentes cadastradas.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-md md:text-lg flex items-center">
            <Calendar className="mr-2 h-4 w-4" /> 
            <span>Despesas Recorrentes</span>
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleFutureMonths}
            className="text-xs h-7 px-2"
          >
            {showFutureMonths ? "Ocultar Futuros" : "Mostrar Futuros"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-3">
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
          {showFutureMonths ? (
            displayMonths.map(month => (
              <div key={month} className="mb-3">
                <div 
                  className="flex justify-between items-center cursor-pointer border-b border-gray-200 dark:border-gray-700 pb-1 mb-2"
                  onClick={() => toggleMonthExpansion(month)}
                >
                  <h3 className="font-medium text-sm">{formatMonth(month)}</h3>
                  {expandedMonths.includes(month) ? 
                    <ChevronUp className="h-4 w-4" /> : 
                    <ChevronDown className="h-4 w-4" />
                  }
                </div>
                
                {expandedMonths.includes(month) && (
                  <div className="space-y-2">
                    {sortedExpenses.filter(expense => shouldDisplayExpense(expense, month)).map(expense => {
                      const paid = isPaid(expense.id, month);
                      const overdue = !paid && isOverdue(expense.dueDay, month);
                      const isEditing = editingExpense?.id === expense.id && editingExpense?.month === month;
                      
                      return (
                        <div
                          key={`${expense.id}-${month}`}
                          className={cn(
                            "p-3 rounded-md border border-gray-200",
                            {
                              "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800": paid,
                              "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800": overdue && !paid,
                              "bg-white dark:bg-gray-800": !paid && !overdue
                            }
                          )}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <div className="flex-grow">
                              <div className="flex items-center gap-1">
                                <h3 className="font-medium text-sm">{expense.description}</h3>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Clock className="h-3 w-3 text-muted-foreground cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent side="top" align="center" className="text-xs">
                                      Repete por {expense.repeatMonths || 12} meses
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{expense.category}</p>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Badge variant={paid ? "outline" : overdue ? "destructive" : "secondary"} className="ml-1">
                                {paid ? (
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                ) : overdue ? (
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                ) : null}
                                {paid ? "Pago" : overdue ? "Vencido" : "A vencer"}
                              </Badge>
                              {onDelete && month === currentMonth && (
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="h-6 w-6 hover:bg-red-100 dark:hover:bg-red-900"
                                  onClick={() => handleDelete(expense.id)}
                                >
                                  <Trash2 className="h-3 w-3 text-red-600 dark:text-red-400" />
                                </Button>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center mt-2">
                            <div>
                              {isEditing ? (
                                <div className="flex space-x-2 items-center">
                                  <Input 
                                    type="text"
                                    value={editAmount}
                                    onChange={(e) => setEditAmount(e.target.value)}
                                    className="w-24 h-7 text-sm py-1"
                                    placeholder="Valor ou vazio"
                                    autoFocus
                                  />
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => handleSaveEdit(expense)}
                                    className="h-7 px-2"
                                  >
                                    Salvar
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={handleCancelEdit}
                                    className="h-7 px-2"
                                  >
                                    Cancelar
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-2">
                                  <p className={cn(
                                    "text-sm font-semibold",
                                    getExpenseAmountForMonth(expense, month) === null ? "italic text-gray-500" : ""
                                  )}>
                                    {formatExpenseAmount(expense, month)}
                                  </p>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    className="h-6 w-6 hover:bg-blue-100 dark:hover:bg-blue-900"
                                    onClick={() => handleStartEdit(expense, month)}
                                  >
                                    <Pencil className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                  </Button>
                                </div>
                              )}
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Vence dia {formatDueDate(expense.dueDay, month)}
                              </p>
                            </div>
                            
                            {!isEditing && getExpenseAmountForMonth(expense, month) !== null && (
                              <Button 
                                variant={paid ? "outline" : "default"} 
                                size="sm"
                                onClick={() => onMarkAsPaid(expense.id, month, !paid)}
                                className={cn(
                                  "text-xs h-7 px-2",
                                  paid ? "hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900" : ""
                                )}
                              >
                                {paid ? "Desfazer" : "Marcar como Pago"}
                              </Button>
                            )}
                            
                            {!isEditing && getExpenseAmountForMonth(expense, month) === null && !paid && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-xs h-7 px-2"
                                onClick={() => handleStartEdit(expense, month)}
                              >
                                Definir valor
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    
                    {sortedExpenses.filter(expense => shouldDisplayExpense(expense, month)).length === 0 && (
                      <p className="text-sm text-muted-foreground italic">
                        Não há despesas recorrentes para {formatMonth(month)}.
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            // Show only current month if future months are hidden
            sortedExpenses.filter(expense => shouldDisplayExpense(expense, currentMonth)).map(expense => {
              const paid = isPaid(expense.id, currentMonth);
              const overdue = !paid && isOverdue(expense.dueDay, currentMonth);
              const isEditing = editingExpense?.id === expense.id && editingExpense?.month === currentMonth;
              
              return (
                <div
                  key={expense.id}
                  className={cn(
                    "p-3 rounded-md border border-gray-200",
                    {
                      "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800": paid,
                      "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800": overdue && !paid,
                      "bg-white dark:bg-gray-800": !paid && !overdue
                    }
                  )}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex-grow">
                      <div className="flex items-center gap-1">
                        <h3 className="font-medium text-sm">{expense.description}</h3>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Clock className="h-3 w-3 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="top" align="center" className="text-xs">
                              Repete por {expense.repeatMonths || 12} meses
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{expense.category}</p>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Badge variant={paid ? "outline" : overdue ? "destructive" : "secondary"} className="ml-1">
                        {paid ? (
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                        ) : overdue ? (
                          <AlertCircle className="h-3 w-3 mr-1" />
                        ) : null}
                        {paid ? "Pago" : overdue ? "Vencido" : "A vencer"}
                      </Badge>
                      {onDelete && (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-6 w-6 hover:bg-red-100 dark:hover:bg-red-900"
                          onClick={() => handleDelete(expense.id)}
                        >
                          <Trash2 className="h-3 w-3 text-red-600 dark:text-red-400" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mt-2">
                    <div>
                      {isEditing ? (
                        <div className="flex space-x-2 items-center">
                          <Input 
                            type="text"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            className="w-24 h-7 text-sm py-1"
                            placeholder="Valor ou vazio"
                            autoFocus
                          />
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleSaveEdit(expense)}
                            className="h-7 px-2"
                          >
                            Salvar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={handleCancelEdit}
                            className="h-7 px-2"
                          >
                            Cancelar
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <p className={cn(
                            "text-sm font-semibold",
                            getExpenseAmountForMonth(expense, currentMonth) === null ? "italic text-gray-500" : ""
                          )}>
                            {formatExpenseAmount(expense, currentMonth)}
                          </p>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-6 w-6 hover:bg-blue-100 dark:hover:bg-blue-900"
                            onClick={() => handleStartEdit(expense, currentMonth)}
                          >
                            <Pencil className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                          </Button>
                        </div>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Vence dia {formatDueDate(expense.dueDay, currentMonth)}
                      </p>
                    </div>
                    
                    {!isEditing && getExpenseAmountForMonth(expense, currentMonth) !== null && (
                      <Button 
                        variant={paid ? "outline" : "default"} 
                        size="sm"
                        onClick={() => onMarkAsPaid(expense.id, currentMonth, !paid)}
                        className={cn(
                          "text-xs h-7 px-2",
                          paid ? "hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900" : ""
                        )}
                      >
                        {paid ? "Desfazer" : "Marcar como Pago"}
                      </Button>
                    )}
                    
                    {!isEditing && getExpenseAmountForMonth(expense, currentMonth) === null && !paid && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-xs h-7 px-2"
                        onClick={() => handleStartEdit(expense, currentMonth)}
                      >
                        Definir valor
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecurringExpensesCard;
