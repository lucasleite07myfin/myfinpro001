
import React, { ReactNode, useEffect, useState } from 'react';
import Header from './Header';
import FloatingActionButton from './FloatingActionButton';
import { useAppMode } from '@/contexts/AppModeContext';
import { Plus } from 'lucide-react'; 
import AddTransactionModal from './AddTransactionModal';
import { TooltipProvider } from '@/components/ui/tooltip';
import TooltipHelper from './TooltipHelper';
import { tooltipContent } from '@/data/tooltipContent';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { mode } = useAppMode();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Apply data-mode attribute to html element
  useEffect(() => {
    const htmlElement = document.documentElement;
    htmlElement.setAttribute('data-mode', mode);
    
    return () => {
      htmlElement.removeAttribute('data-mode');
    };
  }, [mode]);
  
  return (
    <TooltipProvider>
      <div className={`min-h-screen flex flex-col bg-background`}>
        <Header />
        <main className="flex-grow container mx-auto px-4 py-2 md:py-3 overflow-x-hidden">
          {children}
        </main>
        <TooltipHelper content={tooltipContent.modals.addTransaction}>
          <FloatingActionButton onClick={() => setIsModalOpen(true)}>
            <Plus className="h-6 w-6 md:h-8 md:w-8" />
          </FloatingActionButton>
        </TooltipHelper>
        
        <AddTransactionModal open={isModalOpen} onOpenChange={setIsModalOpen} />
      </div>
    </TooltipProvider>
  );
};

export default MainLayout;
