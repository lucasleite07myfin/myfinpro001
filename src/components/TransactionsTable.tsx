import React, { useRef } from 'react';
import { format } from 'date-fns';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Transaction, PAYMENT_METHODS } from '@/types/finance';
import { formatCurrency } from '@/utils/formatters';
import { sanitizeText } from '@/utils/xssSanitizer';
import { useBusinessPermissions } from '@/hooks/useBusinessPermissions';
import { useAppMode } from '@/contexts/AppModeContext';
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
  const { mode } = useAppMode();
  const { canEdit, canDelete } = useBusinessPermissions();
  
  // Verificar permissões apenas em modo business
  const canEditTransactions = mode === 'personal' || canEdit('transactions');
  const canDeleteTransactions = mode === 'personal' || canDelete('transactions');

  const handleEditClick = (transaction: Transaction) => {
    if (onEdit && canEditTransactions) {
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

  // Fixed column widths for alignment
  const columnWidths = {
    data: 'w-[110px] min-w-[110px]',
    descricao: 'w-[200px] min-w-[200px]',
    categoria: 'w-[140px] min-w-[140px]',
    valor: 'w-[130px] min-w-[130px]',
    pagamento: 'w-[120px] min-w-[120px]',
    acoes: 'w-[120px] min-w-[120px]'
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
    <div className="overflow-x-auto -mx-4 px-4 md:overflow-visible">
      <div className="rounded-xl border border-neutral-200 overflow-hidden shadow-sm bg-white min-w-[320px] md:min-w-0">
      {/* Fixed Header */}
      <div className="border-b border-neutral-200">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-neutral-50 to-neutral-100 border-b border-neutral-200">
              <TableHead className={`${columnWidths.data} font-semibold text-neutral-700 py-4 px-6`}>Data</TableHead>
              <TableHead className={`${columnWidths.descricao} font-semibold text-neutral-700 py-4 px-6`}>Descrição</TableHead>
              <TableHead className={`${columnWidths.categoria} font-semibold text-neutral-700 py-4 px-6`}>Categoria</TableHead>
              <TableHead className={`${columnWidths.valor} text-right font-semibold text-neutral-700 py-4 px-6`}>Valor</TableHead>
              <TableHead className={`${columnWidths.pagamento} font-semibold text-neutral-700 py-4 px-6`}>Pagamento</TableHead>
              <TableHead className={`${columnWidths.acoes} text-center font-semibold text-neutral-700 py-4 px-6`}>Ações</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      </div>
      
      {/* Virtualized Scrollable Body */}
      <div 
        ref={parentRef}
        className="overflow-y-auto" 
        style={{ height: '500px' }}
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
                      <TableRow 
                        className={`hover:bg-neutral-50/50 transition-colors border-b border-neutral-100 ${index % 2 === 0 ? 'bg-white' : 'bg-neutral-25'}`}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if ((e.key === 'Enter' || e.key === ' ') && onEdit && !transaction.isRecurringPayment) {
                            handleEditClick(transaction);
                          }
                        }}
                      >
                        <TableCell className={`${columnWidths.data} font-medium text-neutral-900 py-4 px-6`}>
                          <div className="text-sm font-medium">
                            {format(transaction.date, 'dd/MM/yyyy')}
                          </div>
                        </TableCell>
                        <TableCell className={`${columnWidths.descricao} py-4 px-6`}>
                          <div className="flex flex-col gap-2">
                            <span className="font-medium text-neutral-900 text-sm">{sanitizeText(transaction.description)}</span>
                            {renderBadge ? renderBadge(transaction) : defaultRenderBadge(transaction)}
                          </div>
                        </TableCell>
                        <TableCell className={`${columnWidths.categoria} py-4 px-6`}>
                          <span className="text-sm text-neutral-600 bg-neutral-100 px-2 py-1 rounded-md">
                            {sanitizeText(formatCategoryName(transaction.category))}
                          </span>
                        </TableCell>
                        <TableCell className={`${columnWidths.valor} text-right font-semibold py-4 px-6 ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                          <span className="text-sm font-mono">
                            {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                          </span>
                        </TableCell>
                        <TableCell className={`${columnWidths.pagamento} py-4 px-6`}>
                          <span className="text-xs text-neutral-500 bg-neutral-50 px-2 py-1 rounded-md">
                            {transaction.paymentMethod ? PAYMENT_METHODS[transaction.paymentMethod] : 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell className={`${columnWidths.acoes} py-4 px-6`}>
                          <div className="flex justify-center space-x-1">
                            {onEdit && !transaction.isRecurringPayment && canEditTransactions && (
                              <Button
                                onClick={() => handleEditClick(transaction)}
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                                aria-label="Editar transação"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            )}
                            {onDelete && canDeleteTransactions && (
                              <Button
                                onClick={() => onDelete(transaction.id)}
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                                aria-label={transaction.isRecurringPayment ? 
                                  "Excluir esta transação (para cancelar o pagamento, use o card de despesas fixas)" : 
                                  "Excluir esta transação"}
                                title={transaction.isRecurringPayment ? 
                                  "Excluir esta transação (para cancelar o pagamento, use o card de despesas fixas)" : 
                                  "Excluir esta transação"}
                                disabled={!canDeleteTransactions}
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
    </div>
  );
};

export default TransactionsTable;
