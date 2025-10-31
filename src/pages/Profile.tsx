
import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { User, Mail, KeyRound, Loader2, Bell, TestTube, Fingerprint, Smartphone } from 'lucide-react';
import { TooltipProvider } from '@/components/ui/tooltip';
import TooltipHelper from '@/components/TooltipHelper';
import { tooltipContent } from '@/data/tooltipContent';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBiometric } from '@/hooks/useBiometric';
import { Switch } from '@/components/ui/switch';
import { Building2 } from 'lucide-react';
import { useAppMode } from '@/contexts/AppModeContext';
import { useBusiness } from '@/contexts/BusinessContext';

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [notificationDays, setNotificationDays] = useState('3');
  const [userId, setUserId] = useState('');
  const [companyName, setCompanyName] = useState('');
  
  const { mode } = useAppMode();
  const { setCompanyName: updateBusinessContext } = useBusiness();
  
  const { 
    isAvailable: biometricAvailable, 
    isRegistered: biometricRegistered,
    registerBiometric,
    removeBiometric,
    checkAvailability 
  } = useBiometric();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        setUserEmail(user.email || '');
        setUserName(user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || '');
        
        // Load webhook configuration and company name from profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('n8n_webhook_url, notification_days_before, company_name')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setWebhookUrl(profile.n8n_webhook_url || '');
          setNotificationDays(String(profile.notification_days_before || 3));
          setCompanyName(profile.company_name || '');
        }
      }
    } catch (error) {
      toast.error('Erro ao carregar informações do perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não encontrado');

      // Update user metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { 
          full_name: userName,
          name: userName
        }
      });

      if (authError) throw authError;

      // Update webhook configuration and company name
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          n8n_webhook_url: webhookUrl || null,
          notification_days_before: parseInt(notificationDays),
          company_name: companyName || null
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      toast.success("Suas informações foram atualizadas com sucesso.");
    } catch (error) {
      toast.error('Erro ao atualizar informações');
    } finally {
      setSaving(false);
    }
  };

  const handleTestWebhook = async () => {
    if (!webhookUrl) {
      toast.error('Configure a URL do webhook antes de testar');
      return;
    }

    setTesting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const testPayload = {
        user_id: user?.id,
        user_name: userName,
        user_email: userEmail,
        expenses: [
          {
            description: "Teste de Notificação",
            amount: 100.00,
            due_day: 15,
            due_date: new Date().toISOString().split('T')[0],
            days_until_due: 3,
            category: "Teste",
            payment_method: "pix"
          }
        ],
        total_amount: 100.00,
        notification_date: new Date().toISOString().split('T')[0],
        days_before_notification: parseInt(notificationDays),
        is_test: true
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload),
      });

      if (response.ok) {
        toast.success('Webhook de teste enviado com sucesso! Verifique seu n8n.');
      } else {
        toast.error(`Erro ao enviar webhook: ${response.status}`);
      }
    } catch (error) {
      toast.error('Erro ao testar webhook');
    } finally {
      setTesting(false);
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
      toast.error('Erro ao enviar email de redefinição');
    }
  };

  const handleToggleBiometric = async (enabled: boolean) => {
    if (enabled) {
      const success = await registerBiometric(userId, userEmail);
      if (success) {
        await checkAvailability();
      }
    } else {
      removeBiometric();
    }
  };

  const handleSaveCompanyName = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não encontrado');

      const { error } = await supabase
        .from('profiles')
        .update({ company_name: companyName || null })
        .eq('id', user.id);

      if (error) throw error;

      // Atualizar o contexto imediatamente
      if (mode === 'business') {
        updateBusinessContext(companyName);
      }

      toast.success("Nome da empresa atualizado com sucesso!");
    } catch (error) {
      console.error('Erro ao atualizar nome da empresa:', error);
      toast.error('Erro ao atualizar nome da empresa');
    } finally {
      setSaving(false);
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
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notificações
              </CardTitle>
              <CardDescription>
                Configure notificações automáticas de despesas recorrentes via n8n.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="webhook-url">URL do Webhook n8n</Label>
                  <TooltipHelper content="Cole aqui a URL do webhook gerada no seu workflow n8n">
                    <Input 
                      id="webhook-url" 
                      placeholder="https://seu-n8n.com/webhook/..." 
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      disabled={saving}
                    />
                  </TooltipHelper>
                  <p className="text-xs text-muted-foreground">
                    Crie um workflow no n8n com Webhook trigger e cole a URL aqui
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notification-days">Dias de Antecedência</Label>
                  <TooltipHelper content="Quantos dias antes do vencimento você quer ser notificado">
                    <Select value={notificationDays} onValueChange={setNotificationDays} disabled={saving}>
                      <SelectTrigger id="notification-days">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 dia antes</SelectItem>
                        <SelectItem value="2">2 dias antes</SelectItem>
                        <SelectItem value="3">3 dias antes</SelectItem>
                        <SelectItem value="5">5 dias antes</SelectItem>
                        <SelectItem value="7">7 dias antes</SelectItem>
                      </SelectContent>
                    </Select>
                  </TooltipHelper>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={handleTestWebhook}
                    disabled={testing || !webhookUrl}
                    className="flex-1"
                  >
                    {testing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Testando...
                      </>
                    ) : (
                      <>
                        <TestTube className="mr-2 h-4 w-4" />
                        Testar Webhook
                      </>
                    )}
                  </Button>
                </div>

                <div className="rounded-lg bg-muted p-4 text-sm">
                  <p className="font-medium mb-2">📋 Como configurar:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Crie um workflow no n8n</li>
                    <li>Adicione um nó "Webhook"</li>
                    <li>Copie a URL do webhook</li>
                    <li>Cole aqui e clique em "Salvar Alterações"</li>
                    <li>Use "Testar Webhook" para verificar</li>
                    <li>Receberá notificações diariamente às 9h</li>
                  </ol>
                </div>
              </div>
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

              {biometricAvailable && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Fingerprint className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Autenticação Biométrica</h3>
                      <p className="text-sm text-muted-foreground">
                        {biometricRegistered 
                          ? 'Face ID / Touch ID ativado' 
                          : 'Login rápido com Face ID / Touch ID'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={biometricRegistered}
                      onCheckedChange={handleToggleBiometric}
                    />
                    <TooltipHelper content="Ativar/desativar login com biometria">
                      <div className="cursor-help">
                        <Fingerprint className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </TooltipHelper>
                  </div>
                </div>
              )}

              {biometricAvailable && (
                <div className="rounded-lg bg-muted p-4 text-sm">
                  <div className="flex items-start gap-2">
                    <Smartphone className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium mb-1">📱 Login Biométrico</p>
                      <p className="text-muted-foreground">
                        Ative para fazer login usando Face ID (iPhone/iPad) ou Touch ID/Digital (Android). 
                        Mais rápido e seguro que digitar senha.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {mode === 'business' && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Configurações Empresariais
                </CardTitle>
                <CardDescription>
                  Configure as informações da sua empresa no modo business.
                </CardDescription>
              </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="company-name">Nome da Empresa</Label>
                    <TooltipHelper content="Nome que aparecerá no dashboard empresarial">
                      <Input 
                        id="company-name" 
                        placeholder="Ex: Zenith Saúde" 
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        disabled={saving}
                      />
                    </TooltipHelper>
                    <p className="text-xs text-muted-foreground">
                      Este nome será exibido na saudação do dashboard empresarial
                    </p>
                  </div>
                  
                  <Button 
                    onClick={handleSaveCompanyName} 
                    disabled={saving}
                    className="w-full"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      'Salvar Nome da Empresa'
                    )}
                  </Button>
                </CardContent>
            </Card>
          )}
        </div>
      </TooltipProvider>
    </MainLayout>
  );
};

export default Profile;
