import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CustomTabItem {
  value: string;
  label: string;
  content?: React.ReactNode;
}

interface CustomTabsProps {
  items: CustomTabItem[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export const CustomTabs: React.FC<CustomTabsProps> = ({
  items,
  defaultValue,
  value,
  onValueChange,
  className = '',
  orientation = 'horizontal'
}) => {
  return (
    <Tabs 
      defaultValue={defaultValue} 
      value={value} 
      onValueChange={onValueChange} 
      className={className}
      orientation={orientation}
    >
      <TabsList className="bg-white">
        {items.map((item) => (
          <TabsTrigger 
            key={item.value} 
            value={item.value} 
            className="data-[state=active]:bg-[#EE680D] data-[state=active]:text-white"
          >
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>
      
      {items.map((item) => (
        item.content && (
          <TabsContent key={item.value} value={item.value} className="mt-4">
            {item.content}
          </TabsContent>
        )
      ))}
    </Tabs>
  );
};

// Componente simplificado apenas para os triggers (quando não precisar de content)
interface CustomTabTriggersProps {
  items: Omit<CustomTabItem, 'content'>[];
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

export const CustomTabTriggers: React.FC<CustomTabTriggersProps> = ({
  items,
  value,
  onValueChange,
  className = ''
}) => {
  return (
    <TabsList className={`bg-white ${className}`}>
      {items.map((item) => (
        <TabsTrigger 
          key={item.value} 
          value={item.value} 
          className="data-[state=active]:bg-[#EE680D] data-[state=active]:text-white"
          onClick={() => onValueChange?.(item.value)}
        >
          {item.label}
        </TabsTrigger>
      ))}
    </TabsList>
  );
};

export default CustomTabs;
