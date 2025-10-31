
import React from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatMonth } from '@/utils/formatters';

interface MonthSelectorProps {
  value: string; // format: YYYY-MM
  onChange: (value: string) => void;
}

const MonthSelector: React.FC<MonthSelectorProps> = ({ value, onChange }) => {
  const currentDate = new Date();
  const months: string[] = [];
  
  // Criar opções para os últimos 12 meses
  for (let i = 11; i >= 0; i--) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const monthValue = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    months.push(monthValue);
  }

  const goToPreviousMonth = () => {
    const [year, month] = value.split('-').map(Number);
    const previousMonth = month === 1 ? 12 : month - 1;
    const previousYear = month === 1 ? year - 1 : year;
    onChange(`${previousYear}-${String(previousMonth).padStart(2, '0')}`);
  };

  const goToNextMonth = () => {
    const [year, month] = value.split('-').map(Number);
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    onChange(`${nextYear}-${String(nextMonth).padStart(2, '0')}`);
  };

  // Verificar se já estamos no mês atual (para desabilitar o botão "próximo")
  const isCurrentMonth = value === `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

  const formatMonthName = (monthYear: string): string => {
    const [year, month] = monthYear.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    const monthName = date.toLocaleDateString('pt-BR', { month: 'long' });
    // Capitalizar primeira letra
    return monthName.charAt(0).toUpperCase() + monthName.slice(1);
  };

  return (
    <div className="flex items-center space-x-2">
      <Button 
        variant="outline" 
        size="default"
        onClick={goToPreviousMonth}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Selecione o mês" />
        </SelectTrigger>
        <SelectContent>
          {months.map((month) => (
            <SelectItem key={month} value={month}>
              {formatMonth(month)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Button 
        variant="outline" 
        size="default"
        onClick={goToNextMonth}
        disabled={isCurrentMonth}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default MonthSelector;
