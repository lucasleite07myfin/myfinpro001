
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppMode } from '@/contexts/AppModeContext';
import { useBusiness } from '@/contexts/BusinessContext';
import { Building2, User } from 'lucide-react';

const Welcome: React.FC = () => {
  const navigate = useNavigate();
  const { setMode } = useAppMode();
  const { companyName, setCompanyName } = useBusiness();
  const [tempCompanyName, setTempCompanyName] = useState(companyName);

  const handlePersonalClick = () => {
    setMode('personal');
    navigate('/');
  };

  const handleBusinessClick = () => {
    setCompanyName(tempCompanyName);
    setMode('business');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-100 to-neutral-200 dark:from-neutral-900 dark:to-black flex flex-col items-center justify-center p-4">
      <img 
        src="/lovable-uploads/3ac31d22-79b8-44f6-b7ba-5baf7d682784.png" 
        alt="MyFin Pro Logo" 
        className="h-28 md:h-36 mb-6"
      />
      <h1 className="text-2xl md:text-4xl font-bold text-neutral-800 dark:text-white mb-2">Bem-vindo ao MyFin Pro</h1>
      <p className="text-neutral-600 dark:text-neutral-300 mb-8 text-center">Escolha qual perfil você deseja acessar</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        <Card className="shadow-md hover:shadow-lg transition-shadow dark:shadow-black/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              MyFin Pro Pessoal
            </CardTitle>
            <CardDescription>
              Gerencie suas finanças pessoais de forma eficiente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-neutral-600 dark:text-neutral-300">
              Controle suas receitas e despesas pessoais, defina metas e acompanhe seu patrimônio.
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={handlePersonalClick} className="w-full">
              Acessar Finanças Pessoais
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="shadow-md hover:shadow-lg transition-shadow dark:shadow-black/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              MyFin Pro Empresas
            </CardTitle>
            <CardDescription>
              Gerencie as finanças da sua empresa com precisão
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-neutral-600 dark:text-neutral-300">
                Controle receitas, despesas, fluxo de caixa e investimentos da sua empresa.
              </p>
              <div className="space-y-2">
                <Label htmlFor="companyName">Nome da sua empresa</Label>
                <Input 
                  id="companyName"
                  value={tempCompanyName}
                  onChange={(e) => setTempCompanyName(e.target.value)}
                  placeholder="Digite o nome da sua empresa"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleBusinessClick} className="w-full">
              Acessar Finanças Empresariais
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Welcome;
