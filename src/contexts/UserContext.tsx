import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface UserContextType {
  user: User | null;
  loading: boolean;
  refetchUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | null>(null);

// Cache global para evitar múltiplas chamadas simultâneas
let userPromise: Promise<User | null> | null = null;
let cachedUser: User | null = null;

const getUserOnce = async (): Promise<User | null> => {
  // Se já tem cache, retorna imediatamente
  if (cachedUser) return cachedUser;
  
  // Se já existe uma promise em andamento, reutiliza
  if (userPromise) return userPromise;
  
  userPromise = supabase.auth.getUser()
    .then(({ data: { user } }) => {
      cachedUser = user;
      userPromise = null;
      return user;
    })
    .catch((error) => {
      console.error('Erro ao carregar usuário:', error);
      userPromise = null;
      return null;
    });
  
  return userPromise;
};

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    setLoading(true);
    const fetchedUser = await getUserOnce();
    setUser(fetchedUser);
    setLoading(false);
  };

  const refetchUser = async () => {
    // Limpa cache e recarrega
    cachedUser = null;
    userPromise = null;
    await loadUser();
  };

  useEffect(() => {
    let mounted = true;

    // Carrega usuário inicial
    loadUser();

    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          cachedUser = session?.user ?? null;
          setUser(session?.user ?? null);
        } else if (event === 'SIGNED_OUT') {
          cachedUser = null;
          setUser(null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <UserContext.Provider value={{ user, loading, refetchUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser deve ser usado dentro de um UserProvider');
  }
  return context;
};
