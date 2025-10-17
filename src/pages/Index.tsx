
import React from 'react';
import Dashboard from './Dashboard';
import BusinessDashboard from './business/Dashboard';
import MainLayout from '@/components/MainLayout';
import { useAppMode } from '@/contexts/AppModeContext';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';

const Index = () => {
  const { mode } = useAppMode();
  const { user } = useAuth();

  // Se não estiver logado, mostra página de boas-vindas simples
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-md">
          <h1 className="text-4xl font-bold text-foreground mb-4">MyFin</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Sistema completo de gestão financeira pessoal e empresarial
          </p>
          <Link 
            to="/auth" 
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary/90 transition-colors"
          >
            Começar agora
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <MainLayout>
      {mode === 'personal' ? <Dashboard /> : <BusinessDashboard />}
    </MainLayout>
  );
};

export default Index;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = leite.07@hotmail.com
ON CONFLICT DO NOTHING;
