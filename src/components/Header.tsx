import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, ChartBar, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import ModeToggle from './ModeToggle';
import BitcoinHeaderButton from './BitcoinHeaderButton';
import { useAppMode } from '@/contexts/AppModeContext';
import { useBusiness } from '@/contexts/BusinessContext';
import { useAuth } from '@/hooks/useAuth';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { TooltipProvider } from "@/components/ui/tooltip";
import TooltipHelper from './TooltipHelper';
import { tooltipContent } from '@/data/tooltipContent';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const [menuOpen, setMenuOpen] = useState(false);
  const { mode } = useAppMode();
  const { user, signOut } = useAuth();
  const business = mode === 'business' ? useBusiness() : null;

  useEffect(() => {
    console.log('Header - Current mode:', mode);
    console.log('Header - Current path:', currentPath);
  }, [mode, currentPath]);

  const handleTabChange = (value: string) => {
    navigate(value);
    setMenuOpen(false);
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const getUserInitials = () => {
    if (!user?.user_metadata?.full_name) return 'U';
    const names = user.user_metadata.full_name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return names[0][0].toUpperCase();
  };

  const navLinks = (
    <>
      <TabsTrigger value="/" className="data-[state=active]:bg-[#EE680D] data-[state=active]:text-white">Dashboard</TabsTrigger>
      <TabsTrigger value="/receitas" className="data-[state=active]:bg-[#EE680D] data-[state=active]:text-white">Receitas</TabsTrigger>
      <TabsTrigger value="/despesas" className="data-[state=active]:bg-[#EE680D] data-[state=active]:text-white">Despesas</TabsTrigger>
      <TabsTrigger value="/metas" className="data-[state=active]:bg-[#EE680D] data-[state=active]:text-white">Metas</TabsTrigger>
      <TabsTrigger value="/patrimonio" className="data-[state=active]:bg-[#EE680D] data-[state=active]:text-white">Patrimônio</TabsTrigger>
      {mode === 'personal' && (
        <TabsTrigger value="/saude-financeira" className="data-[state=active]:bg-[#EE680D] data-[state=active]:text-white">Saúde</TabsTrigger>
      )}
      {mode === 'business' && (
        <>
          <TabsTrigger value="/fluxo-caixa" className="data-[state=active]:bg-[#EE680D] data-[state=active]:text-white">Fluxo de Caixa</TabsTrigger>
          <TabsTrigger value="/fornecedores" className="data-[state=active]:bg-[#EE680D] data-[state=active]:text-white">Fornecedores</TabsTrigger>
          <TabsTrigger value="/investimentos" className="data-[state=active]:bg-[#EE680D] data-[state=active]:text-white">Investimentos</TabsTrigger>
          <TabsTrigger value="/dre" className="data-[state=active]:bg-[#EE680D] data-[state=active]:text-white">
            <ChartBar className="h-3 w-3 mr-1" /> DRE
          </TabsTrigger>
        </>
      )}
    </>
  );

  return (
    <TooltipProvider>
      <header className="w-full bg-background border-b border-border shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <TooltipHelper content={tooltipContent.header.logo}>
              <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
                <img src="/lovable-uploads/3ac31d22-79b8-44f6-b7ba-5baf7d682784.png" alt="MyFin Pro Logo" className="h-12 md:h-14 mr-3" />
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-foreground">
                    {mode === 'personal' ? 'MyFin Pro' : 'MyFin Pro Empresas'}
                  </h1>
                  {mode === 'business' && business?.companyName && <p className="text-muted-foreground text-xs md:text-sm">{business.companyName}</p>}
                  {mode === 'personal' && <p className="hidden md:block text-muted-foreground text-sm">Seu controle financeiro completo</p>}
                </div>
              </div>
            </TooltipHelper>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center justify-center">
              <Tabs value={currentPath} onValueChange={handleTabChange}>
                <TabsList className="bg-muted">
                  {navLinks}
                </TabsList>
              </Tabs>
            </div>

            {/* Right side controls */}
            <div className="flex items-center gap-3">
              <BitcoinHeaderButton />
              <TooltipHelper content={tooltipContent.header.profile}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-background border-border shadow-lg" align="end" forceMount>
                    <div className="flex flex-col space-y-1 p-2">
                      <p className="text-sm font-medium leading-none text-foreground">
                        {user?.user_metadata?.full_name || 'Usuário'}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                    <DropdownMenuSeparator className="bg-border" />
                    <DropdownMenuItem onClick={handleProfileClick} className="cursor-pointer hover:bg-muted/50">
                      <User className="mr-2 h-4 w-4" />
                      <span>Perfil</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border" />
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive hover:bg-muted/50">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sair</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TooltipHelper>
              
              <ModeToggle />
              
              <div className="md:hidden">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setMenuOpen(!menuOpen)}
                  className={menuOpen ? "text-[#EE680D]" : ""}
                >
                  {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Mobile Navigation Overlay - Moved outside header */}
      {menuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-[99998]"
            onClick={() => setMenuOpen(false)}
            style={{ zIndex: 99998 }}
          />
          {/* Menu Content */}
          <div 
            className="md:hidden fixed top-20 left-0 right-0 bg-background border-b border-border shadow-xl z-[99999]"
            style={{ zIndex: 99999 }}
          >
            <div className="p-4">
              <Tabs value={currentPath} onValueChange={handleTabChange} className="w-full">
                <TabsList className="flex flex-col w-full gap-2 bg-muted/50 p-2 h-auto">
                  <TabsTrigger value="/" className="data-[state=active]:bg-[#EE680D] data-[state=active]:text-white w-full justify-start h-10 text-sm">Dashboard</TabsTrigger>
                  <TabsTrigger value="/receitas" className="data-[state=active]:bg-[#EE680D] data-[state=active]:text-white w-full justify-start h-10 text-sm">Receitas</TabsTrigger>
                  <TabsTrigger value="/despesas" className="data-[state=active]:bg-[#EE680D] data-[state=active]:text-white w-full justify-start h-10 text-sm">Despesas</TabsTrigger>
                  <TabsTrigger value="/metas" className="data-[state=active]:bg-[#EE680D] data-[state=active]:text-white w-full justify-start h-10 text-sm">Metas</TabsTrigger>
                  <TabsTrigger value="/patrimonio" className="data-[state=active]:bg-[#EE680D] data-[state=active]:text-white w-full justify-start h-10 text-sm">Patrimônio</TabsTrigger>
                  {mode === 'personal' && (
                    <TabsTrigger value="/saude-financeira" className="data-[state=active]:bg-[#EE680D] data-[state=active]:text-white w-full justify-start h-10 text-sm">Saúde</TabsTrigger>
                  )}
                  {mode === 'business' && (
                    <>
                      <TabsTrigger value="/fluxo-caixa" className="data-[state=active]:bg-[#EE680D] data-[state=active]:text-white w-full justify-start h-10 text-sm">Fluxo de Caixa</TabsTrigger>
                      <TabsTrigger value="/fornecedores" className="data-[state=active]:bg-[#EE680D] data-[state=active]:text-white w-full justify-start h-10 text-sm">Fornecedores</TabsTrigger>
                      <TabsTrigger value="/investimentos" className="data-[state=active]:bg-[#EE680D] data-[state=active]:text-white w-full justify-start h-10 text-sm">Investimentos</TabsTrigger>
                      <TabsTrigger value="/dre" className="data-[state=active]:bg-[#EE680D] data-[state=active]:text-white w-full justify-start h-10 text-sm">
                        <ChartBar className="h-3 w-3 mr-1" /> DRE
                      </TabsTrigger>
                    </>
                  )}
                </TabsList>
              </Tabs>
            </div>
          </div>
        </>
      )}
    </TooltipProvider>
  );
};

export default Header;
