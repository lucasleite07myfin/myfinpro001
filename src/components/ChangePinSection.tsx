import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ChangePinSectionProps {
  userId: string;
}

const ChangePinSection: React.FC<ChangePinSectionProps> = ({ userId }) => {
  const [currentPin, setCurrentPin] = useState(['', '', '', '']);
  const [newPin, setNewPin] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  
  const currentPinRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];
  
  const newPinRefs = [
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
    
    const currentPinValue = currentPin.join('');
    const newPinValue = newPin.join('');
    
    if (currentPinValue.length !== 4 || newPinValue.length !== 4) {
      toast.error('Preencha todos os dígitos do PIN');
      return;
    }

    setLoading(true);

    try {
      // Verificar sessão ativa
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        toast.error('Sessão expirada. Faça login novamente.');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('validate-mode-pin', {
        body: {
          pin: currentPinValue,
          newPin: newPinValue,
          action: 'update',
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw new Error(error.message || 'Erro ao atualizar PIN');
      }

      toast.success('PIN atualizado com sucesso!');
      setCurrentPin(['', '', '', '']);
      setNewPin(['', '', '', '']);
      
    } catch (error) {
      console.error('Erro ao atualizar PIN:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar PIN');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPin = async () => {
    setResetLoading(true);
    
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        toast.error('Sessão expirada. Faça login novamente.');
        return;
      }

      const { data, error } = await supabase.functions.invoke('reset-mode-pin', {
        body: { action: 'request' },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw new Error(error.message || 'Erro ao enviar e-mail');
      }

      toast.success('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
      
    } catch (error) {
      console.error('Erro ao solicitar reset:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar e-mail de recuperação');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label>PIN Atual</Label>
        <div className="flex gap-2">
          {currentPin.map((digit, index) => (
            <Input
              key={`current-${index}`}
              ref={currentPinRefs[index]}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handlePinChange(index, e.target.value, currentPin, setCurrentPin, currentPinRefs)}
              className="h-12 w-12 text-center text-xl font-bold"
              disabled={loading}
            />
          ))}
        </div>
        <Button
          type="button"
          variant="link"
          size="sm"
          onClick={handleForgotPin}
          disabled={resetLoading || loading}
          className="h-auto p-0 text-xs"
        >
          {resetLoading ? (
            <>
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              Enviando...
            </>
          ) : (
            'Esqueci meu PIN'
          )}
        </Button>
      </div>

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
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Digite 4 dígitos numéricos para o novo PIN
        </p>
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Atualizando...
          </>
        ) : (
          'Atualizar PIN'
        )}
      </Button>
    </form>
  );
};

export default ChangePinSection;
