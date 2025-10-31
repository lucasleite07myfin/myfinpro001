import React, { ReactNode, forwardRef } from 'react';

interface FloatingActionButtonProps {
  children: ReactNode;
  onClick: () => void;
}

const FloatingActionButton = forwardRef<HTMLButtonElement, FloatingActionButtonProps>(
  ({ children, onClick }, ref) => {
    return (
      <>
        <style>{`
          @keyframes fab-pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.8;
            }
          }
          
          .floating-action-button {
            position: fixed;
            bottom: 1.5rem;
            right: 1rem;
            width: 3.5rem;
            height: 3.5rem;
            border-radius: 50%;
            background: linear-gradient(135deg, #fb923c 0%, #ea580c 100%);
            color: white;
            border: none;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 20;
            transition: all 0.3s ease;
            animation: fab-pulse 2s infinite;
          }
          
          .floating-action-button:hover {
            background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%);
            transform: scale(1.1);
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
          }
          
          .floating-action-button:active {
            transform: scale(0.95);
          }
          
          .floating-action-button:focus {
            outline: 2px solid #fb923c;
            outline-offset: 2px;
          }
          
          @media (min-width: 768px) {
            .floating-action-button {
              bottom: 2rem;
              right: 2rem;
              width: 4rem;
              height: 4rem;
            }
          }
          
          /* Safe area for mobile devices */
          @supports (padding-bottom: env(safe-area-inset-bottom)) {
            .floating-action-button {
              bottom: calc(1.5rem + env(safe-area-inset-bottom));
              right: calc(1rem + env(safe-area-inset-right));
            }
            
            @media (min-width: 768px) {
              .floating-action-button {
                bottom: calc(2rem + env(safe-area-inset-bottom));
                right: calc(2rem + env(safe-area-inset-right));
              }
            }
          }
        `}</style>
        <button
          ref={ref}
          onClick={onClick}
          className="floating-action-button"
          aria-label="Adicionar transação"
        >
          {children}
        </button>
      </>
    );
  }
);

FloatingActionButton.displayName = 'FloatingActionButton';

export default FloatingActionButton;
