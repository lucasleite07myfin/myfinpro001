import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '@/hooks/useSubscription';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Crown, Sparkles } from 'lucide-react';

interface SubscriptionGuardProps {
  children: ReactNode;
}

export const SubscriptionGuard = ({ children }: SubscriptionGuardProps) => {
  const { isPremium, loading } = useSubscription();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!isPremium) {
    return (
      <Card className="border-primary/50 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-6 w-6 text-yellow-500" />
            Recurso Premium
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Este recurso está disponível apenas para assinantes premium do MyFin Pro.
          </p>
          <div className="bg-background/80 p-4 rounded-lg border">
            <p className="font-semibold mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-yellow-500" />
              Desbloqueie todos os recursos:
            </p>
            <ul className="space-y-1 text-sm text-muted-foreground ml-6">
              <li>✅ Acesso total a todas as funcionalidades</li>
              <li>✅ Sincronização em tempo real</li>
              <li>✅ Suporte prioritário</li>
              <li>✅ Atualizações automáticas</li>
              <li>✅ 3 dias de teste grátis</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={() => navigate('/subscription')} className="w-full" size="lg">
            <Crown className="mr-2 h-4 w-4" />
            Ver Planos Premium
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return <>{children}</>;
};
