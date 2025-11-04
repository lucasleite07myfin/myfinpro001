
/**
 * Formata um valor para moeda brasileira (R$) ou dólar americano ($)
 */
export const formatCurrency = (value: number, locale = 'pt-BR', currency = 'BRL'): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency
  }).format(value);
};

/**
 * Formata um valor como porcentagem
 */
export const formatPercent = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

/**
 * Formata uma data para o formato brasileiro (DD/MM/YYYY)
 */
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('pt-BR').format(date);
};

/**
 * Formata uma data para o formato do input date (YYYY-MM-DD)
 */
export const formatDateForInput = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Formata uma string de mês para o formato MM/YYYY
 */
export const formatMonth = (monthYear: string): string => {
  const [year, month] = monthYear.split('-');
  return `${month}/${year}`;
};

/**
 * Calcula a porcentagem de um valor em relação a outro
 */
export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return (value / total) * 100;
};

/**
 * Calcula a porcentagem de conclusão de uma meta
 */
export const calculateGoalProgress = (current: number, target: number): number => {
  if (target === 0) return 0;
  const progress = (current / target) * 100;
  return Math.min(progress, 100); // Limita a 100%
};

/**
 * Retorna o mês atual no formato YYYY-MM
 */
export const getCurrentMonth = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

/**
 * Formata um valor de entrada para o formato de moeda brasileira
 */
export const formatCurrencyInput = (value: string): string => {
  // Remove all non-numeric characters
  const numericValue = value.replace(/\D/g, '');
  
  // Convert to number and divide by 100 to get the decimal value
  const numberValue = numericValue ? parseFloat(numericValue) / 100 : 0;
  
  // Format as currency (Brazilian Real)
  return numberValue.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

/**
 * Converte uma string formatada em moeda para um número
 */
export const parseCurrencyToNumber = (currencyString: string): number => {
  // Remove all non-numeric characters and convert to number
  return parseFloat(currencyString.replace(/\D/g, '')) / 100;
};

/**
 * Formata um valor numérico para exibição em campo de input com R$
 * @param value Valor numérico a ser formatado
 * @returns String formatada com R$ e duas casas decimais
 */
export const formatNumberToCurrency = (value: number): string => {
  return `R$ ${value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

/**
 * Formata um value para exibição em input de moeda
 * @param value Valor a ser formatado (pode ser string vazia ou número)
 * @returns String formatada para exibição em input
 */
export const formatValueForCurrencyInput = (value: string | number): string => {
  if (value === '' || value === undefined || value === null) return '';
  
  // Se for string, converte para número
  const numValue = typeof value === 'string' ? parseCurrencyToNumber(value) : value;
  
  return formatNumberToCurrency(numValue);
};

/**
 * Remove prefixos de categorias personalizadas para exibição
 * Remove "Crie sua categoria: " e "Outros: " (retrocompatibilidade)
 * @param categoryName Nome completo da categoria
 * @returns Nome da categoria sem prefixo
 */
export const formatCategoryForDisplay = (categoryName: string): string => {
  if (categoryName.startsWith('Crie sua categoria: ')) {
    return categoryName.substring(20); // Remove "Crie sua categoria: " (20 caracteres)
  }
  if (categoryName.startsWith('Outros: ')) {
    return categoryName.substring(8); // Remove "Outros: " (8 caracteres) - retrocompatibilidade
  }
  return categoryName;
};
