
import React, { ReactNode } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TooltipHelperProps {
  children: ReactNode;
  content: string;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  delayDuration?: number;
}

const TooltipHelper = React.forwardRef<HTMLDivElement, TooltipHelperProps>(({ 
  children, 
  content, 
  side = "top", 
  align = "center",
  delayDuration = 300
}, ref) => {
  return (
    <Tooltip delayDuration={delayDuration}>
      <TooltipTrigger asChild>
        <div ref={ref}>
          {children}
        </div>
      </TooltipTrigger>
      <TooltipContent 
        side={side} 
        align={align}
        className="bg-popover text-popover-foreground px-3 py-1.5 text-sm shadow-md animate-in fade-in-0 zoom-in-95 max-w-[300px] break-words"
      >
        {content}
      </TooltipContent>
    </Tooltip>
  );
});

TooltipHelper.displayName = 'TooltipHelper';

export default TooltipHelper;
