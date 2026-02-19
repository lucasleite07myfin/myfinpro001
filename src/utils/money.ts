/** Tipo semântico: valor monetário em centavos (inteiro) */
export type MoneyCents = number;

/** Remove tudo que não é dígito. Ex: "R$ 1.234,56" => "123456" */
export function normalizeCurrencyInputToDigits(input: string): string {
  return input.replace(/\D/g, '');
}

/** Converte string formatada (ex: "R$ 1.234,56") para centavos inteiros. Vazio => 0 */
export function currencyStringToCents(input: string): MoneyCents {
  const digits = normalizeCurrencyInputToDigits(input);
  if (digits === '') return 0;
  return parseInt(digits, 10);
}

/**
 * Converte string decimal ("1234.56" ou "1234,56") para centavos.
 * Sem parseFloat — usa split + pad/truncate na parte fracionária.
 * "10" => 1000, "10,5" => 1050, "10,50" => 1050
 */
export function decimalStringToCents(input: string): MoneyCents {
  const trimmed = input.trim();
  if (trimmed === '') return 0;

  const negative = trimmed.startsWith('-');
  const abs = negative ? trimmed.slice(1) : trimmed;

  // Encontra o último separador decimal (, ou .)
  const lastComma = abs.lastIndexOf(',');
  const lastDot = abs.lastIndexOf('.');
  const sepIndex = Math.max(lastComma, lastDot);

  let intPart: string;
  let fracPart: string;

  if (sepIndex === -1) {
    // Sem separador — valor inteiro (ex: "10" => 1000)
    intPart = abs.replace(/\D/g, '');
    fracPart = '00';
  } else {
    intPart = abs.slice(0, sepIndex).replace(/\D/g, '');
    fracPart = abs.slice(sepIndex + 1).replace(/\D/g, '');
    // Pad ou trunca para exatamente 2 dígitos
    fracPart = (fracPart + '00').slice(0, 2);
  }

  if (intPart === '') intPart = '0';

  const cents = parseInt(intPart + fracPart, 10);
  return negative ? -cents : cents;
}

/**
 * Converte centavos para string decimal com 2 casas. Ex: 123456 => "1234.56"
 * Trata sinal negativo. Usa apenas manipulação de string.
 */
export function centsToDecimalString(cents: MoneyCents): string {
  const negative = cents < 0;
  const abs = Math.abs(cents);
  const str = String(abs).padStart(3, '0'); // garante pelo menos 3 chars (ex: 5 => "005")
  const intPart = str.slice(0, -2);
  const fracPart = str.slice(-2);
  return (negative ? '-' : '') + intPart + '.' + fracPart;
}

/** Formata centavos para "R$ 1.234,56" usando Intl (apenas exibição) */
export function formatBRLFromCents(cents: MoneyCents): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100);
}

/** Formata centavos para "1.234,56" (sem R$), útil para inputs */
export function formatNumberFromCentsForInput(cents: MoneyCents): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}
