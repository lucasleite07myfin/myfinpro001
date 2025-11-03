
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CustomTabTriggers } from '@/components/ui/custom-tabs';
import { toast } from 'sonner';
import { validateCPF, validateCNPJ } from '@/utils/documentValidator';
import { supabase } from '@/integrations/supabase/client';
import { sanitizeEmail, sanitizeText } from '@/utils/xssSanitizer';
import { checkRateLimit } from '@/utils/rateLimiter';

// Schema for registration validation
const registerSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Por favor, insira um e-mail válido'),
  document: z.string().min(1, 'Este campo é obrigatório'),
  password: z.string()
    .min(8, 'A senha deve ter pelo menos 8 caracteres')
    .regex(/[A-Z]/, 'Deve conter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'Deve conter pelo menos uma letra minúscula')
    .regex(/[0-9]/, 'Deve conter pelo menos um número')
    .regex(/[^A-Za-z0-9]/, 'Deve conter pelo menos um caractere especial'),
  confirmPassword: z.string().min(8, 'A confirmação de senha é obrigatória'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [userType, setUserType] = useState<'personal' | 'business'>('personal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Initialize the form
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      document: '',
      password: '',
      confirmPassword: '',
    },
  });

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const generateStrongPassword = () => {
    const length = 16;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let password = "";
    
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    
    form.setValue('password', password);
    form.setValue('confirmPassword', password);
    setShowPassword(true);
    setShowConfirmPassword(true);
    
    toast.success('Uma senha forte foi gerada e preenchida para você.');
  };

  const onSubmit = async (values: RegisterFormValues) => {
    // Validate document based on user type
    let isValid = true;
    
    if (userType === 'personal' && !validateCPF(values.document)) {
      toast.error('Por favor, verifique o CPF informado.');
      isValid = false;
    } else if (userType === 'business' && !validateCNPJ(values.document)) {
      toast.error('Por favor, verifique o CNPJ informado.');
      isValid = false;
    }

    if (!isValid) return;

    // Sanitize inputs for security
    const sanitizedEmail = sanitizeEmail(values.email);
    const sanitizedName = sanitizeText(values.name);

    if (!sanitizedEmail || !sanitizedName) {
      toast.error('Por favor, verifique os dados informados.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Check rate limiting
      const rateLimitResult = await checkRateLimit(sanitizedEmail, 'signup');
      if (!rateLimitResult.allowed) {
        toast.error(rateLimitResult.message || 'Muitas tentativas. Aguarde alguns instantes.');
        setIsSubmitting(false);
        return;
      }

      // Create account in Supabase
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password: values.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: sanitizedName,
            document: values.document,
            user_type: userType
          }
        }
      });

      // Handle errors
      if (error) {
        if (error.message?.includes('already registered')) {
          toast.error('Este email já está registrado. Tente fazer login.');
        } else if (error.message?.includes('weak password')) {
          toast.error('A senha deve ter pelo menos 8 caracteres fortes.');
        } else if (error.message?.includes('invalid email')) {
          toast.error('Email inválido. Verifique o formato.');
        } else {
          toast.error('Erro ao criar conta. Tente novamente.');
        }
        setIsSubmitting(false);
        return;
      }

      // Success handling
      if (data.user && data.session) {
        // User created and auto-confirmed (development)
        toast.success('Conta criada! Redirecionando...');
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      } else if (data.user) {
        // User created but needs to confirm email
        toast.success('Conta criada! Verifique seu email para confirmar.');
        form.reset();
        setIsSubmitting(false);
      }
    } catch (error: any) {
      console.error('Erro no cadastro:', error);
      toast.error('Erro inesperado ao criar conta.');
      setIsSubmitting(false);
    }
  };

  // Label and placeholder based on user type
  const getDocumentLabel = () => {
    return userType === 'personal' ? 'CPF' : 'CNPJ';
  };

  const getDocumentPlaceholder = () => {
    return userType === 'personal' ? '000.000.000-00' : '00.000.000/0000-00';
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-6">
            <img src="/lovable-uploads/3ac31d22-79b8-44f6-b7ba-5baf7d682784.png" alt="MyFin Pro Logo" className="h-16" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Cadastro</CardTitle>
          <CardDescription className="text-center">
            Crie sua conta para começar a usar o MyFin Pro
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <CustomTabTriggers
            items={[
              { value: 'personal', label: 'Pessoa Física' },
              { value: 'business', label: 'Pessoa Jurídica' }
            ]}
            value={userType}
            onValueChange={(v) => setUserType(v as 'personal' | 'business')}
            className="grid w-full grid-cols-2 mb-6"
          />

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{userType === 'personal' ? 'Nome completo' : 'Nome da empresa'}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          <User className="h-4 w-4" />
                        </span>
                        <Input
                          placeholder={userType === 'personal' ? 'João da Silva' : 'Empresa LTDA'}
                          className="pl-10"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          <Mail className="h-4 w-4" />
                        </span>
                        <Input
                          placeholder="exemplo@email.com"
                          className="pl-10"
                          type="email"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="document"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{getDocumentLabel()}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          <User className="h-4 w-4" />
                        </span>
                        <Input
                          placeholder={getDocumentPlaceholder()}
                          className="pl-10"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          <Lock className="h-4 w-4" />
                        </span>
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Senha"
                          className="pl-10 pr-10"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={togglePasswordVisibility}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <div className="flex justify-between items-center mt-1">
                      <FormMessage />
                      <button
                        type="button"
                        onClick={generateStrongPassword}
                        className="text-xs text-primary hover:underline"
                      >
                        Sugerir senha forte
                      </button>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          <Lock className="h-4 w-4" />
                        </span>
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirme sua senha"
                          className="pl-10 pr-10"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={toggleConfirmPasswordVisibility}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
                {isSubmitting ? 'Cadastrando...' : 'Cadastrar'}
              </Button>
            </form>
          </Form>
        </CardContent>
        
        <CardFooter className="flex justify-center">
          <div className="text-center">
            <span className="text-muted-foreground text-sm">Já possui uma conta?</span>{' '}
            <Link to="/login" className="text-sm text-primary hover:underline">
              Faça login
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Register;
