
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSubAccount } from './SubAccountContext';
import { toast } from 'sonner';

export type AppMode = 'personal' | 'business';

interface AppModeContextType {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  toggleMode: () => void;
}

const AppModeContext = createContext<AppModeContextType | null>(null);

export const useAppMode = () => {
  const context = useContext(AppModeContext);
  if (!context) {
    throw new Error('useAppMode must be used within an AppModeProvider');
  }
  return context;
};

interface AppModeProviderProps {
  children: ReactNode;
}

export const AppModeProvider: React.FC<AppModeProviderProps> = ({ children }) => {
  // Get stored mode from localStorage or default to 'personal'
  const [mode, setModeState] = useState<AppMode>(
    (localStorage.getItem('myfinpro_mode') as AppMode) || 'personal'
  );

  // Update localStorage when mode changes
  useEffect(() => {
    localStorage.setItem('myfinpro_mode', mode);
  }, [mode]);

  const setMode = (newMode: AppMode) => {
    setModeState(newMode);
  };

  const toggleMode = () => {
    const newMode = mode === 'personal' ? 'business' : 'personal';
    setModeState(newMode);
  };

  return (
    <AppModeContext.Provider value={{ mode, setMode, toggleMode }}>
      {children}
    </AppModeContext.Provider>
  );
};

// Wrapper que força modo business para sub-accounts
export const AppModeProviderWithSubAccount: React.FC<AppModeProviderProps> = ({ children }) => {
  return (
    <AppModeProvider>
      <SubAccountModeEnforcer>{children}</SubAccountModeEnforcer>
    </AppModeProvider>
  );
};

const SubAccountModeEnforcer: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isSubAccount, loading } = useSubAccount();
  const { mode, setMode } = useAppMode();

  // Força modo business para sub-accounts
  useEffect(() => {
    if (!loading && isSubAccount && mode !== 'business') {
      setMode('business');
      localStorage.setItem('myfinpro_mode', 'business');
      toast.info('Funcionários só podem acessar o modo empresarial');
    }
  }, [isSubAccount, loading, mode, setMode]);

  return <>{children}</>;
};
