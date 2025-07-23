
import React, { useState } from 'react';
import MainLayout from '@/components/MainLayout';
import { useFinance } from '@/contexts/FinanceContext';
import { useBusiness } from '@/contexts/BusinessContext';
import { useAppMode } from '@/contexts/AppModeContext';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { PlusCircle, PiggyBank, Edit, Trash2 } from 'lucide-react';
import AddGoalModal from '@/components/AddGoalModal';
import { TooltipProvider } from '@/components/ui/tooltip';
import TooltipHelper from '@/components/TooltipHelper';
import { tooltipContent } from '@/data/tooltipContent';
import { Goal } from '@/types/finance';

const Goals: React.FC = () => {
  const { mode } = useAppMode();
  // Use either finance or business context based on current mode
  const financeContext = mode === 'personal' ? useFinance() : useBusiness();
  const { goals, deleteGoal } = financeContext;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setIsModalOpen(true);
  };

  const handleDeleteGoal = (goalId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta meta?')) {
      deleteGoal(goalId);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingGoal(null);
  };

  return (
    <MainLayout>
      <TooltipProvider>
        <div className="mb-4 md:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <h1 className="text-xl md:text-2xl font-bold text-neutral-800 mb-2 sm:mb-0">Metas & Poupança</h1>
          <TooltipHelper content={tooltipContent.actions.add}>
            <Button onClick={() => setIsModalOpen(true)} className="flex items-center w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" />
              Nova Meta
            </Button>
          </TooltipHelper>
        </div>
        
        {goals.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-neutral-500 mb-4">
              Você ainda não possui metas financeiras.
            </p>
            <TooltipHelper content={tooltipContent.actions.add}>
              <Button onClick={() => setIsModalOpen(true)}>
                Criar primeira meta
              </Button>
            </TooltipHelper>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {goals.map((goal) => {
              const percentage = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
              const remainingAmount = goal.targetAmount - goal.currentAmount;
              
              return (
                <Card key={goal.id} className="overflow-hidden">
                  <CardHeader className="pb-2 p-3 md:p-4">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base md:text-lg">{goal.name}</CardTitle>
                      <div className="flex gap-1">
                        <TooltipHelper content="Editar meta">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditGoal(goal)}
                            className="h-8 w-8 p-0 hover:bg-muted"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TooltipHelper>
                        <TooltipHelper content="Excluir meta">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteGoal(goal.id)}
                            className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipHelper>
                      </div>
                    </div>
                  </CardHeader>
                    <CardContent className="p-3 md:p-4 pt-0">
                      <div className="mb-3 md:mb-4">
                        <div className="flex justify-between mb-1">
                          <span className="text-xs md:text-sm text-neutral-600">Progresso</span>
                          <span className="text-xs md:text-sm font-medium">{percentage.toFixed(0)}%</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                      
                      <div className="space-y-1 text-xs md:text-sm">
                        <div className="flex justify-between">
                          <span>Meta:</span>
                          <span className="font-medium">{formatCurrency(goal.targetAmount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Acumulado:</span>
                          <span className="font-medium text-income">{formatCurrency(goal.currentAmount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Falta:</span>
                          <span className="font-medium text-expense">{formatCurrency(remainingAmount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Data alvo:</span>
                          <span className="font-medium">{formatDate(goal.targetDate)}</span>
                        </div>
                        {goal.savingLocation && (
                          <div className="flex justify-between items-center">
                            <span>Local:</span>
                            <span className="font-medium flex items-center">
                              <PiggyBank className="mr-1 h-3 w-3" /> 
                              {goal.savingLocation}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
              );
            })}
          </div>
        )}
        
        <AddGoalModal 
          open={isModalOpen} 
          onOpenChange={handleCloseModal}
          initialData={editingGoal}
          mode={editingGoal ? 'edit' : 'add'}
        />
      </TooltipProvider>
    </MainLayout>
  );
};

export default Goals;
