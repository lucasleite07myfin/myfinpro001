
import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, ChartBar, Truck, ChevronDown, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ModeToggle from './ModeToggle';
import { useAppMode } from '@/contexts/AppModeContext';
import { useBusiness } from '@/contexts/BusinessContext';
import ThemeToggle from './ThemeToggle';
import AlertsBellIcon from './AlertsBellIcon';
import { AlertLog } from '@/types/alerts';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TooltipProvider } from "@/components/ui/tooltip";
import TooltipHelper from './TooltipHelper';
import { tooltipContent } from '@/data/tooltipContent';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const [menuOpen, setMenuOpen] = useState(false);
  const [alerts, setAlerts] = useState<AlertLog[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const {
    mode
  } = useAppMode();
  const business = mode === 'business' ? useBusiness() : null;

  // Mock alerts data
  useEffect(() => {
    const mockAlerts: AlertLog[] = [
      {
        id: '1',
        alert_rule_id: 'rule1',
        message: 'Você já gastou 85% do seu orçamento de Alimentação este mês',
        triggered_at: new Date(Date.now() - 2 * 60 * 60 * 1000),
        read: false,
        owner: 'user1'
      },
      {
        id: '2',
        alert_rule_id: 'rule2',
        message: 'Transação incomum detectada: R$ 1.500 em Eletrônicos',
        triggered_at: new Date(Date.now() - 24 * 60 * 60 * 1000),
        read: false,
        owner: 'user1'
      }
    ];
    
    setAlerts(mockAlerts);
    setUnreadCount(mockAlerts.filter(alert => !alert.read).length);
  }, []);

  const handleMarkAsRead = (id: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === id ? { ...alert, read: true } : alert
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Add logging to track mode and path
  useEffect(() => {
    console.log('Header - Current mode:', mode);
    console.log('Header - Current path:', currentPath);
  }, [mode, currentPath]);
  
  const handleTabChange = (value: string) => {
    navigate(value);
    setMenuOpen(false);
  };
  
  const handleLogoClick = () => {
    navigate('/welcome');
  };
  
  const handleProfileClick = () => {
    navigate('/profile');
  };
  
  const handleLogout = () => {
    // In a real app, you would clear auth tokens/session here
    console.log('User logged out');
    navigate('/login');
  };
  
  return (
    <TooltipProvider>
      <header className="w-full bg-background border-b border-border shadow-sm sticky top-0 z-10">
        <div className="container mx-auto py-3 md:py-4 px-4 flex flex-col md:flex-row justify-between items-center">
          <div className="flex w-full md:w-auto justify-between items-center mb-3 md:mb-0">
            <TooltipHelper content={tooltipContent.header.logo}>
              <div className="flex items-center cursor-pointer" onClick={handleLogoClick}>
                <img src="/lovable-uploads/3ac31d22-79b8-44f6-b7ba-5baf7d682784.png" alt="MyFin Pro Logo" className="h-12 md:h-16 mr-3" />
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-foreground">
                    {mode === 'personal' ? 'MyFin Pro' : 'MyFin Pro Empresas'}
                  </h1>
                  {mode === 'business' && business?.companyName && <p className="text-muted-foreground text-xs md:text-sm">{business.companyName}</p>}
                  {mode === 'personal' && <p className="hidden md:block text-muted-foreground text-sm">Seu controle financeiro completo</p>}
                </div>
              </div>
            </TooltipHelper>
            
            <div className="flex items-center gap-2">
              {/* Alerts Bell Icon */}
              <AlertsBellIcon 
                alerts={alerts}
                unreadCount={unreadCount}
                onMarkAsRead={handleMarkAsRead}
              />
              
              {/* User Profile Dropdown */}
              <TooltipHelper content={tooltipContent.header.profile}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="rounded-full h-9 w-9 bg-background shadow-md hover:bg-muted border border-border dark:bg-sidebar-accent dark:text-white">
                      <User className="h-4 w-4" />
                      <span className="sr-only">Perfil do Usuário</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleProfileClick} className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Perfil</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-500 focus:text-red-500">
                      <X className="mr-2 h-4 w-4" />
                      <span>Sair</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TooltipHelper>
              
              <ThemeToggle />
              <ModeToggle />
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
          
          <div className={`w-full md:w-auto ${menuOpen ? 'block' : 'hidden md:block'}`}>
            <Tabs value={currentPath} onValueChange={handleTabChange} className="w-full">
              <TabsList className="w-full grid grid-cols-2 md:flex md:w-auto gap-1 md:gap-0">
                <TooltipHelper content={tooltipContent.navigation.dashboard}>
                  <TabsTrigger value="/" className="flex-1 md:flex-none">
                    Dashboard
                  </TabsTrigger>
                </TooltipHelper>
                <TooltipHelper content={tooltipContent.navigation.receitas}>
                  <TabsTrigger value="/receitas" className="flex-1 md:flex-none">
                    Receitas
                  </TabsTrigger>
                </TooltipHelper>
                <TooltipHelper content={tooltipContent.navigation.despesas}>
                  <TabsTrigger value="/despesas" className="flex-1 md:flex-none">
                    Despesas
                  </TabsTrigger>
                </TooltipHelper>
                <TooltipHelper content={tooltipContent.navigation.metas}>
                  <TabsTrigger value="/metas" className="flex-1 md:flex-none">
                    Metas
                  </TabsTrigger>
                </TooltipHelper>
                <TooltipHelper content={tooltipContent.navigation.patrimonio}>
                  <TabsTrigger value="/patrimonio" className="flex-1 md:flex-none">
                    Patrimônio
                  </TabsTrigger>
                </TooltipHelper>
                
                {/* Alertas tab appears in both modes */}
                <TooltipHelper content="Gerencie alertas inteligentes e regras personalizadas">
                  <TabsTrigger value="/alertas" className="flex-1 md:flex-none">
                    Alertas
                  </TabsTrigger>
                </TooltipHelper>
                
                {/* Saúde tab only appears in personal mode */}
                {mode === 'personal' && (
                  <TooltipHelper content="Acompanhe métricas de saúde financeira">
                    <TabsTrigger value="/saude-financeira" className="flex-1 md:flex-none">
                      Saúde
                    </TabsTrigger>
                  </TooltipHelper>
                )}
                
                {mode === 'business' && 
                  <TooltipHelper content={tooltipContent.navigation.fluxoCaixa}>
                    <TabsTrigger value="/fluxo-caixa" className="flex-1 md:flex-none">
                      Fluxo de Caixa
                    </TabsTrigger>
                  </TooltipHelper>
                }
                {mode === 'business' && 
                  <TooltipHelper content={tooltipContent.navigation.fornecedores}>
                    <TabsTrigger value="/fornecedores" className="flex-1 md:flex-none flex items-center">
                      Fornecedores
                    </TabsTrigger>
                  </TooltipHelper>
                }
                {mode === 'business' && 
                  <TooltipHelper content={tooltipContent.navigation.investimentos}>
                    <TabsTrigger value="/investimentos" className="flex-1 md:flex-none">
                      Investimentos
                    </TabsTrigger>
                  </TooltipHelper>
                }
                {mode === 'business' && 
                  <TooltipHelper content={tooltipContent.navigation.dre}>
                    <TabsTrigger value="/dre" className="flex-1 md:flex-none flex items-center">
                      <ChartBar className="h-3 w-3 mr-1" /> DRE
                    </TabsTrigger>
                  </TooltipHelper>
                }
              </TabsList>
            </Tabs>
          </div>
        </div>
      </header>
    </TooltipProvider>
  );
};
export default Header;
