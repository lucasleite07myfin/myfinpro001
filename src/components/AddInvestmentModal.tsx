
import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Plus, TrendingUp } from 'lucide-react';
import { useBusiness } from '@/contexts/BusinessContext';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  SelectGroup,
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
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { TooltipProvider } from '@/components/ui/tooltip';
import TooltipHelper from './TooltipHelper';
import { tooltipContent } from '@/data/tooltipContent';
import { cn } from '@/lib/utils';
import { sanitizeText } from '@/utils/xssSanitizer';

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
  'Automóvel',
  'Maquinário', 
  'Empréstimo',
  'Financiamento',
  'Imóvel',
  'Tecnologia',
  'Equipamentos',
  'Software',
  'Infraestrutura',
  'Outros'
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
      const finalType = data.type === 'custom' && data.customType 
        ? sanitizeText(data.customType) 
        : data.type;
      
      const investmentData: Investment = {
        id: editingInvestment?.id || uuidv4(),
        name: sanitizeText(data.name),
        type: finalType,
        value: data.value,
        installments: data.installments,
        installmentValue: data.installmentValue,
        startDate: data.startDate,
        paidInstallments: editingInvestment?.paidInstallments || 0,
        description: data.description ? sanitizeText(data.description) : undefined,
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
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Erro ao salvar o investimento: ${errorMsg}`);
    }
  };

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[520px] max-h-[85vh] overflow-y-auto bg-card border-border shadow-lg">
          <DialogHeader className="border-b border-border pb-4 mb-6">
            <DialogTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              {editingInvestment ? 'Editar Investimento' : 'Adicionar Novo Investimento'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editingInvestment ? 'Edite os detalhes do investimento abaixo.' : 'Preencha os detalhes do investimento abaixo.'}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 bg-card">
              <div className="space-y-4">
                <TooltipHelper content="Nome identificador do investimento" delayDuration={500}>
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-foreground">
                      Nome do Investimento
                    </Label>
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input 
                              id="name"
                              placeholder="Ex: Máquina de produção" 
                              className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring focus:ring-offset-2"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TooltipHelper>

                <TooltipHelper content="Categoria do investimento" delayDuration={500}>
                  <div className="space-y-2">
                    <Label htmlFor="type" className="text-sm font-medium text-foreground">
                      Tipo de Investimento
                    </Label>
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              setIsCustomType(value === 'Outros');
                            }}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-white border-gray-300 focus:border-[#EE680D] focus:ring-[#EE680D]">
                                <SelectValue placeholder="Selecione o tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-background border shadow-lg">
                              <SelectGroup>
                                {INVESTMENT_TYPES.map((type) => (
                                  <SelectItem key={type} value={type} className="hover:bg-muted/50">
                                    {type}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TooltipHelper>

                {isCustomType && (
                  <TooltipHelper content="Especifique o tipo personalizado do investimento" delayDuration={500}>
                    <div className="space-y-2">
                      <Label htmlFor="customType" className="text-sm font-medium text-foreground">
                        Especificar tipo personalizado
                      </Label>
                      <FormField
                        control={form.control}
                        name="customType"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input 
                                id="customType"
                                placeholder="Digite o tipo personalizado" 
                                className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TooltipHelper>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TooltipHelper content="Valor total do investimento" delayDuration={500}>
                    <div className="space-y-2">
                      <Label htmlFor="value" className="text-sm font-medium text-foreground">
                        Valor Total (R$)
                      </Label>
                      <FormField
                        control={form.control}
                        name="value"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">R$</span>
                                <Input 
                                  id="value"
                                  type="number" 
                                  step="0.01" 
                                  min="0" 
                                  placeholder="0,00"
                                  className="text-right bg-gray-50 border-gray-200 pl-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  {...field}
                                  onChange={(e) => {
                                    const value = parseFloat(e.target.value);
                                    field.onChange(value);
                                    handleValueChange(value, 'value');
                                  }}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TooltipHelper>

                  <TooltipHelper content="Quantidade de parcelas para pagamento" delayDuration={500}>
                    <div className="space-y-2">
                      <Label htmlFor="installments" className="text-sm font-medium text-foreground">
                        Número de Parcelas
                      </Label>
                      <FormField
                        control={form.control}
                        name="installments"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input 
                                id="installments"
                                type="number" 
                                min="1"
                                placeholder="1"
                                className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring focus:ring-offset-2"
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
                  </TooltipHelper>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TooltipHelper content="Valor de cada parcela" delayDuration={500}>
                    <div className="space-y-2">
                      <Label htmlFor="installmentValue" className="text-sm font-medium text-foreground">
                        Valor da Parcela (R$)
                      </Label>
                      <FormField
                        control={form.control}
                        name="installmentValue"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">R$</span>
                                <Input 
                                  id="installmentValue"
                                  type="number" 
                                  step="0.01" 
                                  min="0"
                                  placeholder="0,00"
                                  className="text-right bg-gray-50 border-gray-200 pl-10"
                                  {...field}
                                  onChange={(e) => {
                                    const value = parseFloat(e.target.value);
                                    field.onChange(value);
                                    handleValueChange(value, 'installmentValue');
                                  }}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TooltipHelper>

                  <TooltipHelper content="Data de início do investimento" delayDuration={500}>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        Data de Início
                      </Label>
                      <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full justify-start text-left font-normal bg-background border-input text-foreground focus:border-ring focus:ring-2 focus:ring-ring focus:ring-offset-2",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {field.value ? format(field.value, "PPP", { locale: ptBR }) : "Selecione uma data"}
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0 bg-background border shadow-lg" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  initialFocus
                                  className="rounded-lg border-0"
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TooltipHelper>
                </div>

                <TooltipHelper content="Informações adicionais sobre o investimento" delayDuration={500}>
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium text-foreground">
                      Descrição (opcional)
                    </Label>
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input 
                              id="description"
                              placeholder="Detalhes adicionais sobre o investimento" 
                              className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring focus:ring-offset-2"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TooltipHelper>
              </div>

              <DialogFooter className="border-t pt-4 mt-6">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="hover:bg-muted/50">
                  Cancelar
                </Button>
                <TooltipHelper content="Salvar investimento" delayDuration={500}>
                  <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium">
                    {editingInvestment ? 'Atualizar Investimento' : 'Salvar Investimento'}
                  </Button>
                </TooltipHelper>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};

export default AddInvestmentModal;
