
import React from 'react';
import MainLayout from '@/components/MainLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { User, Mail, KeyRound } from 'lucide-react';
import { TooltipProvider } from '@/components/ui/tooltip';
import TooltipHelper from '@/components/TooltipHelper';
import { tooltipContent } from '@/data/tooltipContent';

const Profile = () => {
  const { toast } = useToast();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Perfil atualizado",
      description: "Suas informações foram atualizadas com sucesso.",
    });
  };
  
  const handlePasswordReset = () => {
    toast({
      title: "Email enviado",
      description: "Verifique seu email para redefinir sua senha.",
    });
  };
  
  return (
    <MainLayout>
      <TooltipProvider>
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Seu Perfil</h1>
          
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>
                Atualize suas informações de perfil aqui.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome completo</Label>
                    <TooltipHelper content={tooltipContent.forms.name}>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input id="name" placeholder="Seu nome" className="pl-10" defaultValue="João Silva" />
                      </div>
                    </TooltipHelper>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <TooltipHelper content={tooltipContent.forms.email}>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input id="email" type="email" placeholder="seu@email.com" className="pl-10" defaultValue="joao@example.com" />
                      </div>
                    </TooltipHelper>
                  </div>
                </div>
                
                <TooltipHelper content={tooltipContent.forms.submit}>
                  <Button type="submit" className="w-full">Salvar Alterações</Button>
                </TooltipHelper>
              </form>
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Segurança</CardTitle>
              <CardDescription>
                Gerencie sua senha e segurança da conta.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-2 rounded-full bg-primary/10">
                    <KeyRound className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Redefinir Senha</h3>
                    <p className="text-sm text-muted-foreground">Enviaremos um email com instruções</p>
                  </div>
                </div>
                <TooltipHelper content="Enviar email para redefinição de senha">
                  <Button variant="outline" onClick={handlePasswordReset}>Redefinir</Button>
                </TooltipHelper>
              </div>
            </CardContent>
          </Card>
        </div>
      </TooltipProvider>
    </MainLayout>
  );
};

export default Profile;
