
/**
 * Validates a CPF (Brazilian individual taxpayer registry) number
 */
export const validateCPF = (cpf: string): boolean => {
  // Remove non-numeric characters
  cpf = cpf.replace(/[^\d]/g, '');
  
  // Check if it has 11 digits
  if (cpf.length !== 11) return false;
  
  // Check if all digits are the same
  if (/^(\d)\1+$/.test(cpf)) return false;
  
  // Validate first check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let remainder = 11 - (sum % 11);
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.charAt(9))) return false;
  
  // Validate second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  remainder = 11 - (sum % 11);
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.charAt(10))) return false;
  
  return true;
};

/**
 * Validates a CNPJ (Brazilian company registry) number
 */
export const validateCNPJ = (cnpj: string): boolean => {
  // Remove non-numeric characters
  cnpj = cnpj.replace(/[^\d]/g, '');
  
  // Check if it has 14 digits
  if (cnpj.length !== 14) return false;
  
  // Check if all digits are the same
  if (/^(\d)\1+$/.test(cnpj)) return false;
  
  // Validate first check digit
  let size = cnpj.length - 2;
  let numbers = cnpj.substring(0, size);
  const digits = cnpj.substring(size);
  let sum = 0;
  let pos = size - 7;
  
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;
  
  // Validate second check digit
  size = size + 1;
  numbers = cnpj.substring(0, size);
  sum = 0;
  pos = size - 7;
  
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;
  
  return true;
};

/**
 * Format a CPF string (XXX.XXX.XXX-XX)
 */
export const formatCPF = (cpf: string): string => {
  cpf = cpf.replace(/\D/g, '');
  if (cpf.length <= 11) {
    cpf = cpf.padStart(11, '0');
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  return cpf;
};

/**
 * Format a CNPJ string (XX.XXX.XXX/XXXX-XX)
 */
export const formatCNPJ = (cnpj: string): string => {
  cnpj = cnpj.replace(/\D/g, '');
  if (cnpj.length <= 14) {
    cnpj = cnpj.padStart(14, '0');
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  return cnpj;
};

/**
 * Format a phone number (XX) XXXXX-XXXX
 */
export const formatPhone = (phone: string): string => {
  phone = phone.replace(/\D/g, '');
  if (phone.length <= 11) {
    if (phone.length === 11) {
      return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (phone.length === 10) {
      return phone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
  }
  return phone;
};

/**
 * Format a CEP (postal code) (XXXXX-XXX)
 */
export const formatCEP = (cep: string): string => {
  cep = cep.replace(/\D/g, '');
  if (cep.length <= 8) {
    return cep.replace(/(\d{5})(\d{3})/, '$1-$2');
  }
  return cep;
};

/**
 * Validates if the document is a valid CPF or CNPJ
 */
export const validateDocument = (document: string): boolean => {
  const cleanDocument = document.replace(/\D/g, '');
  
  if (cleanDocument.length === 11) {
    return validateCPF(cleanDocument);
  } else if (cleanDocument.length === 14) {
    return validateCNPJ(cleanDocument);
  }
  
  return false;
};

/**
 * Format document based on its length (CPF or CNPJ)
 */
export const formatDocument = (document: string): string => {
  const cleanDocument = document.replace(/\D/g, '');
  
  if (cleanDocument.length <= 11) {
    return formatCPF(cleanDocument);
  } else {
    return formatCNPJ(cleanDocument);
  }
};

/**
 * Check if the document is a CNPJ (as opposed to CPF)
 */
export const isCNPJ = (document: string): boolean => {
  const cleanDocument = document.replace(/\D/g, '');
  return cleanDocument.length > 11;
};
