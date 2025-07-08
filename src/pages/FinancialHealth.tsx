
import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/MainLayout';
import FinancialHealthCards from '@/components/FinancialHealthCards';
import { HealthSnapshot } from '@/types/alerts';

const FinancialHealth: React.FC = () => {
  const [currentHealth, setCurrentHealth] = useState<HealthSnapshot | null>(null);
  const [historicalData, setHistoricalData] = useState<HealthSnapshot[]>([]);

  // Mock data para demonstração
  useEffect(() => {
    const mockCurrentHealth: HealthSnapshot = {
      id: '1',
      snapshot_date: new Date().toISOString().split('T')[0],
      savings_rate_pct: 22.5,
      debt_income_pct: 25.0,
      months_emergency_fund: 4.2,
      net_worth_growth_12m: 8.7,
      owner: 'user1'
    };

    const mockHistoricalData: HealthSnapshot[] = [
      {
        id: '2',
        snapshot_date: '2024-01-01',
        savings_rate_pct: 18.3,
        debt_income_pct: 30.0,
        months_emergency_fund: 2.8,
        net_worth_growth_12m: 5.2,
        owner: 'user1'
      },
      {
        id: '3',
        snapshot_date: '2024-02-01',
        savings_rate_pct: 20.1,
        debt_income_pct: 28.5,
        months_emergency_fund: 3.5,
        net_worth_growth_12m: 6.8,
        owner: 'user1'
      },
      mockCurrentHealth
    ];

    setCurrentHealth(mockCurrentHealth);
    setHistoricalData(mockHistoricalData);
  }, []);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Saúde Financeira</h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe os indicadores da sua saúde financeira
          </p>
        </div>
        
        <FinancialHealthCards 
          currentHealth={currentHealth}
          historicalData={historicalData}
        />
      </div>
    </MainLayout>
  );
};

export default FinancialHealth;
