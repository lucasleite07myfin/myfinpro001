
export interface Supplier {
  id: string;
  name: string;
  document: string; // CNPJ or CPF
  isCompany: boolean; // true for CNPJ, false for CPF
  stateRegistration?: string; // Inscrição Estadual
  address?: {
    street?: string;
    number?: string;
    complement?: string;
    district?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  phone?: string;
  email?: string;
  contactPerson?: string;
  productType: string;
  otherProductType?: string;
  paymentTerms?: string;
  bankInfo?: {
    bank?: string;
    agency?: string;
    account?: string;
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const productTypeOptions = [
  "Matéria-Prima",
  "Produtos para Revenda",
  "Material de Escritório",
  "Equipamentos",
  "Serviços de Manutenção",
  "Serviços de Consultoria",
  "Serviços de TI",
  "Serviços de Marketing",
  "Serviços de Logística",
  "Serviços Financeiros",
  "Outro"
];

export const stateOptions = [
  { value: "AC", label: "Acre" },
  { value: "AL", label: "Alagoas" },
  { value: "AP", label: "Amapá" },
  { value: "AM", label: "Amazonas" },
  { value: "BA", label: "Bahia" },
  { value: "CE", label: "Ceará" },
  { value: "DF", label: "Distrito Federal" },
  { value: "ES", label: "Espírito Santo" },
  { value: "GO", label: "Goiás" },
  { value: "MA", label: "Maranhão" },
  { value: "MT", label: "Mato Grosso" },
  { value: "MS", label: "Mato Grosso do Sul" },
  { value: "MG", label: "Minas Gerais" },
  { value: "PA", label: "Pará" },
  { value: "PB", label: "Paraíba" },
  { value: "PR", label: "Paraná" },
  { value: "PE", label: "Pernambuco" },
  { value: "PI", label: "Piauí" },
  { value: "RJ", label: "Rio de Janeiro" },
  { value: "RN", label: "Rio Grande do Norte" },
  { value: "RS", label: "Rio Grande do Sul" },
  { value: "RO", label: "Rondônia" },
  { value: "RR", label: "Roraima" },
  { value: "SC", label: "Santa Catarina" },
  { value: "SP", label: "São Paulo" },
  { value: "SE", label: "Sergipe" },
  { value: "TO", label: "Tocantins" }
];
