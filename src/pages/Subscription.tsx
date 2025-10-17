import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Crown, Check, AlertCircle, Sparkles, Loader2, Tag, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Subscription = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    subscription,
    loading,
    creating,
    isActive,
    isPremium,
    isTrial,
    trialDaysLeft,
    createCheckout,
    cancelSubscription,
  } = useSubscription();

  const [couponCode, setCouponCode] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [couponValid, setCouponValid] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [canceling, setCanceling] = useState(false);

  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');

    if (success === 'true') {
      toast.success('Assinatura iniciada com sucesso! Aproveite seu período de teste.');
      // Limpar query params
      navigate('/subscription', { replace: true });
    } else if (canceled === 'true') {
      toast.info('Checkout cancelado. Você pode tentar novamente quando quiser.');
      navigate('/subscription', { replace: true });
    }
  }, [searchParams, navigate]);

  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Digite um código de cupom');
      return;
    }

    setValidatingCoupon(true);
    setCouponValid(false);
    setCouponDiscount(0);

    try {
      const { data, error } = await supabase.functions.invoke('validate-coupon', {
        body: { code: couponCode },
      });

      if (error) throw error;

      if (data?.valid) {
        setCouponValid(true);
        setCouponDiscount(data.discount_percent);
        toast.success(`Cupom válido! ${data.discount_percent}% de desconto aplicado`);
      } else {
        toast.error(data?.error || 'Cupom inválido');
      }
    } catch (error) {
      console.error('Error validating coupon:', error);
      toast.error('Erro ao validar cupom. Tente novamente.');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleSelectPlan = async (planType: 'monthly' | 'annual') => {
    await createCheckout(planType, couponValid ? couponCode : undefined);
  };

  const handleCancel = async () => {
    if (!confirm('Tem certeza que deseja cancelar sua assinatura?')) return;

    setCanceling(true);
    await cancelSubscription();
    setCanceling(false);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  const getPlanPrice = (planType: 'monthly' | 'annual') => {
    const prices = {
      monthly: 29.90,
      annual: 249.90,
    };
    const price = prices[planType];
    
    if (couponValid && couponDiscount > 0) {
      const discountedPrice = price * (1 - couponDiscount / 100);
      return {
        original: price,
        discounted: discountedPrice,
        hasDiscount: true,
      };
    }
    
    return {
      original: price,
      discounted: price,
      hasDiscount: false,
    };
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-6xl p-4 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Crown className="h-8 w-8 text-yellow-500" />
          <div>
            <h1 className="text-3xl font-bold">MyFin Pro</h1>
            <p className="text-muted-foreground">Escolha o plano ideal para você</p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate('/')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao Dashboard
        </Button>
      </div>

      {/* Status Atual */}
      {isTrial && (
        <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
          <Sparkles className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800 dark:text-yellow-200">
            🎉 Você está no período de teste! <strong>{trialDaysLeft} {trialDaysLeft === 1 ? 'dia restante' : 'dias restantes'}</strong>
          </AlertDescription>
        </Alert>
      )}

      {isActive && !isTrial && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
          <Check className="h-5 w-5 text-green-600" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="text-green-800 dark:text-green-200 font-semibold text-lg">
                ✅ Sistema Pago e Ativo
              </p>
              <p className="text-green-700 dark:text-green-300">
                Sua assinatura está ativa e renovará automaticamente em {formatDate(subscription?.current_period_end || null)}
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {!isActive && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            ℹ️ Escolha um plano para desbloquear todos os recursos do MyFin Pro
          </AlertDescription>
        </Alert>
      )}

      {/* Campo de Cupom */}
      {!isActive && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Tem um cupom de desconto?
            </CardTitle>
            <CardDescription>
              Digite o código do cupom para aplicar desconto na sua assinatura
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Digite o código do cupom"
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value.toUpperCase());
                  setCouponValid(false);
                }}
                disabled={validatingCoupon}
                className="uppercase"
              />
              <Button
                variant="outline"
                onClick={validateCoupon}
                disabled={validatingCoupon || !couponCode.trim()}
              >
                {validatingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Validar'}
              </Button>
            </div>
            {couponValid && (
              <p className="text-green-600 dark:text-green-400 mt-2 flex items-center gap-2">
                <Check className="h-4 w-4" />
                Cupom válido! {couponDiscount}% de desconto aplicado
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Cards de Planos */}
      {!isActive && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Plano Mensal */}
          <Card className="relative hover:shadow-lg transition-shadow">
            <Badge className="absolute top-4 right-4 bg-orange-500">Promocional</Badge>
            <CardHeader>
              <CardTitle className="text-2xl">Mensal</CardTitle>
              <div className="mt-4">
                {getPlanPrice('monthly').hasDiscount ? (
                  <div>
                    <div className="text-2xl text-muted-foreground line-through">
                      R$ {getPlanPrice('monthly').original.toFixed(2)}
                    </div>
                    <div className="text-4xl font-bold text-green-600">
                      R$ {getPlanPrice('monthly').discounted.toFixed(2)}
                      <span className="text-lg font-normal text-muted-foreground">/mês</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-4xl font-bold">
                    R$ {getPlanPrice('monthly').original.toFixed(2)}
                    <span className="text-lg font-normal text-muted-foreground">/mês</span>
                  </div>
                )}
              </div>
              <Badge variant="secondary" className="w-fit mt-2">
                <Sparkles className="h-3 w-3 mr-1" />
                3 dias grátis
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span>Acesso total a todas as funcionalidades</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span>Sincronização em tempo real</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span>Suporte prioritário</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span>Atualizações automáticas</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                size="lg"
                onClick={() => handleSelectPlan('monthly')}
                disabled={creating}
              >
                  {creating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Preparando checkout...
                    </>
                  ) : (
                    'Começar Teste Grátis'
                  )}
              </Button>
            </CardFooter>
          </Card>

          {/* Plano Anual */}
          <Card className="relative border-2 border-primary hover:shadow-lg transition-shadow">
            <Badge className="absolute top-4 right-4 bg-primary">Mais Popular</Badge>
            <CardHeader>
              <CardTitle className="text-2xl">Anual</CardTitle>
              <div className="mt-4">
                {getPlanPrice('annual').hasDiscount ? (
                  <div>
                    <div className="text-2xl text-muted-foreground line-through">
                      R$ {getPlanPrice('annual').original.toFixed(2)}
                    </div>
                    <div className="text-4xl font-bold text-green-600">
                      R$ {getPlanPrice('annual').discounted.toFixed(2)}
                      <span className="text-lg font-normal text-muted-foreground">/ano</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-4xl font-bold">
                    R$ {getPlanPrice('annual').original.toFixed(2)}
                    <span className="text-lg font-normal text-muted-foreground">/ano</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-green-600 dark:text-green-400 font-medium mt-1">
                Economize ~30% (mais de R$ 108/ano)
              </p>
              <Badge variant="secondary" className="w-fit mt-2">
                <Sparkles className="h-3 w-3 mr-1" />
                3 dias grátis
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span>Tudo do plano mensal</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span>Economia de R$ 108,90/ano</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span>Pagamento único anual</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span>Prioridade em novos recursos</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                size="lg"
                onClick={() => handleSelectPlan('annual')}
                disabled={creating}
              >
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Preparando checkout...
                  </>
                ) : (
                  'Começar Teste Grátis'
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Gerenciar Assinatura */}
      {isActive && (
        <Card>
          <CardHeader>
            <CardTitle>Gerenciar Assinatura</CardTitle>
            <CardDescription>Informações sobre sua assinatura atual</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={`grid ${isTrial ? 'grid-cols-2' : 'grid-cols-3'} gap-4`}>
              <div>
                <p className="text-sm text-muted-foreground">Início da assinatura</p>
                <p className="font-semibold">
                  {formatDate(subscription?.current_period_start || null)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Plano atual</p>
                <p className="font-semibold">
                  {subscription?.plan_type === 'monthly' ? 'Mensal' : 'Anual'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={isTrial ? 'secondary' : 'default'} className="w-fit">
                  {isTrial ? 'Em teste' : 'Ativo'}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Próxima renovação</p>
                <p className="font-semibold">
                  {formatDate(subscription?.current_period_end || null)}
                </p>
              </div>
              {isTrial && (
                <div>
                  <p className="text-sm text-muted-foreground">Trial termina em</p>
                  <p className="font-semibold">
                    {trialDaysLeft} {trialDaysLeft === 1 ? 'dia' : 'dias'}
                  </p>
                </div>
              )}
            </div>

            {subscription?.cancel_at_period_end && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Sua assinatura será cancelada em {formatDate(subscription.current_period_end)}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate('/')}
            >
              Voltar ao Dashboard
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={canceling || subscription?.cancel_at_period_end}
            >
              {canceling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelando...
                </>
              ) : (
                'Cancelar Assinatura'
              )}
            </Button>
          </CardFooter>
        </Card>
      )}

      <Separator />

      {/* Informações adicionais */}
      <Card>
        <CardHeader>
          <CardTitle>Perguntas Frequentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="font-semibold">Como funciona o teste gratuito?</p>
            <p className="text-sm text-muted-foreground">
              Você tem 3 dias para testar todos os recursos premium. Ao final do período, a cobrança será feita automaticamente no cartão cadastrado.
            </p>
          </div>
          <div>
            <p className="font-semibold">Posso cancelar a qualquer momento?</p>
            <p className="text-sm text-muted-foreground">
              Sim! Você pode cancelar sua assinatura a qualquer momento. O acesso continuará até o final do período pago.
            </p>
          </div>
          <div>
            <p className="font-semibold">Quais formas de pagamento são aceitas?</p>
            <p className="text-sm text-muted-foreground">
              Aceitamos cartões de crédito através do Stripe, processador de pagamentos seguro e confiável.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Subscription;
