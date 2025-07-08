
import React from 'react';
import { format } from 'date-fns';
import { Transaction, PAYMENT_METHODS } from '@/types/finance';
import { formatCurrency } from '@/utils/formatters';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TransactionsTableProps {
  transactions: Transaction[];
  onDelete?: (id: string) => void; 
  onEdit?: (transaction: Transaction) => void;
  type?: 'income' | 'expense' | 'all';
  renderBadge?: (transaction: Transaction) => React.ReactNode;
}

const TransactionsTable: React.FC<TransactionsTableProps> = ({ 
  transactions, 
  onDelete, 
  onEdit,
  type = 'all',
  renderBadge 
}) => {
  // No transactions message based on type
  const getEmptyMessage = () => {
    switch (type) {
      case 'income':
        return 'Nenhuma receita encontrada para o período selecionado.';
      case 'expense':
        return 'Nenhuma despesa encontrada para o período selecionado.';
      default:
        return 'Nenhuma transação encontrada para o período selecionado.';
    }
  };

  // Default badge rendering if not provided by parent
  const defaultRenderBadge = (transaction: Transaction) => {
    if (transaction.isRecurringPayment) {
      return (
        <Badge variant="outline" className="flex items-center gap-1 bg-blue-500/10">
          <Clock className="h-3 w-3" />
          <span>Despesa Fixa</span>
        </Badge>
      );
    }
    return null;
  };

  // Format category name for display (removes "Outros: " prefix if present)
  const formatCategoryName = (categoryName: string) => {
    if (categoryName.startsWith('Outros: ')) {
      return categoryName.substring(7);
    }
    return categoryName;
  };

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-inter">Data</TableHead>
            <TableHead className="font-inter">Descrição</TableHead>
            <TableHead className="font-inter">Categoria</TableHead>
            <TableHead className="text-right font-inter">Valor</TableHead>
            <TableHead className="font-inter">Forma de Pagamento</TableHead>
            <TableHead className="text-right w-[100px] font-inter">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-10 text-muted-foreground font-inter">
                {getEmptyMessage()}
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell className="font-medium font-inter">
                  {format(transaction.date, 'dd/MM/yyyy')}
                </TableCell>
                <TableCell className="font-inter">
                  <div className="flex flex-col gap-1">
                    {transaction.description}
                    {renderBadge ? renderBadge(transaction) : defaultRenderBadge(transaction)}
                  </div>
                </TableCell>
                <TableCell className="font-inter">
                  {formatCategoryName(transaction.category)}
                </TableCell>
                <TableCell className={`text-right font-mono font-inter ${transaction.type === 'income' ? 'text-income-force' : 'text-expense-force'}`}>
                  {formatCurrency(transaction.amount)}
                </TableCell>
                <TableCell className="font-inter">
                  {transaction.paymentMethod ? PAYMENT_METHODS[transaction.paymentMethod] : '-'}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end space-x-2">
                    {onEdit && !transaction.isRecurringPayment && (
                      <Button
                        onClick={() => onEdit(transaction)}
                        variant="ghost"
                        size="icon"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        onClick={() => onDelete(transaction.id)}
                        variant="ghost"
                        size="icon"
                        title={transaction.isRecurringPayment ? 
                          "Excluir esta transação (para cancelar o pagamento, use o card de despesas fixas)" : 
                          "Excluir esta transação"}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default TransactionsTable;
