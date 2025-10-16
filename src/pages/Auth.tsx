import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff } from 'lucide-react';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Verifica se já está logado
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/');
      }
    };
    checkUser();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      toast.error('Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        toast.success('Verifique seu email para confirmar a conta.');
        
        // Limpa os campos
        setEmail('');
        setPassword('');
        setFullName('');
      }
    } catch (error: any) {
      console.error('Erro no cadastro:', error);
      let message = 'Erro ao criar conta. Tente novamente.';
      
      if (error.message.includes('already registered')) {
        message = 'Este email já está registrado. Tente fazer login.';
      } else if (error.message.includes('weak password')) {
        message = 'A senha deve ter pelo menos 6 caracteres.';
      } else if (error.message.includes('invalid email')) {
        message = 'Email inválido. Verifique o formato.';
      }
      
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Por favor, informe email e senha.');
      return;
    }

    setLoading(true);
    try {
      // Limpa estado de autenticação anterior
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Ignora erros de logout
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        toast.success('Redirecionando...');
        
        // Força recarregamento da página para estado limpo
        window.location.href = '/';
      }
    } catch (error: any) {
      console.error('Erro no login:', error);
      let message = 'Erro ao fazer login. Verifique suas credenciais.';
      
      if (error.message.includes('Invalid login credentials')) {
        message = 'Email ou senha incorretos.';
      } else if (error.message.includes('Email not confirmed')) {
        message = 'Confirme seu email antes de fazer login.';
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
            <CardTitle className="text-2xl text-center text-card-foreground">Acesse sua conta</CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              Faça login ou crie uma nova conta
            </CardDescription>
          </CardHeader>
          <CardContent>
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

                  <Button
                    type="submit"
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
                    disabled={loading}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Entrar
                  </Button>

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
                      A senha deve ter pelo menos 6 caracteres
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