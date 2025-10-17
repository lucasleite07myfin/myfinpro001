import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useUserRole = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    const checkRole = async () => {
      console.log('🔍 Checking role for user:', user?.id);
      
      if (!user) {
        console.log('❌ No user found - waiting for auth');
        if (mounted) {
          setIsAdmin(false);
          setLoading(false); // Importante: marcar como não loading
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

        console.log('📊 Query result:', { data, error });
        
        if (error) throw error;
        
        if (mounted) {
          setIsAdmin(!!data);
          console.log('✅ Is admin:', !!data);
        }
      } catch (error) {
        console.error('❌ Error checking user role:', error);
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
