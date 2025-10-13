import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/MainLayout';
import BadgesGallery from '@/components/BadgesGallery';
import { Badge, UserBadge } from '@/types/alerts';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Badges: React.FC = () => {
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBadges();
  }, []);

  const loadBadges = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Carregar todos os badges
      const { data: badgesData, error: badgesError } = await supabase
        .from('badges')
        .select('*')
        .order('code');

      if (badgesError) throw badgesError;

      // Carregar badges do usuário
      const { data: userBadgesData, error: userBadgesError } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', user.id);

      if (userBadgesError) throw userBadgesError;

      if (badgesData) {
        const mappedBadges: Badge[] = badgesData.map(b => ({
          id: b.id,
          code: b.code,
          name: b.name,
          description: b.description,
          icon: b.icon
        }));
        setAllBadges(mappedBadges);
      }

      if (userBadgesData) {
        const mappedUserBadges: UserBadge[] = userBadgesData.map(ub => ({
          id: ub.id,
          badgeId: ub.badge_id!,
          earnedAt: new Date(ub.earned_at!)
        }));
        setUserBadges(mappedUserBadges);
      }
    } catch (error) {
      console.error('Erro ao carregar badges:', error);
      toast.error('Erro ao carregar conquistas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Conquistas e Badges</h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe suas conquistas e marcos financeiros
          </p>
        </div>
        
        {loading ? (
          <div className="text-center py-10">Carregando...</div>
        ) : (
          <BadgesGallery allBadges={allBadges} userBadges={userBadges} />
        )}
      </div>
    </MainLayout>
  );
};

export default Badges;
