
import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import TooltipHelper from './TooltipHelper';
import { tooltipContent } from '@/data/tooltipContent';

const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <TooltipHelper content={tooltipContent.header.theme}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="icon" 
            aria-label="Alternar tema" 
            className="h-9 w-9 rounded-full bg-background shadow-md hover:bg-muted border border-border dark:bg-sidebar-accent dark:text-white"
          >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 dark:text-foreground" />
            <span className="sr-only">Alternar tema</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem 
            onClick={() => setTheme('light')}
            className={theme === 'light' ? 'bg-secondary' : ''}
          >
            <Sun className="mr-2 h-4 w-4" />
            <span>Claro</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setTheme('dark')}
            className={theme === 'dark' ? 'bg-secondary' : ''}
          >
            <Moon className="mr-2 h-4 w-4" />
            <span>Escuro</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipHelper>
  );
};

export default ThemeToggle;
