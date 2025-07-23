import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, ChartBar, Truck, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import ModeToggle from './ModeToggle';
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



  // Add logging to track mode and path
  useEffect(() => {
    console.log('Header - Current mode:', mode);
    console.log('Header - Current path:', currentPath);
    console.log('Header - Tab value for comparison:', currentPath);
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

  return (
    <TooltipProvider>
      <header className="w-full bg-background border-b border-border shadow-sm sticky top-0 z-10">
        <div className="container mx-auto py-3 md:py-4 px-4">
          {/* Top row - Logo and User Controls */}
          <div className="flex justify-between items-center mb-4">
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
            
            <div className="flex items-center gap-3">
              
              {/* User Profile Dropdown */}
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
              
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
          
          {/* Bottom row - Navigation Tabs */}
          <div className={`w-full ${menuOpen ? 'block' : 'hidden md:block'}`}>
            <div className="flex justify-center">
              <Tabs value={currentPath} onValueChange={handleTabChange} className="w-full md:w-auto">
                <TabsList className="grid w-full grid-cols-2 md:flex md:w-fit bg-muted">
                  <TabsTrigger value="/" className="data-[state=active]:bg-[hsl(var(--navy-blue))] data-[state=active]:text-white">Dashboard</TabsTrigger>
                  <TabsTrigger value="/receitas" className="data-[state=active]:bg-[hsl(var(--navy-blue))] data-[state=active]:text-white">Receitas</TabsTrigger>
                  <TabsTrigger value="/despesas" className="data-[state=active]:bg-[hsl(var(--navy-blue))] data-[state=active]:text-white">Despesas</TabsTrigger>
                  <TabsTrigger value="/metas" className="data-[state=active]:bg-[hsl(var(--navy-blue))] data-[state=active]:text-white">Metas</TabsTrigger>
                  <TabsTrigger value="/patrimonio" className="data-[state=active]:bg-[hsl(var(--navy-blue))] data-[state=active]:text-white">Patrimônio</TabsTrigger>
                  {mode === 'personal' && (
                    <TabsTrigger value="/saude-financeira" className="data-[state=active]:bg-[hsl(var(--navy-blue))] data-[state=active]:text-white">Saúde</TabsTrigger>
                  )}
                  {mode === 'business' && (
                    <>
                      <TabsTrigger value="/fluxo-caixa" className="data-[state=active]:bg-[hsl(var(--navy-blue))] data-[state=active]:text-white">Fluxo de Caixa</TabsTrigger>
                      <TabsTrigger value="/fornecedores" className="data-[state=active]:bg-[hsl(var(--navy-blue))] data-[state=active]:text-white">Fornecedores</TabsTrigger>
                      <TabsTrigger value="/investimentos" className="data-[state=active]:bg-[hsl(var(--navy-blue))] data-[state=active]:text-white">Investimentos</TabsTrigger>
                      <TabsTrigger value="/dre" className="data-[state=active]:bg-[hsl(var(--navy-blue))] data-[state=active]:text-white">
                        <ChartBar className="h-3 w-3 mr-1" /> DRE
                      </TabsTrigger>
                    </>
                  )}
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>
      </header>
    </TooltipProvider>
  );
};

export default Header;
