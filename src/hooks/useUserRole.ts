import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/contexts/UserContext';

// Cache global de roles
let roleCache: { userId: string; isAdmin: boolean } | null = null;

export const useUserRole = () => {
  const { user } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    const checkRole = async () => {
      if (!user) {
        if (mounted) {
          setIsAdmin(false);
          setLoading(false);
        }
        return;
      }

      // Usa cache se disponível
      if (roleCache?.userId === user.id) {
        if (mounted) {
          setIsAdmin(roleCache.isAdmin);
          setLoading(false);
        }
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();
        
        if (error) throw error;
        
        const isAdminRole = !!data;
        
        // Atualiza cache
        roleCache = { userId: user.id, isAdmin: isAdminRole };
        
        if (mounted) {
          setIsAdmin(isAdminRole);
        }
      } catch (error) {
        console.error('Erro ao verificar role:', error);
        if (mounted) {
          setIsAdmin(false);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkRole();
    
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  return { isAdmin, loading };
};
