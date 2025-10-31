import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff, Fingerprint } from 'lucide-react';
import { checkRateLimit } from '@/utils/rateLimiter';
import { sanitizeEmail, sanitizeText } from '@/utils/xssSanitizer';
import { useBiometric } from '@/hooks/useBiometric';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberEmail, setRememberEmail] = useState(false);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [isInviteSignup, setIsInviteSignup] = useState(false);
  const [existingUserWithInvite, setExistingUserWithInvite] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const navigate = useNavigate();
  const { isAvailable: biometricAvailable, authenticateWithBiometric } = useBiometric();

  useEffect(() => {
    // Verifica se há token de convite
    const params = new URLSearchParams(window.location.search);
    const token = params.get('invite_token');
    
    if (token) {
      setInviteToken(token);
      setIsInviteSignup(true);
      return; // Não redireciona se for convite
    }

    // Verifica se já está logado
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/');
      }
    };
    checkUser();

    // Carrega email salvo do localStorage
    const savedEmail = localStorage.getItem('remembered_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberEmail(true);
    }
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Sanitize inputs
    const sanitizedEmail = sanitizeEmail(email);
    const sanitizedFullName = sanitizeText(fullName);
    
    if (!sanitizedEmail || !password || !sanitizedFullName) {
      toast.error('Por favor, preencha todos os campos corretamente.');
      return;
    }

    setLoading(true);
    try {
      // Rate limiting check
      const rateLimitResult = await checkRateLimit(sanitizedEmail, 'signup');
      
      if (!rateLimitResult.allowed) {
        toast.error(rateLimitResult.message || 'Muitas tentativas. Aguarde antes de tentar novamente.');
        setLoading(false);
        return;
      }

      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: sanitizedFullName
          }
        }
      });

      if (error) throw error;

      if (data.user && data.session) {
        // Se for convite, processar vinculação
        if (isInviteSignup && inviteToken) {
          const { data: inviteResponse, error: inviteError } = await supabase.functions.invoke('process-invite', {
            body: { token: inviteToken, user_id: data.user.id }
          });

          if (inviteError) {
            console.error('Erro ao processar convite:', inviteError);
            toast.error('Conta criada, mas houve erro ao vincular ao proprietário.');
          } else if (inviteResponse?.already_linked) {
            toast.success('Você já está vinculado a este proprietário!');
          } else {
            toast.success('Conta criada e vinculada com sucesso!');
          }
        } else {
          if (rememberEmail) {
            localStorage.setItem('remembered_email', sanitizedEmail);
          }
          toast.success('Conta criada! Redirecionando...');
        }
        
        window.location.href = '/';
      } else if (data.user) {
        toast.success('Conta criada com sucesso! Agora você pode fazer login.');
        setEmail('');
        setPassword('');
        setFullName('');
      }
    } catch (error: any) {
      // Se for cadastro via convite E o erro é "user already registered"
      if (isInviteSignup && error.message?.includes('already registered')) {
        setExistingUserWithInvite(true);
        toast.info('Você já tem conta! Faça login para aceitar o convite.');
        setLoading(false);
        return;
      }
      
      let message = 'Erro ao criar conta. Tente novamente.';
      
      if (error.message?.includes('already registered')) {
        message = 'Este email já está registrado. Tente fazer login.';
      } else if (error.message?.includes('weak password')) {
        message = 'A senha deve ter pelo menos 8 caracteres fortes.';
      } else if (error.message?.includes('invalid email')) {
        message = 'Email inválido. Verifique o formato.';
      }
      
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    setBiometricLoading(true);
    try {
      const result = await authenticateWithBiometric();
      
      if (result?.success) {
        toast.success('Login biométrico bem-sucedido!');
        // Aguardar um pouco para garantir que a sessão foi estabelecida
        setTimeout(() => {
          window.location.href = '/';
        }, 500);
      }
    } catch (error) {
      console.error('Erro no login biométrico:', error);
      toast.error('Erro ao fazer login com biometria');
    } finally {
      setBiometricLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Sanitize inputs
    const sanitizedEmail = sanitizeEmail(email);
    
    if (!sanitizedEmail || !password) {
      toast.error('Por favor, informe email e senha válidos.');
      return;
    }

    setLoading(true);
    try {
      // Rate limiting check
      const rateLimitResult = await checkRateLimit(sanitizedEmail, 'login');
      
      if (!rateLimitResult.allowed) {
        toast.error(rateLimitResult.message || 'Muitas tentativas de login. Aguarde antes de tentar novamente.');
        setLoading(false);
        return;
      }

      // Limpa estado de autenticação anterior
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Ignora erros de logout
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password,
      });

      if (error) throw error;

      if (data.user) {
        if (rememberEmail) {
          localStorage.setItem('remembered_email', sanitizedEmail);
        } else {
          localStorage.removeItem('remembered_email');
        }

        // Salva email para uso com biometria
        localStorage.setItem('biometric_email', sanitizedEmail);

        toast.success('Redirecionando...');
        window.location.href = '/';
      }
    } catch (error: any) {
      let message = 'Erro ao fazer login. Verifique suas credenciais.';
      
      if (error.message?.includes('Invalid login credentials')) {
        message = 'Email ou senha incorretos.';
      }
      
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginAndProcessInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const sanitizedEmail = sanitizeEmail(email);
    
    if (!sanitizedEmail || !password) {
      toast.error('Por favor, informe email e senha válidos.');
      return;
    }

    setLoading(true);
    try {
      // Rate limiting check
      const rateLimitResult = await checkRateLimit(sanitizedEmail, 'login');
      
      if (!rateLimitResult.allowed) {
        toast.error(rateLimitResult.message || 'Muitas tentativas de login.');
        setLoading(false);
        return;
      }

      // Limpa sessão anterior
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Ignora erros
      }

      // Faz login
      const { data, error } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password,
      });

      if (error) throw error;

      if (data.user && inviteToken) {
        // Processar convite após login bem-sucedido
        const { data: processData, error: inviteError } = await supabase.functions.invoke('process-invite', {
          body: { token: inviteToken, user_id: data.user.id }
        });

        if (inviteError) {
          console.error('Erro ao processar convite:', inviteError);
          toast.error('Login realizado, mas houve erro ao vincular ao convite.');
        } else if (processData?.already_linked) {
          toast.success('Você já está vinculado a este proprietário!');
        } else {
          toast.success('Login realizado e vinculado ao convite com sucesso!');
        }
        
        // Redirecionar após processar
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      }
    } catch (error: any) {
      let message = 'Erro ao fazer login. Verifique suas credenciais.';
      
      if (error.message?.includes('Invalid login credentials')) {
        message = 'Email ou senha incorretos.';
      }
      
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">MyFin</h1>
          <p className="text-muted-foreground mt-2">Sistema de Gestão Financeira</p>
        </div>

        <Card className="bg-card border-border shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center text-card-foreground">
              {isInviteSignup ? 'Criar Conta de Funcionário' : 'Acesse sua conta'}
            </CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              {isInviteSignup 
                ? 'Complete seu cadastro para acessar o sistema empresarial' 
                : 'Faça login ou crie uma nova conta'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isInviteSignup ? (
              existingUserWithInvite ? (
                // Formulário de LOGIN quando usuário já existe
                <form onSubmit={handleLoginAndProcessInvite} className="space-y-4 mt-6">
                  <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      ✅ Você já tem uma conta! Faça login para aceitar o convite.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email-invite-login" className="text-sm font-medium text-foreground">
                      Email
                    </Label>
                    <Input
                      id="email-invite-login"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password-invite-login" className="text-sm font-medium text-foreground">
                      Senha
                    </Label>
                    <div className="relative">
                      <Input
                        id="password-invite-login"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring focus:ring-offset-2 pr-10"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={loading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
                    disabled={loading}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Entrar e Aceitar Convite
                  </Button>
                  
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      setExistingUserWithInvite(false);
                      setEmail('');
                      setPassword('');
                    }}
                  >
                    Voltar para criar nova conta
                  </Button>
                </form>
              ) : (
                // Formulário de CADASTRO quando usuário não existe
                <form onSubmit={handleSignUp} className="space-y-4 mt-6">
                  <div className="space-y-2">
                    <Label htmlFor="fullname" className="text-sm font-medium text-foreground">
                      Nome completo
                    </Label>
                    <Input
                      id="fullname"
                      type="text"
                      placeholder="Seu nome completo"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      disabled={loading}
                      className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email-signup" className="text-sm font-medium text-foreground">
                      Email
                    </Label>
                    <Input
                      id="email-signup"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password-signup" className="text-sm font-medium text-foreground">
                      Senha
                    </Label>
                    <div className="relative">
                      <Input
                        id="password-signup"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring focus:ring-offset-2 pr-10"
                        required
                        minLength={8}
                        pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$"
                        title="A senha deve ter pelo menos 8 caracteres, incluindo maiúsculas, minúsculas, números e caracteres especiais"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={loading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      A senha deve ter pelo menos 8 caracteres com letras maiúsculas, minúsculas, números e caracteres especiais
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
                    disabled={loading}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Criar conta
                  </Button>
                </form>
              )
            ) : (
              // Estrutura com Tabs para login/cadastro normal
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-muted">
                  <TabsTrigger value="login" className="data-[state=active]:bg-orange data-[state=active]:text-white">
                    Entrar
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="data-[state=active]:bg-orange data-[state=active]:text-white">
                    Cadastrar
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="mt-6">
                  <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-login" className="text-sm font-medium text-foreground">
                      Email
                    </Label>
                    <Input
                      id="email-login"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password-login" className="text-sm font-medium text-foreground">
                      Senha
                    </Label>
                    <div className="relative">
                      <Input
                        id="password-login"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring focus:ring-offset-2 pr-10"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={loading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember-email"
                      checked={rememberEmail}
                      onCheckedChange={(checked) => {
                        setRememberEmail(checked as boolean);
                        if (!checked) {
                          localStorage.removeItem('remembered_email');
                        }
                      }}
                      disabled={loading}
                    />
                    <Label
                      htmlFor="remember-email"
                      className="text-sm font-medium text-foreground cursor-pointer"
                    >
                      Lembrar meu email
                    </Label>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
                    disabled={loading}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Entrar
                  </Button>

                  {biometricAvailable && (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={handleBiometricLogin}
                      disabled={biometricLoading}
                    >
                      {biometricLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Autenticando...
                        </>
                      ) : (
                        <>
                          <Fingerprint className="mr-2 h-4 w-4" />
                          Entrar com Face ID / Touch ID
                        </>
                      )}
                    </Button>
                  )}

                  <div className="mt-3 text-center">
                    <Link 
                      to="/forgot-password" 
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Esqueci minha senha
                    </Link>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-6">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullname" className="text-sm font-medium text-foreground">
                      Nome completo
                    </Label>
                    <Input
                      id="fullname"
                      type="text"
                      placeholder="Seu nome completo"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      disabled={loading}
                      className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email-signup" className="text-sm font-medium text-foreground">
                      Email
                    </Label>
                    <Input
                      id="email-signup"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password-signup" className="text-sm font-medium text-foreground">
                      Senha
                    </Label>
                    <div className="relative">
                      <Input
                        id="password-signup"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring focus:ring-offset-2 pr-10"
                        required
                        minLength={8}
                        pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$"
                        title="A senha deve ter pelo menos 8 caracteres, incluindo maiúsculas, minúsculas, números e caracteres especiais"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={loading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      A senha deve ter pelo menos 8 caracteres com letras maiúsculas, minúsculas, números e caracteres especiais
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
                    disabled={loading}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Criar conta
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
            )}

            <div className="mt-6 text-center">
              <Link 
                to="/" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Voltar ao início
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
