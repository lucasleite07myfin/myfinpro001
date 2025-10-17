import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Configura listener de mudança de estado de autenticação PRIMEIRO
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Só seta loading como false após o primeiro evento
        if (loading) {
          setLoading(false);
        }
      }
    );

    // DEPOIS verifica se há sessão existente
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      // Limpa estado local primeiro
      setUser(null);
      setSession(null);
      
      // Faz logout global
      await supabase.auth.signOut({ scope: 'global' });
      
      // Força recarregamento da página para estado limpo
      window.location.href = '/auth';
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      // Mesmo com erro, força navegação para auth
      window.location.href = '/auth';
    }
  };

  return {
    user,
    session,
    loading,
    signOut,
    isAuthenticated: !!user
  };
};