
import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon, Plus } from 'lucide-react';
import { useBusiness } from '@/contexts/BusinessContext';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

// Definir o schema de validação para o formulário
const investmentFormSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório'),
  type: z.string().min(1, 'O tipo é obrigatório'),
  value: z.coerce.number().min(1, 'O valor deve ser maior que zero'),
  installments: z.coerce.number().int().min(1, 'Mínimo de 1 parcela'),
  installmentValue: z.coerce.number().min(1, 'O valor da parcela deve ser maior que zero'),
  startDate: z.date(),
  customType: z.string().optional(),
  description: z.string().optional(),
});

type InvestmentFormValues = z.infer<typeof investmentFormSchema>;

interface AddInvestmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingInvestment?: Investment | null;
}

export interface Investment {
  id: string;
  name: string;
  type: string;
  value: number;
  installments: number;
  installmentValue: number;
  startDate: Date;
  paidInstallments: number;
  description?: string;
}

const INVESTMENT_TYPES = [
  { label: 'Automóvel', value: 'vehicle' },
  { label: 'Maquinário', value: 'machinery' },
  { label: 'Empréstimo', value: 'loan' },
  { label: 'Financiamento', value: 'financing' },
  { label: 'Imóvel', value: 'real_estate' },
  { label: 'Tecnologia', value: 'technology' },
  { label: 'Personalizado', value: 'custom' },
];

const AddInvestmentModal: React.FC<AddInvestmentModalProps> = ({
  open,
  onOpenChange,
  editingInvestment
}) => {
  const { addInvestment, updateInvestment } = useBusiness();
  const [isCustomType, setIsCustomType] = useState(false);

  // Inicializar o formulário
  const form = useForm<InvestmentFormValues>({
    resolver: zodResolver(investmentFormSchema),
    defaultValues: editingInvestment ? {
      name: editingInvestment.name,
      type: editingInvestment.type,
      value: editingInvestment.value,
      installments: editingInvestment.installments,
      installmentValue: editingInvestment.installmentValue,
      startDate: editingInvestment.startDate,
      description: editingInvestment.description,
    } : {
      name: '',
      type: '',
      value: 0,
      installments: 1,
      installmentValue: 0,
      startDate: new Date(),
    }
  });

  // Reset formulário ao abrir modal
  React.useEffect(() => {
    if (open) {
      if (!editingInvestment) {
        form.reset({
          name: '',
          type: '',
          value: 0,
          installments: 1,
          installmentValue: 0,
          startDate: new Date(),
        });
        setIsCustomType(false);
      } else {
        form.reset({
          name: editingInvestment.name,
          type: editingInvestment.type,
          value: editingInvestment.value,
          installments: editingInvestment.installments,
          installmentValue: editingInvestment.installmentValue,
          startDate: editingInvestment.startDate,
          description: editingInvestment.description || '',
        });
        setIsCustomType(editingInvestment.type === 'custom');
      }
    }
  }, [open, form, editingInvestment]);

  // Função para ajustar valores relacionados quando um campo é alterado
  const handleValueChange = (value: number, field: 'value' | 'installments' | 'installmentValue') => {
    const currentInstallments = field === 'installments' ? value : form.getValues('installments');
    const currentValue = field === 'value' ? value : form.getValues('value');
    const currentInstallmentValue = field === 'installmentValue' ? value : form.getValues('installmentValue');

    if (field === 'value' || field === 'installments') {
      // Se alterar valor total ou número de parcelas, recalcula valor da parcela
      if (currentInstallments > 0) {
        form.setValue('installmentValue', parseFloat((currentValue / currentInstallments).toFixed(2)));
      }
    } else if (field === 'installmentValue') {
      // Se alterar valor da parcela, recalcula valor total
      form.setValue('value', parseFloat((currentInstallmentValue * currentInstallments).toFixed(2)));
    }
  };

  // Enviar o formulário
  const onSubmit = (data: InvestmentFormValues) => {
    try {
      const finalType = data.type === 'custom' && data.customType ? data.customType : data.type;
      
      const investmentData: Investment = {
        id: editingInvestment?.id || uuidv4(),
        name: data.name,
        type: finalType,
        value: data.value,
        installments: data.installments,
        installmentValue: data.installmentValue,
        startDate: data.startDate,
        paidInstallments: editingInvestment?.paidInstallments || 0,
        description: data.description,
      };

      if (editingInvestment) {
        updateInvestment(investmentData);
        toast.success('Investimento atualizado com sucesso!');
      } else {
        addInvestment(investmentData);
        toast.success('Investimento adicionado com sucesso!');
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar investimento:', error);
      toast.error('Erro ao salvar o investimento. Tente novamente.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>
            {editingInvestment ? 'Editar Investimento' : 'Adicionar Novo Investimento'}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Investimento</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Máquina de produção" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Investimento</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      setIsCustomType(value === 'custom');
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {INVESTMENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isCustomType && (
              <FormField
                control={form.control}
                name="customType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo Personalizado</FormLabel>
                    <FormControl>
                      <Input placeholder="Informe o tipo personalizado" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Total (R$)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        min="0" 
                        {...field}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          field.onChange(value);
                          handleValueChange(value, 'value');
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="installments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Parcelas</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1"
                        {...field}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          field.onChange(value);
                          handleValueChange(value, 'installments');
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="installmentValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor da Parcela (R$)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        min="0"
                        {...field}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          field.onChange(value);
                          handleValueChange(value, 'installmentValue');
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Início</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy")
                            ) : (
                              <span>Selecione uma data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Detalhes adicionais sobre o investimento" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingInvestment ? 'Atualizar' : 'Adicionar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddInvestmentModal;
