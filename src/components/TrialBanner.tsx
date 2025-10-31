import { useNavigate } from 'react-router-dom';
import { useSubscription } from '@/hooks/useSubscription';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

export const TrialBanner = () => {
  const { isTrial, trialDaysLeft, loading } = useSubscription();
  const navigate = useNavigate();

  if (loading || !isTrial) return null;

  return (
    <Alert className="mb-4 border-yellow-500 bg-yellow-50">
      <Sparkles className="h-4 w-4 text-yellow-600" />
      <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <span className="text-yellow-800">
          🎉 Período de teste: {trialDaysLeft} {trialDaysLeft === 1 ? 'dia restante' : 'dias restantes'}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/subscription')}
          className="shrink-0 border-yellow-600 text-yellow-700 hover:bg-yellow-100"
        >
          Ver Planos
        </Button>
      </AlertDescription>
    </Alert>
  );
};
