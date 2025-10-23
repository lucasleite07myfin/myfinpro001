import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-csrf-token',
};

interface ValidationRequest {
  type: 'email' | 'cpf' | 'cnpj' | 'phone';
  value: string;
}

/**
 * Validate email format
 */
const validateEmail = (email: string): { valid: boolean; message?: string } => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return { valid: false, message: 'Formato de email inválido' };
  }
  
  if (email.length > 255) {
    return { valid: false, message: 'Email muito longo (máx: 255 caracteres)' };
  }
  
  return { valid: true };
};

/**
 * Validate CPF (Brazilian individual tax ID)
 */
const validateCPF = (cpf: string): { valid: boolean; message?: string } => {
  const cleaned = cpf.replace(/[^\d]/g, '');
  
  if (cleaned.length !== 11) {
    return { valid: false, message: 'CPF deve ter 11 dígitos' };
  }
  
  // Check if all digits are the same
  if (/^(\d)\1+$/.test(cleaned)) {
    return { valid: false, message: 'CPF inválido' };
  }
  
  // Validate check digits
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let checkDigit = 11 - (sum % 11);
  if (checkDigit >= 10) checkDigit = 0;
  
  if (checkDigit !== parseInt(cleaned.charAt(9))) {
    return { valid: false, message: 'CPF inválido' };
  }
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  checkDigit = 11 - (sum % 11);
  if (checkDigit >= 10) checkDigit = 0;
  
  if (checkDigit !== parseInt(cleaned.charAt(10))) {
    return { valid: false, message: 'CPF inválido' };
  }
  
  return { valid: true };
};

/**
 * Validate CNPJ (Brazilian company tax ID)
 */
const validateCNPJ = (cnpj: string): { valid: boolean; message?: string } => {
  const cleaned = cnpj.replace(/[^\d]/g, '');
  
  if (cleaned.length !== 14) {
    return { valid: false, message: 'CNPJ deve ter 14 dígitos' };
  }
  
  // Check if all digits are the same
  if (/^(\d)\1+$/.test(cleaned)) {
    return { valid: false, message: 'CNPJ inválido' };
  }
  
  // Validate first check digit
  let length = cleaned.length - 2;
  let numbers = cleaned.substring(0, length);
  const digits = cleaned.substring(length);
  let sum = 0;
  let pos = length - 7;
  
  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) {
    return { valid: false, message: 'CNPJ inválido' };
  }
  
  // Validate second check digit
  length = length + 1;
  numbers = cleaned.substring(0, length);
  sum = 0;
  pos = length - 7;
  
  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) {
    return { valid: false, message: 'CNPJ inválido' };
  }
  
  return { valid: true };
};

/**
 * Validate phone number
 */
const validatePhone = (phone: string): { valid: boolean; message?: string } => {
  const cleaned = phone.replace(/[^\d]/g, '');
  
  if (cleaned.length < 10 || cleaned.length > 11) {
    return { valid: false, message: 'Telefone deve ter 10 ou 11 dígitos' };
  }
  
  return { valid: true };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { type, value }: ValidationRequest = await req.json();

    if (!type || !value) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let result;
    
    switch (type) {
      case 'email':
        result = validateEmail(value);
        break;
      case 'cpf':
        result = validateCPF(value);
        break;
      case 'cnpj':
        result = validateCNPJ(value);
        break;
      case 'phone':
        result = validatePhone(value);
        break;
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid validation type' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
