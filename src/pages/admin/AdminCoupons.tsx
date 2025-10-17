import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import type { DiscountCoupon } from '@/types/subscription';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Shield, Plus, Tag, Calendar, Users, Loader2, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AdminCoupons = () => {
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [coupons, setCoupons] = useState<DiscountCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [code, setCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState('10');
  const [validUntil, setValidUntil] = useState('');
  const [maxUses, setMaxUses] = useState('');

  const fetchCoupons = async () => {
    try {
      const { data, error } = await supabase
        .from('discount_coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCoupons(data as DiscountCoupon[]);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      toast.error('Erro ao carregar cupons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🎯 AdminCoupons mounted/updated');
    console.log('🎯 roleLoading:', roleLoading);
    console.log('🎯 isAdmin:', isAdmin);
    
    if (isAdmin && !roleLoading) {
      fetchCoupons();
    }
    
    return () => {
      console.log('🎯 AdminCoupons cleanup');
    };
  }, [isAdmin, roleLoading]);

  const handleCreateCoupon = async () => {
    if (!code.trim()) {
      toast.error('Digite um código para o cupom');
      return;
    }

    if (!discountPercent || parseFloat(discountPercent) <= 0 || parseFloat(discountPercent) > 100) {
      toast.error('Porcentagem deve estar entre 1 e 100');
      return;
    }

    setCreating(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-coupon', {
        body: {
          code: code.trim().toUpperCase(),
          discount_percent: parseFloat(discountPercent),
          valid_until: validUntil || null,
          max_uses: maxUses ? parseInt(maxUses) : null,
        },
      });

      if (error) throw error;

      toast.success('Cupom criado com sucesso!');
      
      // Reset form
      setCode('');
      setDiscountPercent('10');
      setValidUntil('');
      setMaxUses('');
      setDialogOpen(false);
      
      // Refresh list
      fetchCoupons();
    } catch (error) {
      console.error('Error creating coupon:', error);
      const message = error instanceof Error ? error.message : 'Erro ao criar cupom';
      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  const toggleCouponStatus = async (coupon: DiscountCoupon) => {
    try {
      const { error } = await supabase
        .from('discount_coupons')
        .update({ is_active: !coupon.is_active })
        .eq('id', coupon.id);

      if (error) throw error;

      toast.success(coupon.is_active ? 'Cupom desativado' : 'Cupom ativado');
      fetchCoupons();
    } catch (error) {
      console.error('Error toggling coupon:', error);
      toast.error('Erro ao atualizar cupom');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Sem limite';
    return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
  };

  // Enquanto carregando, mostrar skeleton
  if (roleLoading) {
    console.log('⏳ Showing skeleton - still loading role');
    return (
      <div className="container mx-auto max-w-6xl p-4 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  // Só redirecionar se NÃO for admin E já terminou de carregar
  if (!isAdmin) {
    console.log('⚠️ Redirecting: user is not admin');
    return <Navigate to="/" replace />;
  }

  // Se chegou aqui, é admin e pode ver a página
  console.log('✅ Rendering admin coupons page');

  return (
    <div className="container mx-auto max-w-6xl p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Gestão de Cupons</h1>
            <p className="text-muted-foreground">Crie e gerencie cupons de desconto</p>
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Cupom
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Cupom</DialogTitle>
              <DialogDescription>
                Preencha os dados para criar um cupom de desconto
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="code">Código do Cupom *</Label>
                <Input
                  id="code"
                  placeholder="Ex: BEMVINDO10"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="uppercase"
                />
                <p className="text-xs text-muted-foreground">
                  Use letras e números, sem espaços
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount">Desconto (%) *</Label>
                <Input
                  id="discount"
                  type="number"
                  min="1"
                  max="100"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="validUntil">Válido até (opcional)</Label>
                <Input
                  id="validUntil"
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Deixe em branco para cupom sem data de expiração
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxUses">Limite de usos (opcional)</Label>
                <Input
                  id="maxUses"
                  type="number"
                  min="1"
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Deixe em branco para usos ilimitados
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateCoupon} disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  'Criar Cupom'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Separator />

      {/* Estatísticas */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Cupons
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{coupons.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {coupons.filter((c) => c.is_active).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Inativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">
              {coupons.filter((c) => !c.is_active).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Usos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {coupons.reduce((sum, c) => sum + c.current_uses, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Cupons */}
      <Card>
        <CardHeader>
          <CardTitle>Cupons Cadastrados</CardTitle>
          <CardDescription>
            Lista de todos os cupons de desconto criados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : coupons.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Tag className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Nenhum cupom cadastrado ainda</p>
              <p className="text-sm">Clique em "Novo Cupom" para criar o primeiro</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Desconto</TableHead>
                    <TableHead>Usos</TableHead>
                    <TableHead>Validade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coupons.map((coupon) => (
                    <TableRow key={coupon.id}>
                      <TableCell className="font-mono font-semibold">
                        {coupon.code}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{coupon.discount_percent}%</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {coupon.current_uses}
                            {coupon.max_uses ? ` / ${coupon.max_uses}` : ''}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{formatDate(coupon.valid_until)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {coupon.is_active ? (
                          <Badge className="bg-green-500">
                            <Check className="h-3 w-3 mr-1" />
                            Ativo
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <X className="h-3 w-3 mr-1" />
                            Inativo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleCouponStatus(coupon)}
                        >
                          {coupon.is_active ? 'Desativar' : 'Ativar'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCoupons;
