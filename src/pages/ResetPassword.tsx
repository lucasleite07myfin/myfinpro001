import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

// Schema for password reset validation
const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, 'A senha deve ter pelo menos 8 caracteres')
    .regex(/[A-Z]/, 'Deve conter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'Deve conter pelo menos uma letra minúscula')
    .regex(/[0-9]/, 'Deve conter pelo menos um número')
    .regex(/[^A-Za-z0-9]/, 'Deve conter pelo menos um caractere especial'),
  confirmPassword: z.string().min(8, 'A confirmação da senha deve ter pelo menos 8 caracteres'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

const ResetPassword = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Initialize the form
  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    const handlePasswordReset = async () => {
      try {
        setIsLoading(true);
        
        // Verifica se há tokens de recuperação na URL
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');
        const type = searchParams.get('type');
        
        console.log('URL params:', { accessToken: !!accessToken, refreshToken: !!refreshToken, type });
        
        // Se está vindo do link do email com tokens
        if (accessToken && refreshToken && type === 'recovery') {
          console.log('Setting session with tokens from URL');
          
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          
          if (error) {
            console.error('Erro ao definir sessão:', error);
            throw error;
          }
          
          console.log('Session set successfully:', data);
          setIsValidSession(true);
          return;
        }
        
        // Verifica se já existe uma sessão válida
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Erro ao obter sessão:', sessionError);
          throw sessionError;
        }
        
        if (session) {
          console.log('Valid session found');
          setIsValidSession(true);
          return;
        }
        
        // Se não há sessão válida, redireciona
        console.log('No valid session found, redirecting to auth');
        toast.error('O link de recuperação é inválido ou expirou.');
        navigate('/auth');
        
      } catch (error) {
        console.error('Erro no processo de reset:', error);
        toast.error('O link de recuperação é inválido ou expirou.');
        navigate('/auth');
      } finally {
        setIsLoading(false);
      }
    };

    handlePasswordReset();
  }, [searchParams, navigate]);

  const onSubmit = async (values: ResetPasswordFormValues) => {
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: values.password
      });

      if (error) throw error;

      toast.success('Sua senha foi redefinida. Você pode fazer login agora.');
      
      // Faz logout e redireciona para login
      await supabase.auth.signOut();
      navigate('/auth');
    } catch (error: any) {
      console.error('Erro ao redefinir senha:', error);
      toast.error('Ocorreu um erro ao redefinir sua senha. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mostra loading enquanto verifica a sessão
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p className="text-muted-foreground">Verificando link de recuperação...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se não tem sessão válida, não mostra o formulário
  if (!isValidSession) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-6">
            <img src="/lovable-uploads/3ac31d22-79b8-44f6-b7ba-5baf7d682784.png" alt="MyFin Pro Logo" className="h-16" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Nova Senha</CardTitle>
          <CardDescription className="text-center">
            Digite sua nova senha abaixo
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nova Senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          <Lock className="h-4 w-4" />
                        </span>
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Digite sua nova senha"
                          className="pl-10 pr-10"
                          disabled={isSubmitting}
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          disabled={isSubmitting}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Nova Senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          <Lock className="h-4 w-4" />
                        </span>
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirme sua nova senha"
                          className="pl-10 pr-10"
                          disabled={isSubmitting}
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          disabled={isSubmitting}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Alterando senha...' : 'Alterar senha'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
