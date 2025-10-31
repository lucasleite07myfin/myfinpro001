
import React from 'react';
import { Button } from '@/components/ui/button';
import { Building2, User } from 'lucide-react';
import { useAppMode } from '@/contexts/AppModeContext';
import { useNavigate } from 'react-router-dom';
import TooltipHelper from './TooltipHelper';
import { tooltipContent } from '@/data/tooltipContent';
import { useSubAccount } from '@/contexts/SubAccountContext';

const ModeToggle: React.FC = () => {
  const { mode, toggleMode } = useAppMode();
  const { isSubAccount } = useSubAccount();
  const navigate = useNavigate();
  
  const handleToggle = () => {
    toggleMode();
    navigate('/');
  };

  // Não mostrar botão para sub-accounts
  if (isSubAccount) {
    return null;
  }

  return (
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
  );
};

export default ModeToggle;
