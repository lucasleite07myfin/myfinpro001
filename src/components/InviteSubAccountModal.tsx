import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface InviteSubAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const InviteSubAccountModal: React.FC<InviteSubAccountModalProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [department, setDepartment] = useState('');
  const [position, setPosition] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [phone, setPhone] = useState('');
  const [admissionDate, setAdmissionDate] = useState('');
  const [notes, setNotes] = useState('');
  const [permissions, setPermissions] = useState({
    can_view_transactions: true,
    can_create_transactions: true,
    can_edit_transactions: false,
    can_delete_transactions: false,
    can_view_investments: true,
    can_manage_investments: false,
    can_view_suppliers: true,
    can_manage_suppliers: false,
    can_view_dre: true,
    can_view_cashflow: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.includes('@')) {
      toast.error('Email inválido');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('invite-sub-account', {
        body: { 
          email, 
          permissions,
          additional_info: {
            department: department || undefined,
            position: position || undefined,
            employee_code: employeeCode || undefined,
            phone: phone || undefined,
            admission_date: admissionDate || undefined,
            notes: notes || undefined,
          },
        },
      });

      if (error) throw error;

      if (data?.email_sent) {
        toast.success(`Convite enviado para ${email}!`, {
          description: 'O funcionário receberá um email com instruções para aceitar o convite.',
        });
      } else {
        toast.warning('Convite criado, mas email não foi enviado', {
          description: 'Verifique a configuração do Resend. Link copiado para a área de transferência.',
        });
        // Copiar link para clipboard apenas se o email não foi enviado
        if (data?.invite_url) {
          await navigator.clipboard.writeText(data.invite_url);
        }
      }

      setEmail('');
      setDepartment('');
      setPosition('');
      setEmployeeCode('');
      setPhone('');
      setAdmissionDate('');
      setNotes('');
      setPermissions({
        can_view_transactions: true,
        can_create_transactions: true,
        can_edit_transactions: false,
        can_delete_transactions: false,
        can_view_investments: true,
        can_manage_investments: false,
        can_view_suppliers: true,
        can_manage_suppliers: false,
        can_view_dre: true,
        can_view_cashflow: true,
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao enviar convite:', error);
      toast.error('Erro ao enviar convite', {
        description: 'Tente novamente mais tarde.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Convidar Funcionário</DialogTitle>
            <DialogDescription>
              Envie um convite para adicionar um funcionário com acesso ao modo empresarial.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="email">Email do Funcionário *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="funcionario@empresa.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="position">Cargo</Label>
                <Input
                  id="position"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="Ex: Analista Financeiro"
                />
              </div>

              <div>
                <Label htmlFor="department">Setor</Label>
                <Input
                  id="department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Ex: Financeiro"
                />
              </div>

              <div>
                <Label htmlFor="employeeCode">Código</Label>
                <Input
                  id="employeeCode"
                  value={employeeCode}
                  onChange={(e) => setEmployeeCode(e.target.value)}
                  placeholder="Ex: FIN-001"
                />
              </div>

              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="admissionDate">Data de Admissão</Label>
                <Input
                  id="admissionDate"
                  type="date"
                  value={admissionDate}
                  onChange={(e) => setAdmissionDate(e.target.value)}
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="notes">Observações</Label>
                <Input
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Informações adicionais"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label>Permissões</Label>
              
              <div className="space-y-3 border rounded-lg p-4">
                <h4 className="font-medium text-sm">Transações</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="can_view_transactions"
                      checked={permissions.can_view_transactions}
                      onCheckedChange={(checked) =>
                        setPermissions({ ...permissions, can_view_transactions: checked as boolean })
                      }
                    />
                    <label htmlFor="can_view_transactions" className="text-sm cursor-pointer">
                      Visualizar transações
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="can_create_transactions"
                      checked={permissions.can_create_transactions}
                      onCheckedChange={(checked) =>
                        setPermissions({ ...permissions, can_create_transactions: checked as boolean })
                      }
                    />
                    <label htmlFor="can_create_transactions" className="text-sm cursor-pointer">
                      Criar transações
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="can_edit_transactions"
                      checked={permissions.can_edit_transactions}
                      onCheckedChange={(checked) =>
                        setPermissions({ ...permissions, can_edit_transactions: checked as boolean })
                      }
                    />
                    <label htmlFor="can_edit_transactions" className="text-sm cursor-pointer">
                      Editar transações
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="can_delete_transactions"
                      checked={permissions.can_delete_transactions}
                      onCheckedChange={(checked) =>
                        setPermissions({ ...permissions, can_delete_transactions: checked as boolean })
                      }
                    />
                    <label htmlFor="can_delete_transactions" className="text-sm cursor-pointer">
                      Excluir transações
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-3 border rounded-lg p-4">
                <h4 className="font-medium text-sm">Investimentos</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="can_view_investments"
                      checked={permissions.can_view_investments}
                      onCheckedChange={(checked) =>
                        setPermissions({ ...permissions, can_view_investments: checked as boolean })
                      }
                    />
                    <label htmlFor="can_view_investments" className="text-sm cursor-pointer">
                      Visualizar investimentos
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="can_manage_investments"
                      checked={permissions.can_manage_investments}
                      onCheckedChange={(checked) =>
                        setPermissions({ ...permissions, can_manage_investments: checked as boolean })
                      }
                    />
                    <label htmlFor="can_manage_investments" className="text-sm cursor-pointer">
                      Gerenciar investimentos
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-3 border rounded-lg p-4">
                <h4 className="font-medium text-sm">Fornecedores</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="can_view_suppliers"
                      checked={permissions.can_view_suppliers}
                      onCheckedChange={(checked) =>
                        setPermissions({ ...permissions, can_view_suppliers: checked as boolean })
                      }
                    />
                    <label htmlFor="can_view_suppliers" className="text-sm cursor-pointer">
                      Visualizar fornecedores
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="can_manage_suppliers"
                      checked={permissions.can_manage_suppliers}
                      onCheckedChange={(checked) =>
                        setPermissions({ ...permissions, can_manage_suppliers: checked as boolean })
                      }
                    />
                    <label htmlFor="can_manage_suppliers" className="text-sm cursor-pointer">
                      Gerenciar fornecedores
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-3 border rounded-lg p-4">
                <h4 className="font-medium text-sm">Relatórios</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="can_view_dre"
                      checked={permissions.can_view_dre}
                      onCheckedChange={(checked) =>
                        setPermissions({ ...permissions, can_view_dre: checked as boolean })
                      }
                    />
                    <label htmlFor="can_view_dre" className="text-sm cursor-pointer">
                      Visualizar DRE
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="can_view_cashflow"
                      checked={permissions.can_view_cashflow}
                      onCheckedChange={(checked) =>
                        setPermissions({ ...permissions, can_view_cashflow: checked as boolean })
                      }
                    />
                    <label htmlFor="can_view_cashflow" className="text-sm cursor-pointer">
                      Visualizar Fluxo de Caixa
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar Convite
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InviteSubAccountModal;
