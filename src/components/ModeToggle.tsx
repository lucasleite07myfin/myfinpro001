
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Building2, User } from 'lucide-react';
import { useAppMode } from '@/contexts/AppModeContext';
import { useNavigate } from 'react-router-dom';
import TooltipHelper from './TooltipHelper';
import { tooltipContent } from '@/data/tooltipContent';
import { useSubAccount } from '@/contexts/SubAccountContext';
import ModePinDialog from './ModePinDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const ModeToggle: React.FC = () => {
  const { mode, toggleMode } = useAppMode();
  const { isSubAccount } = useSubAccount();
  const navigate = useNavigate();
  
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pinMode, setPinMode] = useState<'create' | 'validate'>('validate');
  const [targetMode, setTargetMode] = useState<'personal' | 'business'>('personal');

  const handleToggle = async () => {
    try {
      // Verificar se o usuário tem PIN configurado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('mode_switch_pin_hash')
        .eq('id', user.id)
        .single();

      const newMode = mode === 'personal' ? 'business' : 'personal';
      setTargetMode(newMode);

      if (!profile?.mode_switch_pin_hash) {
        // Primeira vez - criar PIN
        setPinMode('create');
        setShowPinDialog(true);
      } else {
        // Validar PIN existente
        setPinMode('validate');
        setShowPinDialog(true);
      }
    } catch (error) {
      console.error('Erro ao verificar PIN:', error);
      toast.error('Erro ao alternar modo');
    }
  };

  const handlePinSuccess = () => {
    // Alternar modo após validação bem-sucedida
    toggleMode();
    navigate('/');
  };

  // Não mostrar botão para sub-accounts
  if (isSubAccount) {
    return null;
  }

  return (
    <>
      <TooltipHelper content={tooltipContent.header.appMode}>
        <Button
          onClick={handleToggle}
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-full bg-background shadow-md hover:bg-muted border border-border"
          aria-label={mode === 'personal' ? 'Alternar para modo empresa' : 'Alternar para modo pessoal'}
        >
          {mode === 'personal' ? (
            <User className="h-4 w-4 text-foreground" />
          ) : (
            <Building2 className="h-4 w-4 text-foreground" />
          )}
        </Button>
      </TooltipHelper>

      <ModePinDialog
        open={showPinDialog}
        onOpenChange={setShowPinDialog}
        mode={pinMode}
        onSuccess={handlePinSuccess}
        targetMode={targetMode}
      />
    </>
  );
};

export default ModeToggle;
