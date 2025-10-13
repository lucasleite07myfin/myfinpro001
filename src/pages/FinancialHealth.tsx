import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/MainLayout';
import FinancialHealthCards from '@/components/FinancialHealthCards';
import { HealthSnapshot } from '@/types/alerts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const FinancialHealth: React.FC = () => {
  const { user } = useAuth();
  const [currentHealth, setCurrentHealth] = useState<HealthSnapshot | null>(null);
  const [historicalData, setHistoricalData] = useState<HealthSnapshot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadHealthData();
    }
  }, [user]);

  const loadHealthData = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('health_snapshots')
        .select('*')
        .eq('user_id', user?.id)
        .order('snapshot_date', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        // Convert database format to component format
        const snapshots: HealthSnapshot[] = data.map(item => ({
          id: item.id,
          snapshotDate: new Date(item.snapshot_date),
          savingsRatePct: item.savings_rate_pct || 0,
          debtIncomePct: item.debt_income_pct || 0,
          monthsEmergencyFund: item.months_emergency_fund || 0,
          netWorthGrowth12m: item.net_worth_growth_12m || 0,
          createdAt: new Date(item.created_at)
        }));

        setHistoricalData(snapshots);
        setCurrentHealth(snapshots[snapshots.length - 1]); // Most recent
      }
    } catch (error) {
      console.error('Erro ao carregar dados de saúde financeira:', error);
      toast.error('Erro ao carregar dados de saúde financeira');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Saúde Financeira</h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe os indicadores da sua saúde financeira
          </p>
        </div>
        
        {loading ? (
          <div className="text-center py-10">Carregando...</div>
        ) : (
          <FinancialHealthCards 
            currentHealth={currentHealth}
            historicalData={historicalData}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default FinancialHealth;
