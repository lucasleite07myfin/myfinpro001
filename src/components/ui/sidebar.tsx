
import React, { useState, useContext, createContext, ReactNode, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { 
  Home, 
  ArrowDown, 
  ArrowUp, 
  BarChart, 
  CircleDollarSign, 
  Wallet, 
  LineChart, 
  ChevronRight,
  TrendingUp,
  PiggyBank,
  Truck
} from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';
import { useAppMode } from '@/contexts/AppModeContext';

interface SidebarContextProps {
  isExpanded: boolean;
  toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextProps>({
  isExpanded: true,
  toggleSidebar: () => {}
});

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleSidebar = () => {
    setIsExpanded(prev => !prev);
  };

  return (
    <SidebarContext.Provider value={{ isExpanded, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  
  return context;
}

export const Sidebar = ({ children }: { children: ReactNode }) => {
  const { isExpanded } = useSidebar();
  const { mode } = useAppMode();
  const location = useLocation();

  // Business menu items
  const businessMenuItems = [
    { 
      name: 'Dashboard', 
      path: '/', 
      icon: Home 
    },
    { 
      name: 'Receitas', 
      path: '/receitas', 
      icon: ArrowUp 
    },
    { 
      name: 'Despesas', 
      path: '/despesas', 
      icon: ArrowDown 
    },
    { 
      name: 'Fluxo de Caixa', 
      path: '/fluxo-caixa', 
      icon: BarChart 
    },
    { 
      name: 'Fornecedores', 
      path: '/fornecedores', 
      icon: Truck 
    },
    { 
      name: 'DRE', 
      path: '/dre', 
      icon: CircleDollarSign 
    },
    { 
      name: 'Investimentos', 
      path: '/investimentos', 
      icon: TrendingUp 
    },
    { 
      name: 'Patrimônio', 
      path: '/patrimonio', 
      icon: Wallet 
    },
    { 
      name: 'Metas', 
      path: '/metas', 
      icon: LineChart 
    }
  ];

  // Personal menu items
  const personalMenuItems = [
    { 
      name: 'Dashboard', 
      path: '/', 
      icon: Home 
    },
    { 
      name: 'Receitas', 
      path: '/receitas', 
      icon: ArrowUp 
    },
    { 
      name: 'Despesas', 
      path: '/despesas', 
      icon: ArrowDown 
    },
    { 
      name: 'Patrimônio', 
      path: '/patrimonio', 
      icon: PiggyBank 
    },
    { 
      name: 'Metas', 
      path: '/metas', 
      icon: LineChart 
    }
  ];

  const menuItems = mode === 'business' ? businessMenuItems : personalMenuItems;

  return (
    <nav 
      className={cn(
        "h-screen fixed z-20 top-0 left-0 overflow-y-auto transition-all bg-background border-r",
        isExpanded ? "w-60" : "w-16"
      )}
    >
      <div className="flex flex-col h-full">
        <div className="py-3 px-3 flex items-center justify-between h-16 border-b">
          <span 
            className={cn(
              "font-semibold overflow-hidden transition-all",
              isExpanded ? "opacity-100" : "opacity-0 w-0"
            )}
          >
            {mode === 'business' ? 'Business' : 'Personal'} Finance
          </span>
          <button 
            onClick={() => useSidebar().toggleSidebar()}
            className="p-1 rounded hover:bg-accent"
          >
            <ChevronRight 
              size={18} 
              className={cn(
                "transition-transform",
                isExpanded ? "" : "rotate-180"
              )}
            />
          </button>
        </div>
        
        <div className="flex-1 py-4">
          <ul className="space-y-1 px-2">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    "flex items-center h-10 rounded-md px-2 transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    location.pathname === item.path ? "bg-accent text-accent-foreground" : "text-foreground"
                  )}
                >
                  <span className="inline-flex">
                    <item.icon size={18} />
                  </span>
                  <span 
                    className={cn(
                      "ml-3 overflow-hidden whitespace-nowrap transition-opacity duration-200",
                      isExpanded ? "opacity-100" : "opacity-0 w-0"
                    )}
                  >
                    {item.name}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export const SidebarTrigger = ({ children }: { children: ReactNode }) => {
  const { isExpanded } = useSidebar();

  return (
    <div
      className={cn(
        "transition-all h-16 flex items-center",
        isExpanded ? "ml-60" : "ml-16"
      )}
    >
      {children}
    </div>
  );
};
