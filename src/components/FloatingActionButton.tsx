
import React, { ReactNode, forwardRef } from 'react';
import { Button } from '@/components/ui/button';

interface FloatingActionButtonProps {
  children: ReactNode;
  onClick: () => void;
}

const FloatingActionButton = forwardRef<HTMLButtonElement, FloatingActionButtonProps>(
  ({ children, onClick }, ref) => {
    return (
      <Button
        ref={ref}
        className="fixed bottom-4 md:bottom-6 right-4 md:right-6 rounded-full w-14 h-14 md:w-16 md:h-16 shadow-lg z-20
                  bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700
                  animate-pulse text-white"
        onClick={onClick}
      >
        {children}
      </Button>
    );
  }
);

FloatingActionButton.displayName = 'FloatingActionButton';

export default FloatingActionButton;
