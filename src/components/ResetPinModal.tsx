import React, { useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const ResetPinModal = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const resetToken = searchParams.get('reset_token');
  
  const [newPin, setNewPin] = useState(['', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  
  const newPinRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];
  
  const confirmPinRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const handlePinChange = (
    index: number,
    value: string,
    pins: string[],
    setPins: React.Dispatch<React.SetStateAction<string[]>>,
    refs: React.RefObject<HTMLInputElement>[]
  ) => {
    if (value && !/^\d$/.test(value)) return;

    const newPins = [...pins];
    newPins[index] = value;
    setPins(newPins);

    if (value && index < 3) {
      refs[index + 1].current?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newPinValue = newPin.join('');
    const confirmPinValue = confirmPin.join('');
    
    if (newPinValue.length !== 4 || confirmPinValue.length !== 4) {
      toast.error('Preencha todos os dígitos do PIN');
      return;
    }

    if (newPinValue !== confirmPinValue) {
      toast.error('Os PINs não coincidem');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('reset-mode-pin', {
        body: {
          action: 'reset',
          token: resetToken,
          newPin: newPinValue,
        },
      });

      if (error) {
        throw new Error(error.message || 'Erro ao redefinir PIN');
      }

      toast.success('PIN redefinido com sucesso!');
      
      // Remover token da URL
      searchParams.delete('reset_token');
      setSearchParams(searchParams);
      
      // Limpar campos
      setNewPin(['', '', '', '']);
      setConfirmPin(['', '', '', '']);
      
    } catch (error) {
      console.error('Erro ao redefinir PIN:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao redefinir PIN. Token pode ter expirado.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      searchParams.delete('reset_token');
      setSearchParams(searchParams);
      setNewPin(['', '', '', '']);
      setConfirmPin(['', '', '', '']);
    }
  };

  return (
    <Dialog open={!!resetToken} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Redefinir PIN</DialogTitle>
          <DialogDescription>
            Digite seu novo PIN de 4 dígitos para alternância de modos
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>Novo PIN</Label>
            <div className="flex gap-2">
              {newPin.map((digit, index) => (
                <Input
                  key={`new-${index}`}
                  ref={newPinRefs[index]}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinChange(index, e.target.value, newPin, setNewPin, newPinRefs)}
                  className="h-12 w-12 text-center text-xl font-bold"
                  disabled={loading}
                  autoFocus={index === 0}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Confirmar Novo PIN</Label>
            <div className="flex gap-2">
              {confirmPin.map((digit, index) => (
                <Input
                  key={`confirm-${index}`}
                  ref={confirmPinRefs[index]}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinChange(index, e.target.value, confirmPin, setConfirmPin, confirmPinRefs)}
                  className="h-12 w-12 text-center text-xl font-bold"
                  disabled={loading}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Digite o mesmo PIN para confirmar
            </p>
          </div>

          <div className="flex gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose} 
              disabled={loading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redefinindo...
                </>
              ) : (
                'Redefinir PIN'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ResetPinModal;
