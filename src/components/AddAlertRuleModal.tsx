
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertRuleType, NotificationChannel } from '@/types/alerts';
import { EXPENSE_CATEGORIES } from '@/types/finance';
import { useToast } from '@/hooks/use-toast';

interface AddAlertRuleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const AddAlertRuleModal: React.FC<AddAlertRuleModalProps> = ({
  open,
  onOpenChange,
  onSuccess
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    rule_type: '' as AlertRuleType,
    category_id: '',
    threshold_value: '',
    threshold_percent: '',
    days_before_due: '',
    notification_channel: ['email'] as NotificationChannel[]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações
    if (!formData.name || !formData.rule_type) {
      toast({
        title: "Erro",
        description: "Nome e tipo de regra são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    if ((formData.rule_type === 'overspend' || formData.rule_type === 'low_balance') && 
        !formData.threshold_value && !formData.threshold_percent) {
      toast({
        title: "Erro", 
        description: "É necessário definir um valor ou percentual limite",
        variant: "destructive"
      });
      return;
    }

    // Simular criação da regra (em uma aplicação real, seria uma chamada à API)
    console.log('Nova regra de alerta:', formData);
    
    toast({
      title: "Sucesso",
      description: "Regra de alerta criada com sucesso!"
    });

    // Reset form
    setFormData({
      name: '',
      rule_type: '' as AlertRuleType,
      category_id: '',
      threshold_value: '',
      threshold_percent: '',
      days_before_due: '',
      notification_channel: ['email']
    });

    onSuccess();
  };

  const ruleTypes = [
    { value: 'overspend', label: 'Gasto excessivo' },
    { value: 'low_balance', label: 'Saldo baixo' },
    { value: 'unusual_tx', label: 'Transação incomum' },
    { value: 'bill_due', label: 'Conta vencendo' }
  ];

  const notificationChannels = [
    { value: 'email', label: 'Email' },
    { value: 'push', label: 'Push' },
    { value: 'sms', label: 'SMS' }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Regra de Alerta</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome da Regra</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Gasto fora do padrão"
            />
          </div>

          <div>
            <Label htmlFor="rule_type">Tipo de Alerta</Label>
            <Select 
              value={formData.rule_type} 
              onValueChange={(value: AlertRuleType) => 
                setFormData(prev => ({ ...prev, rule_type: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {ruleTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.rule_type === 'overspend' && (
            <div>
              <Label htmlFor="category">Categoria</Label>
              <Select 
                value={formData.category_id} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {(formData.rule_type === 'overspend' || formData.rule_type === 'low_balance') && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="threshold_value">Valor Limite (R$)</Label>
                <Input
                  id="threshold_value"
                  type="number"
                  value={formData.threshold_value}
                  onChange={(e) => setFormData(prev => ({ ...prev, threshold_value: e.target.value }))}
                  placeholder="500"
                />
              </div>
              <div>
                <Label htmlFor="threshold_percent">Percentual (%)</Label>
                <Input
                  id="threshold_percent"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.threshold_percent}
                  onChange={(e) => setFormData(prev => ({ ...prev, threshold_percent: e.target.value }))}
                  placeholder="90"
                />
              </div>
            </div>
          )}

          {formData.rule_type === 'bill_due' && (
            <div>
              <Label htmlFor="days_before_due">Dias antes do vencimento</Label>
              <Input
                id="days_before_due"
                type="number"
                value={formData.days_before_due}
                onChange={(e) => setFormData(prev => ({ ...prev, days_before_due: e.target.value }))}
                placeholder="3"
              />
            </div>
          )}

          <div>
            <Label>Canais de Notificação</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {notificationChannels.map(channel => (
                <div key={channel.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={channel.value}
                    checked={formData.notification_channel.includes(channel.value as NotificationChannel)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFormData(prev => ({
                          ...prev,
                          notification_channel: [...prev.notification_channel, channel.value as NotificationChannel]
                        }));
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          notification_channel: prev.notification_channel.filter(c => c !== channel.value)
                        }));
                      }
                    }}
                  />
                  <Label htmlFor={channel.value} className="text-sm">
                    {channel.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              Criar Regra
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddAlertRuleModal;
