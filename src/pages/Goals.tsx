import React, { useState } from 'react';
import MainLayout from '@/components/MainLayout';
import { useFinance } from '@/contexts/FinanceContext';
import { useBusiness } from '@/contexts/BusinessContext';
import { useAppMode } from '@/contexts/AppModeContext';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { PlusCircle, PiggyBank, Edit, Trash2, Target, Calendar, TrendingUp, Coins } from 'lucide-react';
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
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setIsModalOpen(true);
  };

  const handleDeleteGoal = (goalId: string) => {
    deleteGoal(goalId);
    setGoalToDelete(null);
  };

  const confirmDeleteGoal = (goal: Goal) => {
    setGoalToDelete(goal);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingGoal(null);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const getStatusBadge = (percentage: number) => {
    if (percentage >= 100) return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Concluída</Badge>;
    if (percentage >= 75) return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Quase lá</Badge>;
    if (percentage >= 50) return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">No caminho</Badge>;
    return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Iniciando</Badge>;
  };

  return (
    <MainLayout>
      <TooltipProvider>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
                <Target className="h-6 w-6 text-[#EE680D]" />
                Metas & Poupança
              </h1>
              <p className="text-muted-foreground mt-1">
                Acompanhe o progresso das suas metas financeiras
              </p>
            </div>
            <TooltipHelper content={tooltipContent.actions.add}>
              <Button 
                onClick={() => setIsModalOpen(true)} 
                className="flex items-center gap-2 bg-[#EE680D] hover:bg-[#EE680D]/90"
              >
                <PlusCircle className="h-4 w-4" />
                Nova Meta
              </Button>
            </TooltipHelper>
          </div>

          {/* Stats Overview */}
          {goals.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Target className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total de Metas</p>
                      <p className="text-2xl font-bold">{goals.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Coins className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Poupado</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(goals.reduce((sum, goal) => sum + goal.currentAmount, 0))}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Metas Concluídas</p>
                      <p className="text-2xl font-bold">
                        {goals.filter(goal => (goal.currentAmount / goal.targetAmount) >= 1).length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* Goals Grid */}
          {goals.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 bg-muted rounded-full">
                    <Target className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Nenhuma meta criada</h3>
                    <p className="text-muted-foreground mb-4">
                      Comece definindo suas metas financeiras para acompanhar seu progresso.
                    </p>
                    <TooltipHelper content={tooltipContent.actions.add}>
                      <Button onClick={() => setIsModalOpen(true)} className="bg-[#EE680D] hover:bg-[#EE680D]/90">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Criar primeira meta
                      </Button>
                    </TooltipHelper>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {goals.map((goal) => {
                const percentage = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
                const remainingAmount = goal.targetAmount - goal.currentAmount;
                
                return (
                  <Card key={goal.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{goal.name}</CardTitle>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(percentage)}
                          </div>
                        </div>
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
                              onClick={() => confirmDeleteGoal(goal)}
                              className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipHelper>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {/* Progress Section */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Progresso</span>
                          <span className="font-medium">{percentage.toFixed(1)}%</span>
                        </div>
                        <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary">
                          <div 
                            className={`h-full transition-all duration-300 ${getProgressColor(percentage)}`}
                            style={{ width: `${Math.min(100, percentage)}%` }}
                          />
                        </div>
                      </div>
                      
                      {/* Financial Details */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">Meta</p>
                            <p className="font-semibold text-sm">{formatCurrency(goal.targetAmount)}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">Atual</p>
                            <p className="font-semibold text-sm text-green-600">{formatCurrency(goal.currentAmount)}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">Falta</p>
                            <p className="font-semibold text-sm text-orange-600">{formatCurrency(remainingAmount)}</p>
                          </div>
                        </div>
                        
                        {/* Additional Info */}
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>Data alvo</span>
                            </div>
                            <span className="font-medium">{formatDate(goal.targetDate)}</span>
                          </div>
                          
                          {goal.savingLocation && (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <PiggyBank className="h-4 w-4" />
                                <span>Local</span>
                              </div>
                              <span className="font-medium">{goal.savingLocation}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
        
        <AddGoalModal 
          open={isModalOpen} 
          onOpenChange={handleCloseModal}
          initialData={editingGoal}
          mode={editingGoal ? 'edit' : 'add'}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!goalToDelete} onOpenChange={() => setGoalToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-destructive" />
                Excluir Meta
              </AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir a meta "{goalToDelete?.name}"?
                <br />
                <span className="text-sm text-muted-foreground mt-2 block">
                  Esta ação não pode ser desfeita. Todos os dados relacionados a esta meta serão perdidos permanentemente.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => goalToDelete && handleDeleteGoal(goalToDelete.id)}
                className="bg-destructive hover:bg-destructive/90"
              >
                Excluir Meta
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TooltipProvider>
    </MainLayout>
  );
};

export default Goals;
