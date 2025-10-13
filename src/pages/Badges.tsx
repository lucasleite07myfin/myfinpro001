import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/MainLayout';
import BadgesGallery from '@/components/BadgesGallery';
import { Badge, UserBadge } from '@/types/alerts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const Badges: React.FC = () => {
  const { user } = useAuth();
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadBadgesData();
    }
  }, [user]);

  const loadBadgesData = async () => {
    try {
      setLoading(true);
      
      // Load all available badges
      const { data: badgesData, error: badgesError } = await supabase
        .from('badges')
        .select('*')
        .order('code');

      if (badgesError) throw badgesError;

      // Load user's earned badges
      const { data: userBadgesData, error: userBadgesError } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', user?.id);

      if (userBadgesError) throw userBadgesError;

      // Convert to component format
      if (badgesData) {
        const badges: Badge[] = badgesData.map(item => ({
          id: item.id,
          code: item.code,
          name: item.name,
          description: item.description,
          icon: item.icon
        }));
        setAllBadges(badges);
      }

      if (userBadgesData) {
        const earnedBadges: UserBadge[] = userBadgesData.map(item => ({
          id: item.id,
          badgeId: item.badge_id || '',
          earnedAt: new Date(item.earned_at)
        }));
        setUserBadges(earnedBadges);
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
