
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Lock, Mail, User, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { validateCPF, validateCNPJ } from '@/utils/documentValidator';

// Schema for login validation
const loginSchema = z.object({
  identifier: z.string().min(1, 'Este campo é obrigatório'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loginType, setLoginType] = useState<'email' | 'cpf' | 'cnpj'>('email');
  const navigate = useNavigate();

  // Initialize the form
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: '',
      password: '',
    },
  });

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const onSubmit = (values: LoginFormValues) => {
    // Validate based on login type
    let isValid = true;

    if (loginType === 'cpf' && !validateCPF(values.identifier)) {
      toast({
        title: 'CPF inválido',
        description: 'Por favor, verifique o CPF informado.',
        variant: 'destructive',
      });
      isValid = false;
    } else if (loginType === 'cnpj' && !validateCNPJ(values.identifier)) {
      toast({
        title: 'CNPJ inválido',
        description: 'Por favor, verifique o CNPJ informado.',
        variant: 'destructive',
      });
      isValid = false;
    }

    if (isValid) {
      // Here you would typically call an API to authenticate
      console.log('Login attempt:', { ...values, loginType });
      
      // Simulate successful login
      toast({
        title: 'Login realizado',
        description: 'Você foi autenticado com sucesso!',
      });
      
      // Navigate to the main page
      navigate('/');
    }
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
    setShowPassword(true);
    
    toast({
      title: 'Senha forte gerada',
      description: 'Uma senha forte foi gerada e preenchida para você.',
    });
  };

  // Label and placeholder based on login type
  const getInputDetails = () => {
    switch (loginType) {
      case 'email':
        return {
          label: 'E-mail',
          placeholder: 'exemplo@email.com',
          icon: <Mail className="h-4 w-4" />,
        };
      case 'cpf':
        return {
          label: 'CPF',
          placeholder: '000.000.000-00',
          icon: <User className="h-4 w-4" />,
        };
      case 'cnpj':
        return {
          label: 'CNPJ',
          placeholder: '00.000.000/0000-00',
          icon: <User className="h-4 w-4" />,
        };
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-6">
            <img src="/lovable-uploads/3ac31d22-79b8-44f6-b7ba-5baf7d682784.png" alt="MyFin Pro Logo" className="h-16" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
          <CardDescription className="text-center">
            Entre com suas credenciais para acessar sua conta
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs value={loginType} onValueChange={(v) => setLoginType(v as 'email' | 'cpf' | 'cnpj')} className="mb-6">
            <TabsList className="grid w-full grid-cols-3 bg-gray-100">
              <TabsTrigger 
                value="email" 
                className="data-[state=active]:bg-[#EE680D] data-[state=active]:text-white"
              >
                E-mail
              </TabsTrigger>
              <TabsTrigger 
                value="cpf" 
                className="data-[state=active]:bg-[#EE680D] data-[state=active]:text-white"
              >
                CPF
              </TabsTrigger>
              <TabsTrigger 
                value="cnpj" 
                className="data-[state=active]:bg-[#EE680D] data-[state=active]:text-white"
              >
                CNPJ
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="identifier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{getInputDetails().label}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          {getInputDetails().icon}
                        </span>
                        <Input
                          placeholder={getInputDetails().placeholder}
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
              
              <Button type="submit" className="w-full">Entrar</Button>
            </form>
          </Form>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center w-full">
            <Link to="/forgot-password" className="text-sm text-primary hover:underline">
              Esqueceu sua senha?
            </Link>
          </div>
          <div className="text-center w-full">
            <span className="text-muted-foreground text-sm">Não possui uma conta?</span>{' '}
            <Link to="/register" className="text-sm text-primary hover:underline">
              Cadastre-se
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
