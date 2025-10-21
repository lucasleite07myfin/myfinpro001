/**
 * Utilitários para Formatação de Mensagens
 * 
 * Funções auxiliares para formatar mensagens de notificação
 * substituindo placeholders pelos valores reais.
 */

import { formatCurrency } from './formatters';

/**
 * Substitui placeholders em uma string pelos valores fornecidos
 * 
 * @param template - Template da mensagem com placeholders {key}
 * @param data - Objeto com os valores para substituir
 * @returns Mensagem formatada
 */
export function formatMessage(template: string, data: Record<string, any>): string {
  let message = template;
  
  Object.keys(data).forEach(key => {
    const placeholder = `{${key}}`;
    const value = data[key];
    
    // Se o valor for um número e o placeholder sugerir dinheiro, formatar como moeda
    if (typeof value === 'number' && (
      key.includes('amount') || 
      key.includes('spent') || 
      key.includes('limit') || 
      key.includes('balance') ||
      key.includes('income') ||
      key.includes('expense')
    )) {
      message = message.replace(placeholder, formatCurrency(value));
    } else {
      message = message.replace(placeholder, String(value));
    }
  });
  
  return message;
}

/**
 * Formata uma lista de despesas para inclusão em mensagem
 * 
 * @param expenses - Array de despesas
 * @param format - Formato: 'simple' ou 'detailed'
 * @returns String formatada com a lista de despesas
 */
export function formatExpensesList(
  expenses: Array<{
    description: string;
    amount: number;
    due_date?: string;
    days_until_due?: number;
    category?: string;
    payment_method?: string;
  }>,
  format: 'simple' | 'detailed' = 'simple'
): string {
  if (format === 'simple') {
    return expenses
      .map(exp => `• ${exp.description}: ${formatCurrency(exp.amount)} ${exp.days_until_due !== undefined ? `(${exp.days_until_due} dias)` : ''}`)
      .join('\n');
  }
  
  // Formato detalhado (para email)
  return expenses
    .map(exp => {
      const lines = [
        `━━━━━━━━━━━━━━━━━━━━━`,
        `${exp.description}`,
        `Valor: ${formatCurrency(exp.amount)}`
      ];
      
      if (exp.due_date) {
        lines.push(`Vencimento: ${formatDate(exp.due_date)}`);
      }
      
      if (exp.days_until_due !== undefined) {
        const urgency = exp.days_until_due === 0 
          ? 'HOJE' 
          : exp.days_until_due === 1 
            ? 'AMANHÃ'
            : `${exp.days_until_due} dias`;
        lines.push(`⏰ ${urgency}`);
      }
      
      if (exp.category) {
        lines.push(`Categoria: ${exp.category}`);
      }
      
      if (exp.payment_method) {
        lines.push(`Forma de pagamento: ${exp.payment_method}`);
      }
      
      return lines.join('\n');
    })
    .join('\n\n');
}

/**
 * Formata uma data para exibição
 * 
 * @param date - Data em formato ISO ou string
 * @returns Data formatada como DD/MM/YYYY
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Formata um mês/ano para exibição
 * 
 * @param monthYear - String no formato YYYY-MM
 * @returns String formatada como "Mês/Ano"
 */
export function formatMonthYear(monthYear: string): string {
  const [year, month] = monthYear.split('-');
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return `${monthNames[parseInt(month) - 1]}/${year}`;
}

/**
 * Formata um percentual
 * 
 * @param value - Valor numérico do percentual
 * @param decimals - Número de casas decimais (padrão: 1)
 * @returns String formatada como "XX.X%"
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Seleciona mensagem de urgência baseada em dias até o vencimento
 * 
 * @param daysUntil - Número de dias até o vencimento
 * @returns Emoji e texto de urgência
 */
export function getUrgencyLevel(daysUntil: number): { emoji: string; text: string } {
  if (daysUntil < 0) {
    return { emoji: '🚨', text: 'VENCIDA' };
  } else if (daysUntil === 0) {
    return { emoji: '⏰', text: 'VENCE HOJE' };
  } else if (daysUntil === 1) {
    return { emoji: '⚠️', text: 'VENCE AMANHÃ' };
  } else if (daysUntil <= 3) {
    return { emoji: '🔔', text: `VENCE EM ${daysUntil} DIAS` };
  } else {
    return { emoji: '📅', text: `VENCE EM ${daysUntil} DIAS` };
  }
}

/**
 * Gera saudação baseada no horário
 * 
 * @returns Saudação apropriada
 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  
  if (hour < 6) {
    return 'Boa madrugada';
  } else if (hour < 12) {
    return 'Bom dia';
  } else if (hour < 18) {
    return 'Boa tarde';
  } else {
    return 'Boa noite';
  }
}
