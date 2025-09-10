
import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/MainLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { User, Mail, KeyRound, Loader2 } from 'lucide-react';
import { TooltipProvider } from '@/components/ui/tooltip';
import TooltipHelper from '@/components/TooltipHelper';
import { tooltipContent } from '@/data/tooltipContent';
import { supabase } from '@/integrations/supabase/client';

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || '');
        // Try to get display name from user metadata or use email prefix
        setUserName(user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || '');
      }
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
      toast.error('Erro ao carregar informações do perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        data: { 
          full_name: userName,
          name: userName
        }
      });

      if (error) throw error;

      toast.success("Suas informações foram atualizadas com sucesso.");
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast.error('Erro ao atualizar informações');
    } finally {
      setSaving(false);
    }
  };
  
  const handlePasswordReset = async () => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) throw error;

      toast.success("Verifique seu email para redefinir sua senha.");
    } catch (error) {
      console.error('Erro ao enviar email de redefinição:', error);
      toast.error('Erro ao enviar email de redefinição');
    }
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
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Carregando informações...</span>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome completo</Label>
                      <TooltipHelper content={tooltipContent.forms.name}>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input 
                            id="name" 
                            placeholder="Seu nome" 
                            className="pl-10" 
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            disabled={saving}
                          />
                        </div>
                      </TooltipHelper>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <TooltipHelper content={tooltipContent.forms.email}>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input 
                            id="email" 
                            type="email" 
                            placeholder="seu@email.com" 
                            className="pl-10" 
                            value={userEmail}
                            disabled
                            title="O email não pode ser alterado"
                          />
                        </div>
                      </TooltipHelper>
                      <p className="text-xs text-muted-foreground">
                        O email não pode ser alterado por questões de segurança
                      </p>
                    </div>
                  </div>
                  
                  <TooltipHelper content={tooltipContent.forms.submit}>
                    <Button type="submit" className="w-full" disabled={saving}>
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        'Salvar Alterações'
                      )}
                    </Button>
                  </TooltipHelper>
                </form>
              )}
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
