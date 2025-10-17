
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
