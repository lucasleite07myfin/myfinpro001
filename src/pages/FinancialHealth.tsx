import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/MainLayout';
import FinancialHealthCards from '@/components/FinancialHealthCards';
import { HealthSnapshot } from '@/types/alerts';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAppMode } from '@/contexts/AppModeContext';

const FinancialHealth: React.FC = () => {
  const { mode } = useAppMode();
  const [currentHealth, setCurrentHealth] = useState<HealthSnapshot | null>(null);
  const [historicalData, setHistoricalData] = useState<HealthSnapshot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHealthData();
  }, [mode]);

  const loadHealthData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const tableName = mode === 'business' ? 'emp_health_snapshots' : 'health_snapshots';
      
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('user_id', user.id)
        .order('snapshot_date', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const snapshots = data.map(item => ({
          id: item.id,
          snapshotDate: new Date(item.snapshot_date),
          savingsRatePct: item.savings_rate_pct || 0,
          debtIncomePct: item.debt_income_pct || 0,
          monthsEmergencyFund: item.months_emergency_fund || 0,
          netWorthGrowth12m: item.net_worth_growth_12m || 0,
          createdAt: new Date(item.created_at)
        }));

        setCurrentHealth(snapshots[0]);
        setHistoricalData(snapshots);
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
        ) : !currentHealth ? (
          <div className="text-center py-10 text-muted-foreground">
            Nenhum dado de saúde financeira encontrado. Os dados são calculados automaticamente com base nas suas transações.
          </div>
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
