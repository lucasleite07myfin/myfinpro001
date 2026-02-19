import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CreditCard, Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import type { Subscription, SubscriptionStatus, PlanType } from '@/types/subscription';

interface SubscriptionWithEmail extends Subscription {
  user_email?: string;
}

const AdminSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithEmail[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSubscriptions = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-list-subscriptions');
      
      if (error) throw error;

      const subsWithEmail: SubscriptionWithEmail[] = data.subscriptions.map((sub: any) => ({
        ...sub,
        status: sub.status as SubscriptionStatus,
        plan_type: sub.plan_type as PlanType | null,
      }));

      setSubscriptions(subsWithEmail);
    } catch (error) {
      toast.error('Erro ao carregar assinaturas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Ativo</Badge>;
      case 'trialing':
        return <Badge className="bg-blue-500">Trial</Badge>;
      case 'past_due':
        return <Badge className="bg-yellow-500">Vencido</Badge>;
      case 'canceled':
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="secondary">Inativo</Badge>;
    }
  };

  const getPlanBadge = (planType: string | null) => {
    if (!planType) return <Badge variant="outline">Nenhum</Badge>;
    
    return planType === 'annual' 
      ? <Badge variant="outline" className="border-primary">Anual</Badge>
      : <Badge variant="outline">Mensal</Badge>;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Assinaturas</h1>
          <p className="text-muted-foreground">Visualize todas as assinaturas da plataforma</p>
        </div>

        {/* Estatísticas rápidas */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subscriptions.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ativas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {subscriptions.filter(s => s.status === 'active').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Em Trial
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {subscriptions.filter(s => s.status === 'trialing').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Canceladas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground">
                {subscriptions.filter(s => s.status === 'canceled').length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Todas as Assinaturas</CardTitle>
            <CardDescription>
              Lista completa de assinaturas e seus status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16" />)}
              </div>
            ) : subscriptions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Nenhuma assinatura encontrada</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead>Início</TableHead>
                      <TableHead>Término</TableHead>
                      <TableHead>Cancelar no fim?</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell className="font-medium">
                          {sub.user_email}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(sub.status)}
                        </TableCell>
                        <TableCell>
                          {getPlanBadge(sub.plan_type)}
                        </TableCell>
                        <TableCell>
                          {sub.current_period_start ? (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {format(new Date(sub.current_period_start), "dd/MM/yyyy", { locale: ptBR })}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {sub.current_period_end ? (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {format(new Date(sub.current_period_end), "dd/MM/yyyy", { locale: ptBR })}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {sub.cancel_at_period_end ? (
                            <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                              Sim
                            </Badge>
                          ) : (
                            <Badge variant="outline">Não</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminSubscriptions;
