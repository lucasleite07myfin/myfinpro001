
import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/MainLayout';
import AlertsTable from '@/components/AlertsTable';
import { AlertLog } from '@/types/alerts';

const Alerts: React.FC = () => {
  const [alerts, setAlerts] = useState<AlertLog[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Mock data para demonstração
  useEffect(() => {
    const mockAlerts: AlertLog[] = [
      {
        id: '1',
        alert_rule_id: 'rule1',
        message: 'Você já gastou 85% do seu orçamento de Alimentação este mês',
        triggered_at: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 horas atrás
        read: false,
        owner: 'user1'
      },
      {
        id: '2',
        alert_rule_id: 'rule2',
        message: 'Transação incomum detectada: R$ 1.500 em Eletrônicos',
        triggered_at: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 dia atrás
        read: false,
        owner: 'user1'
      },
      {
        id: '3',
        alert_rule_id: 'rule3',
        message: 'Sua conta vence em 3 dias: Cartão de Crédito',
        triggered_at: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 dias atrás
        read: true,
        owner: 'user1'
      }
    ];

    setAlerts(mockAlerts);
    setUnreadCount(mockAlerts.filter(alert => !alert.read).length);
  }, []);

  const handleMarkAsRead = (id: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === id ? { ...alert, read: true } : alert
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleCreateRule = () => {
    // Callback quando uma nova regra é criada
    console.log('Nova regra criada, recarregar alertas...');
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Alertas Inteligentes</h1>
        
        <AlertsTable
          alerts={alerts}
          onMarkAsRead={handleMarkAsRead}
          onCreateRule={handleCreateRule}
          unreadCount={unreadCount}
        />
      </div>
    </MainLayout>
  );
};

export default Alerts;
