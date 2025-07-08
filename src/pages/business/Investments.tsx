
import React, { useState } from 'react';
import MainLayout from '@/components/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBusiness } from '@/contexts/BusinessContext';
import { Progress } from '@/components/ui/progress';
import { formatCurrency, formatPercent } from '@/utils/formatters';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, CalendarClock } from 'lucide-react';
import { format, addMonths } from 'date-fns';
import AddInvestmentModal, { Investment } from '@/components/AddInvestmentModal';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const Investments: React.FC = () => {
  const { investments, updatePaidInstallments, deleteInvestment } = useBusiness();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [investmentToDelete, setInvestmentToDelete] = useState<string | null>(null);

  const handleAddClick = () => {
    setEditingInvestment(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (investment: Investment) => {
    setEditingInvestment(investment);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setInvestmentToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (investmentToDelete) {
      deleteInvestment(investmentToDelete);
      toast.success('Investimento excluído com sucesso!');
      setDeleteDialogOpen(false);
      setInvestmentToDelete(null);
    }
  };

  const handlePaidUpdate = (investment: Investment, increment: boolean) => {
    const newPaidCount = increment 
      ? Math.min(investment.paidInstallments + 1, investment.installments)
      : Math.max(investment.paidInstallments - 1, 0);
    
    updatePaidInstallments(investment.id, newPaidCount);
    
    if (increment && newPaidCount === investment.installments) {
      toast.success('Todas as parcelas foram pagas!');
    }
  };

  const getNextPaymentDate = (investment: Investment) => {
    if (investment.paidInstallments >= investment.installments) {
      return 'Pago totalmente';
    }
    
    const startDate = new Date(investment.startDate);
    const nextPaymentDate = addMonths(startDate, investment.paidInstallments);
    return format(nextPaymentDate, 'dd/MM/yyyy');
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Investimentos</h1>
          <Button onClick={handleAddClick} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Investimento
          </Button>
        </div>
        
        {investments.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-muted-foreground">
                Você ainda não tem investimentos cadastrados.
                Clique em "Adicionar Investimento" para começar.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {investments.map(investment => (
              <Card key={investment.id} className="overflow-hidden">
                <CardHeader className="pb-2 flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{investment.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {investment.type}
                    </p>
                  </div>
                  <div className="flex space-x-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleEditClick(investment)}
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDeleteClick(investment.id)}
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Valor total:</span>
                      <span className="font-semibold">{formatCurrency(investment.value)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Parcelas:</span>
                      <span className="font-semibold">{investment.paidInstallments} de {investment.installments}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Valor da parcela:</span>
                      <span className="font-semibold">{formatCurrency(investment.installmentValue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Próximo pagamento:</span>
                      <span className="font-semibold flex items-center gap-1">
                        <CalendarClock className="h-4 w-4" />
                        {getNextPaymentDate(investment)}
                      </span>
                    </div>
                    <div className="pt-2">
                      <div className="flex justify-between mb-1 text-xs">
                        <span>Progresso</span>
                        <span>{Math.round((investment.paidInstallments / investment.installments) * 100)}%</span>
                      </div>
                      <Progress 
                        value={(investment.paidInstallments / investment.installments) * 100} 
                        className="h-2"
                      />
                    </div>
                    
                    <div className="pt-2 flex justify-between">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handlePaidUpdate(investment, false)}
                        disabled={investment.paidInstallments <= 0}
                      >
                        -
                      </Button>
                      <span className="py-2 flex items-center">
                        {investment.paidInstallments === investment.installments 
                          ? "Pago totalmente"
                          : `Faltam ${investment.installments - investment.paidInstallments} parcelas`
                        }
                      </span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handlePaidUpdate(investment, true)}
                        disabled={investment.paidInstallments >= investment.installments}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AddInvestmentModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen} 
        editingInvestment={editingInvestment}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este investimento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default Investments;
