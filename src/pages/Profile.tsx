
import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { User, Mail, KeyRound, Loader2, Lock, ShieldAlert } from 'lucide-react';
import { TooltipProvider } from '@/components/ui/tooltip';
import TooltipHelper from '@/components/TooltipHelper';
import { tooltipContent } from '@/data/tooltipContent';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2 } from 'lucide-react';
import { useAppMode } from '@/contexts/AppModeContext';
import { useBusiness } from '@/contexts/BusinessContext';
import ChangePinSection from '@/components/ChangePinSection';
import ResetPinModal from '@/components/ResetPinModal';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [pinRequired, setPinRequired] = useState(true);
  const [showDisablePinDialog, setShowDisablePinDialog] = useState(false);
  const [disablingPin, setDisablingPin] = useState(false);
  const [currentPin, setCurrentPin] = useState(['', '', '', '']);
  
  const { mode } = useAppMode();
  const { setCompanyName: updateBusinessContext } = useBusiness();

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
        
        // Load company name and pin settings from profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('company_name, pin_required')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setCompanyName(profile.company_name || '');
          setPinRequired(profile.pin_required ?? true);
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

      // Update company name
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
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

  const handleTogglePin = async (enabled: boolean) => {
    if (enabled) {
      // Ativar PIN - apenas atualizar o flag
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Verificar se já tem PIN configurado
        const { data: profile } = await supabase
          .from('profiles')
          .select('mode_switch_pin_hash')
          .eq('id', user.id)
          .single();

        if (!profile?.mode_switch_pin_hash) {
          toast.error('Configure um PIN primeiro antes de ativar a proteção');
          return;
        }

        const { error } = await supabase
          .from('profiles')
          .update({ pin_required: true })
          .eq('id', user.id);

        if (error) throw error;

        setPinRequired(true);
        toast.success('PIN ativado com sucesso');
      } catch (error) {
        console.error('Erro ao ativar PIN:', error);
        toast.error('Erro ao ativar PIN');
      }
    } else {
      // Desativar PIN - mostrar diálogo de confirmação
      setShowDisablePinDialog(true);
    }
  };

  const confirmDisablePin = async () => {
    setDisablingPin(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Usuário não encontrado');
        return;
      }

      const pin = currentPin.join('');
      if (pin.length !== 4) {
        toast.error('Digite o PIN de 4 dígitos');
        return;
      }

      // Validar PIN atual
      const { data, error } = await supabase.functions.invoke('validate-mode-pin', {
        body: { pin, action: 'validate' }
      });

      if (error) throw error;

      if (!data.valid) {
        toast.error('PIN incorreto');
        setCurrentPin(['', '', '', '']);
        return;
      }

      // Desativar PIN
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ pin_required: false })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setPinRequired(false);
      setShowDisablePinDialog(false);
      setCurrentPin(['', '', '', '']);
      toast.success('PIN desativado. A alternância de modos não requer mais PIN.');
    } catch (error) {
      console.error('Erro ao desativar PIN:', error);
      toast.error('Erro ao desativar PIN');
    } finally {
      setDisablingPin(false);
    }
  };

  const handlePinChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;

    const newPin = [...currentPin];
    newPin[index] = value;
    setCurrentPin(newPin);

    if (value && index < 3) {
      const nextInput = document.getElementById(`disable-pin-${index + 1}`);
      nextInput?.focus();
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

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                PIN de Alternância de Modos
              </CardTitle>
              <CardDescription>
                Gerencie o PIN que protege a alternância entre os modos pessoal e empresarial.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!pinRequired && (
                <Alert variant="destructive">
                  <ShieldAlert className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Aviso de Segurança:</strong> O PIN está desativado. A alternância entre modos pessoal e empresarial pode ser feita sem autenticação. Recomendamos manter o PIN ativado se você compartilha este dispositivo.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="pin-toggle" className="text-base font-medium">
                    Exigir PIN para Alternar Modos
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {pinRequired 
                      ? 'PIN é necessário ao alternar entre modo pessoal e empresarial'
                      : 'Você pode alternar entre modos sem digitar o PIN'}
                  </p>
                </div>
                <TooltipHelper content={pinRequired ? 'Desativar proteção por PIN' : 'Ativar proteção por PIN'}>
                  <Switch
                    id="pin-toggle"
                    checked={pinRequired}
                    onCheckedChange={handleTogglePin}
                  />
                </TooltipHelper>
              </div>

              <ChangePinSection userId={userId} />
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
                        placeholder="Digite aqui o nome da sua empresa" 
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
      <ResetPinModal />

      <AlertDialog open={showDisablePinDialog} onOpenChange={setShowDisablePinDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar PIN de Segurança?</AlertDialogTitle>
            <AlertDescription className="space-y-4">
              <p>
                <strong>Atenção:</strong> Ao desativar o PIN, qualquer pessoa com acesso ao seu dispositivo poderá alternar entre os modos pessoal e empresarial sem autenticação.
              </p>
              <p>
                Para confirmar, digite seu PIN atual:
              </p>
              <div className="flex gap-2 justify-center mt-4">
                {[0, 1, 2, 3].map((index) => (
                  <Input
                    key={index}
                    id={`disable-pin-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className="w-12 h-12 text-center text-lg font-semibold"
                    value={currentPin[index]}
                    onChange={(e) => handlePinChange(index, e.target.value)}
                    disabled={disablingPin}
                  />
                ))}
              </div>
            </AlertDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setCurrentPin(['', '', '', '']);
              }}
              disabled={disablingPin}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDisablePin}
              disabled={disablingPin || currentPin.join('').length !== 4}
              className="bg-destructive hover:bg-destructive/90"
            >
              {disablingPin ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Desativando...
                </>
              ) : (
                'Desativar PIN'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default Profile;
