
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
      snapshotDate: new Date(),
      savingsRatePct: 22.5,
      debtIncomePct: 25.0,
      monthsEmergencyFund: 4.2,
      netWorthGrowth12m: 8.7,
      createdAt: new Date()
    };

    const mockHistoricalData: HealthSnapshot[] = [
      {
        id: '2',
        snapshotDate: new Date('2024-01-01'),
        savingsRatePct: 18.3,
        debtIncomePct: 30.0,
        monthsEmergencyFund: 2.8,
        netWorthGrowth12m: 5.2,
        createdAt: new Date('2024-01-01')
      },
      {
        id: '3',
        snapshotDate: new Date('2024-02-01'),
        savingsRatePct: 20.1,
        debtIncomePct: 28.5,
        monthsEmergencyFund: 3.5,
        netWorthGrowth12m: 6.8,
        createdAt: new Date('2024-02-01')
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
