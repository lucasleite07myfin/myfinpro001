import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ModePinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'validate';
  onSuccess: () => void;
  targetMode: 'personal' | 'business';
}

const ModePinDialog: React.FC<ModePinDialogProps> = ({
  open,
  onOpenChange,
  mode,
  onSuccess,
  targetMode,
}) => {
  const [pin, setPin] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Limpar PIN quando o modal abre
  useEffect(() => {
    if (open) {
      setPin(['', '', '', '']);
      setTimeout(() => inputRefs[0].current?.focus(), 100);
    }
  }, [open]);

  const handlePinChange = (index: number, value: string) => {
    // Aceitar apenas dígitos
    if (value && !/^\d$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    // Auto-focus no próximo campo
    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Backspace: voltar para o campo anterior
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 4);
    
    if (!/^\d+$/.test(pastedData)) {
      toast.error('Cole apenas números');
      return;
    }

    const newPin = pastedData.split('').concat(['', '', '', '']).slice(0, 4);
    setPin(newPin);

    // Focar no último campo preenchido ou no primeiro vazio
    const lastFilledIndex = Math.min(pastedData.length - 1, 3);
    inputRefs[lastFilledIndex].current?.focus();
  };

  const handleSubmit = async () => {
    const pinValue = pin.join('');
    
    if (pinValue.length !== 4) {
      toast.error('Digite os 4 dígitos do PIN');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('validate-mode-pin', {
        body: {
          pin: pinValue,
          action: mode,
        },
      });

      if (error) {
        throw new Error(error.message || 'Erro ao processar PIN');
      }

      if (mode === 'validate' && !data.valid) {
        toast.error('PIN incorreto. Tente novamente.');
        setPin(['', '', '', '']);
        inputRefs[0].current?.focus();
        return;
      }

      // Sucesso!
      const modeLabel = targetMode === 'personal' ? 'Pessoal' : 'Empresas';
      toast.success(`Agora você está no seu perfil ${modeLabel}`, {
        duration: 3000,
      });
      
      onSuccess();
      onOpenChange(false);

    } catch (error) {
      console.error('Erro ao validar PIN:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao validar PIN');
    } finally {
      setLoading(false);
    }
  };

  const isComplete = pin.every(digit => digit !== '');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center">
            {mode === 'create' ? 'Criar PIN de Segurança' : 'Digite seu PIN'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {mode === 'create'
              ? 'Crie um PIN de 4 dígitos para proteger a alternância entre os modos pessoal e empresarial.'
              : 'Digite seu PIN de 4 dígitos para alternar para o modo ' + 
                (targetMode === 'personal' ? 'pessoal' : 'empresarial') + '.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center gap-3 my-6">
          {pin.map((digit, index) => (
            <Input
              key={index}
              ref={inputRefs[index]}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handlePinChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              className="h-14 w-14 text-center text-2xl font-bold"
              disabled={loading}
            />
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <Button
            onClick={handleSubmit}
            disabled={!isComplete || loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Validando...
              </>
            ) : (
              mode === 'create' ? 'Criar PIN' : 'Confirmar'
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="w-full"
          >
            Cancelar
          </Button>
        </div>

        {mode === 'create' && (
          <p className="text-xs text-center text-muted-foreground mt-4">
            Você poderá alterar este PIN nas configurações do seu perfil.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ModePinDialog;
