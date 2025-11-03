import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import AdminLayout from '@/components/admin/AdminLayout';
import { 
  Users, 
  CreditCard, 
  Tag, 
  TrendingUp, 
  DollarSign,
  UserCheck,
  UserX,
  Activity
} from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { toast } from 'sonner';

interface DashboardStats {
  totalUsers: number;
  activeSubscriptions: number;
  trialingSubscriptions: number;
  canceledSubscriptions: number;
  activeCoupons: number;
  monthlyRevenue: number;
  totalTransactions: number;
}

const AdminDashboard = () => {
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardStats = async () => {
    try {
      console.log('🔍 Fetching dashboard stats via Edge Function...');
      
      const { data, error } = await supabase.functions.invoke('admin-dashboard-stats');
      
      if (error) {
        console.error('❌ Error fetching dashboard stats:', error);
        throw error;
      }

      console.log('✅ Dashboard stats received:', data);

      setStats({
        totalUsers: data.users.total,
        activeSubscriptions: data.subscriptions.active,
        trialingSubscriptions: data.subscriptions.trialing,
        canceledSubscriptions: data.subscriptions.canceled,
        activeCoupons: data.coupons.active,
        monthlyRevenue: data.financial.monthly_revenue,
        totalTransactions: data.financial.total_transactions,
      });

      console.log('✅ Dashboard stats loaded successfully');
    } catch (error) {
      console.error('❌ Error loading dashboard stats:', error);
      toast.error('Erro ao carregar estatísticas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && isAdmin && !roleLoading) {
      fetchDashboardStats();
    }
  }, [user, isAdmin, roleLoading]);

  if (!user || roleLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Administrativo</h1>
          <p className="text-muted-foreground">Visão geral do sistema</p>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
        ) : stats && (
          <>
            {/* Primeira linha: Usuários */}
            <div className="grid md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total de Usuários
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Usuários registrados
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Assinaturas Ativas
                  </CardTitle>
                  <UserCheck className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {stats.activeSubscriptions}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Pagando mensalmente
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Em Trial
                  </CardTitle>
                  <Activity className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.trialingSubscriptions}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Período de teste
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Canceladas
                  </CardTitle>
                  <UserX className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-muted-foreground">
                    {stats.canceledSubscriptions}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Assinaturas canceladas
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Segunda linha: Financeiro e Cupons */}
            <div className="grid md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Receita Mensal
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(stats.monthlyRevenue)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    MRR estimado
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Cupons Ativos
                  </CardTitle>
                  <Tag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeCoupons}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cupons disponíveis
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Transações
                  </CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalTransactions}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total registradas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Taxa de Conversão
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.totalUsers > 0 
                      ? ((stats.activeSubscriptions / stats.totalUsers) * 100).toFixed(1)
                      : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Trial → Pago
                  </p>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
