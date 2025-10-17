import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Subscription, PlanType } from '@/types/subscription';
import { toast } from 'sonner';

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const fetchSubscription = async () => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setSubscription(data as Subscription | null);
    } catch (error) {
      console.error('Error fetching subscription:', error);
      toast.error('Erro ao carregar assinatura. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();

    // Realtime listener para mudanças
    if (user) {
      const channel = supabase
        .channel('subscription_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'subscriptions',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            console.log('Subscription changed, refetching...');
            fetchSubscription();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const createCheckout = async (planType: PlanType, couponCode?: string) => {
    if (!user) {
      toast.error('Você precisa estar logado');
      return;
    }

    setCreating(true);

    try {
      // Timeout de 15 segundos
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout: operação demorou muito')), 15000)
      );

      const invokePromise = supabase.functions.invoke('create-checkout-session', {
        body: { plan_type: planType, coupon_code: couponCode },
      });

      const result = await Promise.race([invokePromise, timeoutPromise]) as any;
      const { data, error } = result;

      if (error) throw error;

      if (data?.url) {
        // Abrir em nova aba
        const opened = window.open(data.url, '_blank');
        
        if (!opened) {
          // Se bloqueado por popup blocker, usar fallback
          toast.error('Por favor, permita pop-ups para este site');
          window.location.href = data.url;
        } else {
          toast.success('Abrindo página de checkout...');
          setCreating(false);
        }
      } else {
        throw new Error('URL de checkout não recebida');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      const message = error instanceof Error ? error.message : 'Tente novamente mais tarde';
      toast.error(`Erro ao criar checkout: ${message}`);
      setCreating(false);
    }
  };

  const cancelSubscription = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('cancel-subscription');

      if (error) throw error;

      toast.success(data?.message || 'Sua assinatura será cancelada no final do período');

      fetchSubscription();
    } catch (error) {
      console.error('Error canceling subscription:', error);
      const message = error instanceof Error ? error.message : 'Tente novamente mais tarde';
      toast.error(`Erro ao cancelar assinatura: ${message}`);
    }
  };

  const isActive = useMemo(
    () => subscription?.status === 'trialing' || subscription?.status === 'active',
    [subscription]
  );

  const isPremium = isActive;
  const isTrial = subscription?.status === 'trialing';

  const trialDaysLeft = useMemo(() => {
    if (!isTrial || !subscription?.trial_end) return 0;
    const diff = new Date(subscription.trial_end).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [subscription, isTrial]);

  return {
    subscription,
    loading,
    creating,
    isActive,
    isPremium,
    isTrial,
    trialDaysLeft,
    createCheckout,
    cancelSubscription,
    refetch: fetchSubscription,
  };
};
