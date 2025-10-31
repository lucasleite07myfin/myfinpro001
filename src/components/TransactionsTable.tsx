import React, { useRef } from 'react';
import { format } from 'date-fns';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Transaction, PAYMENT_METHODS } from '@/types/finance';
import { formatCurrency } from '@/utils/formatters';
import { sanitizeText } from '@/utils/xssSanitizer';
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
  const handleEditClick = (transaction: Transaction) => {
    if (onEdit) {
      onEdit(transaction);
    }
  };
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
        <Badge variant="outline" className="flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200">
          <Clock className="h-3 w-3" />
          <span className="text-xs">Despesa Fixa</span>
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

  // Virtualization setup
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: transactions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 5,
  });

  return (
    <div className="rounded-xl border border-neutral-200 overflow-hidden shadow-sm bg-white">
      {/* Fixed Header */}
      <div className="border-b border-neutral-200">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-neutral-50 to-neutral-100 border-b border-neutral-200">
              <TableHead className="font-semibold text-neutral-700 py-4 px-6">Data</TableHead>
              <TableHead className="font-semibold text-neutral-700 py-4 px-6">Descrição</TableHead>
              <TableHead className="font-semibold text-neutral-700 py-4 px-6">Categoria</TableHead>
              <TableHead className="text-right font-semibold text-neutral-700 py-4 px-6">Valor</TableHead>
              <TableHead className="font-semibold text-neutral-700 py-4 px-6">Pagamento</TableHead>
              <TableHead className="text-center font-semibold text-neutral-700 py-4 px-6 w-[120px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      </div>
      
      {/* Virtualized Scrollable Body */}
      <div 
        ref={parentRef}
        className="overflow-y-auto" 
        style={{ maxHeight: 'calc(100vh - 400px)', minHeight: '300px' }}
      >
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-neutral-500">
            <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center">
              <Clock className="h-6 w-6 text-neutral-400" />
            </div>
            <p className="text-sm font-medium mt-2">{getEmptyMessage()}</p>
          </div>
        ) : (
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const transaction = transactions[virtualRow.index];
              const index = virtualRow.index;
              
              return (
                <div
                  key={transaction.id}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <Table>
                    <TableBody>
                      <TableRow className={`hover:bg-neutral-50/50 transition-colors border-b border-neutral-100 ${index % 2 === 0 ? 'bg-white' : 'bg-neutral-25'}`}>
                        <TableCell className="font-medium text-neutral-900 py-4 px-6">
                          <div className="text-sm font-medium">
                            {format(transaction.date, 'dd/MM/yyyy')}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="flex flex-col gap-2">
                            <span className="font-medium text-neutral-900 text-sm">{sanitizeText(transaction.description)}</span>
                            {renderBadge ? renderBadge(transaction) : defaultRenderBadge(transaction)}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <span className="text-sm text-neutral-600 bg-neutral-100 px-2 py-1 rounded-md">
                            {sanitizeText(formatCategoryName(transaction.category))}
                          </span>
                        </TableCell>
                        <TableCell className={`text-right font-semibold py-4 px-6 ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                          <span className="text-sm font-mono">
                            {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                          </span>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <span className="text-xs text-neutral-500 bg-neutral-50 px-2 py-1 rounded-md">
                            {transaction.paymentMethod ? PAYMENT_METHODS[transaction.paymentMethod] : 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="flex justify-center space-x-1">
                            {onEdit && !transaction.isRecurringPayment && (
                              <Button
                                onClick={() => handleEditClick(transaction)}
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            )}
                            {onDelete && (
                              <Button
                                onClick={() => onDelete(transaction.id)}
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                                title={transaction.isRecurringPayment ? 
                                  "Excluir esta transação (para cancelar o pagamento, use o card de despesas fixas)" : 
                                  "Excluir esta transação"}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionsTable;
