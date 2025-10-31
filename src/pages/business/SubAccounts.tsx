import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserPlus, Trash2, Eye, Edit, Check, X, Mail, Clock } from 'lucide-react';
import InviteSubAccountModal from '@/components/InviteSubAccountModal';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface SubAccount {
  id: string;
  sub_user_id: string;
  is_active: boolean;
  created_at: string;
  can_view_transactions: boolean;
  can_create_transactions: boolean;
  can_edit_transactions: boolean;
  can_delete_transactions: boolean;
  can_view_investments: boolean;
  can_manage_investments: boolean;
  can_view_suppliers: boolean;
  can_manage_suppliers: boolean;
  can_view_dre: boolean;
  can_view_cashflow: boolean;
}

interface PendingInvite {
  id: string;
  email: string;
  created_at: string;
  expires_at: string;
  additional_info?: {
    department?: string;
    position?: string;
  };
}

const SubAccounts: React.FC = () => {
  const [subAccounts, setSubAccounts] = useState<SubAccount[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cancelInviteDialogOpen, setCancelInviteDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [selectedInvite, setSelectedInvite] = useState<string | null>(null);

  const loadSubAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('business_sub_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setSubAccounts(data || []);
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error);
      toast.error('Erro ao carregar funcionários');
    } finally {
      setLoading(false);
    }
  };

  const loadPendingInvites = async () => {
    try {
      const { data, error } = await supabase
        .from('business_invites')
        .select('*')
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPendingInvites((data || []) as PendingInvite[]);
    } catch (error) {
      console.error('Erro ao carregar convites:', error);
      toast.error('Erro ao carregar convites pendentes');
    }
  };

  const handleCancelInvite = async (id: string) => {
    try {
      const { error } = await supabase
        .from('business_invites')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Convite cancelado com sucesso');
      loadPendingInvites();
    } catch (error) {
      console.error('Erro ao cancelar convite:', error);
      toast.error('Erro ao cancelar convite');
    } finally {
      setCancelInviteDialogOpen(false);
      setSelectedInvite(null);
    }
  };

  useEffect(() => {
    loadSubAccounts();
    loadPendingInvites();
  }, []);

  const handleDeactivate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('business_sub_accounts')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      toast.success('Funcionário desativado com sucesso');
      loadSubAccounts();
    } catch (error) {
      console.error('Erro ao desativar funcionário:', error);
      toast.error('Erro ao desativar funcionário');
    } finally {
      setDeleteDialogOpen(false);
      setSelectedAccount(null);
    }
  };

  const handleReactivate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('business_sub_accounts')
        .update({ is_active: true })
        .eq('id', id);

      if (error) throw error;

      toast.success('Funcionário reativado com sucesso');
      loadSubAccounts();
    } catch (error) {
      console.error('Erro ao reativar funcionário:', error);
      toast.error('Erro ao reativar funcionário');
    }
  };

  const getPermissionBadges = (account: SubAccount) => {
    const permissions = [];
    if (account.can_create_transactions) permissions.push('Criar');
    if (account.can_edit_transactions) permissions.push('Editar');
    if (account.can_delete_transactions) permissions.push('Excluir');
    if (account.can_manage_investments) permissions.push('Investimentos');
    if (account.can_manage_suppliers) permissions.push('Fornecedores');
    return permissions;
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gerenciar Funcionários</h1>
            <p className="text-muted-foreground mt-1">
              Adicione funcionários e controle suas permissões de acesso
            </p>
          </div>
          <Button onClick={() => setInviteModalOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Convidar Funcionário
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Funcionários Cadastrados</CardTitle>
            <CardDescription>
              {subAccounts.length} {subAccounts.length === 1 ? 'funcionário' : 'funcionários'} cadastrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando...</div>
            ) : subAccounts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum funcionário cadastrado ainda.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Permissões</TableHead>
                    <TableHead>Data de Cadastro</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subAccounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">
                        {account.sub_user_id.substring(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <Badge variant={account.is_active ? 'default' : 'secondary'}>
                          {account.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {getPermissionBadges(account).map((perm) => (
                            <Badge key={perm} variant="outline" className="text-xs">
                              {perm}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(account.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right">
                        {account.is_active ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedAccount(account.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReactivate(account.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {pendingInvites.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Convites Pendentes</CardTitle>
              <CardDescription>
                {pendingInvites.length} {pendingInvites.length === 1 ? 'convite' : 'convites'} aguardando aceitação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Cargo/Departamento</TableHead>
                    <TableHead>Enviado em</TableHead>
                    <TableHead>Expira em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingInvites.map((invite) => (
                    <TableRow key={invite.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {invite.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        {invite.additional_info?.position || invite.additional_info?.department ? (
                          <div className="text-sm">
                            {invite.additional_info?.position && <div>{invite.additional_info.position}</div>}
                            {invite.additional_info?.department && (
                              <div className="text-muted-foreground">{invite.additional_info.department}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(invite.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {new Date(invite.expires_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedInvite(invite.id);
                            setCancelInviteDialogOpen(true);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      <InviteSubAccountModal
        open={inviteModalOpen}
        onOpenChange={setInviteModalOpen}
        onSuccess={() => {
          loadSubAccounts();
          loadPendingInvites();
        }}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar funcionário?</AlertDialogTitle>
            <AlertDialogDescription>
              Este funcionário perderá o acesso ao sistema empresarial. Você poderá reativá-lo depois.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedAccount && handleDeactivate(selectedAccount)}
            >
              Desativar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={cancelInviteDialogOpen} onOpenChange={setCancelInviteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar convite?</AlertDialogTitle>
            <AlertDialogDescription>
              O link de convite será invalidado e o funcionário não poderá mais aceitar este convite.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedInvite && handleCancelInvite(selectedInvite)}
            >
              Cancelar Convite
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default SubAccounts;
