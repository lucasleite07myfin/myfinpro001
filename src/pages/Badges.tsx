
import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/MainLayout';
import BadgesGallery from '@/components/BadgesGallery';
import { Badge, UserBadge } from '@/types/alerts';

const Badges: React.FC = () => {
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);

  // Mock data para demonstração
  useEffect(() => {
    const mockBadges: Badge[] = [
      {
        id: '1',
        code: 'STREAK_30',
        name: '30 Dias Disciplinado',
        description: '30 dias seguidos sem ultrapassar nenhum orçamento',
        icon: '/icons/streak-30.png'
      },
      {
        id: '2',
        code: 'GOAL_DONE',
        name: 'Realizador de Sonhos',
        description: 'Primeira meta financeira concluída com sucesso',
        icon: '/icons/goal-done.png'
      },
      {
        id: '3',
        code: 'EMERGENCY_6M',
        name: 'Protetor do Futuro',
        description: 'Reserva de emergência para 6 meses ou mais',
        icon: '/icons/emergency-6m.png'
      },
      {
        id: '4',
        code: 'GROWTH_POSITIVE',
        name: 'Patrimônio em Crescimento',
        description: 'Crescimento patrimonial positivo por 12 meses',
        icon: '/icons/growth.png'
      },
      {
        id: '5',
        code: 'FIRST_INVESTMENT',
        name: 'Primeiro Investidor',
        description: 'Primeiro investimento realizado',
        icon: '/icons/first-investment.png'
      },
      {
        id: '6',
        code: 'BUDGET_MASTER',
        name: 'Mestre do Orçamento',
        description: 'Ficou dentro do orçamento por 6 meses seguidos',
        icon: '/icons/budget-master.png'
      }
    ];

    const mockUserBadges: UserBadge[] = [
      {
        id: '1',
        badge_id: '2',
        earned_at: new Date('2024-01-15'),
        owner: 'user1'
      },
      {
        id: '2',
        badge_id: '5',
        earned_at: new Date('2024-02-20'),
        owner: 'user1'
      }
    ];

    setAllBadges(mockBadges);
    setUserBadges(mockUserBadges);
  }, []);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Conquistas e Badges</h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe suas conquistas e marcos financeiros
          </p>
        </div>
        
        <BadgesGallery allBadges={allBadges} userBadges={userBadges} />
      </div>
    </MainLayout>
  );
};

export default Badges;
