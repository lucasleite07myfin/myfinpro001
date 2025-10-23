import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBusiness } from '@/contexts/BusinessContext';
import { Supplier, productTypeOptions, stateOptions } from '@/types/supplier';
import { formatDocument, formatPhone, formatCEP, validateDocument, isCNPJ } from '@/utils/documentValidator';
import { AlertCircle, CheckCircle2, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from '@/components/ui/sonner';
import { sanitizeText, sanitizeEmail } from '@/utils/xssSanitizer';

interface AddSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier?: Supplier;
}

const AddSupplierModal: React.FC<AddSupplierModalProps> = ({ isOpen, onClose, supplier }) => {
  const { addSupplier, editSupplier, getSupplierByDocument } = useBusiness();

  // Use a properly typed initial form state
  const initialFormState = {
    name: '',
    document: '',
    isCompany: false,
    stateRegistration: '',
    address: {
      street: '',
      number: '',
      complement: '',
      district: '',
      city: '',
      state: '',
      zipCode: ''
    },
    phone: '',
    email: '',
    contactPerson: '',
    productType: 'Matéria-Prima',
    otherProductType: '',
    paymentTerms: '',
    bankInfo: {
      bank: '',
      agency: '',
      account: ''
    },
    notes: ''
  };

  const [formData, setFormData] = useState<typeof initialFormState>(initialFormState);

  const [formErrors, setFormErrors] = useState({
    name: false,
    document: false,
    documentExists: false,
    email: false
  });

  // Reset form when modal opens or supplier changes
  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name || '',
        document: supplier.document || '',
        isCompany: supplier.isCompany || false,
        stateRegistration: supplier.stateRegistration || '',
        address: {
          street: supplier.address?.street || '',
          number: supplier.address?.number || '',
          complement: supplier.address?.complement || '',
          district: supplier.address?.district || '',
          city: supplier.address?.city || '',
          state: supplier.address?.state || '',
          zipCode: supplier.address?.zipCode || ''
        },
        phone: supplier.phone || '',
        email: supplier.email || '',
        contactPerson: supplier.contactPerson || '',
        productType: supplier.productType || 'Matéria-Prima',
        otherProductType: supplier.otherProductType || '',
        paymentTerms: supplier.paymentTerms || '',
        bankInfo: {
          bank: supplier.bankInfo?.bank || '',
          agency: supplier.bankInfo?.agency || '',
          account: supplier.bankInfo?.account || ''
        },
        notes: supplier.notes || ''
      });
    } else {
      setFormData(initialFormState);
    }
    setFormErrors({
      name: false,
      document: false,
      documentExists: false,
      email: false
    });
  }, [isOpen, supplier]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      
      if (parent === 'address') {
        setFormData(prev => ({
          ...prev,
          address: {
            ...prev.address,
            [child]: value
          }
        }));
      } else if (parent === 'bankInfo') {
        setFormData(prev => ({
          ...prev,
          bankInfo: {
            ...prev.bankInfo,
            [child]: value
          }
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear errors when field is edited
    if (name === 'name' || name === 'document' || name === 'email') {
      setFormErrors(prev => ({ ...prev, [name]: false }));
      if (name === 'document') {
        setFormErrors(prev => ({ ...prev, documentExists: false }));
      }
    }
  };

  const handleSelectChange = (value: string, name: string) => {
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      
      if (parent === 'address') {
        setFormData(prev => ({
          ...prev,
          address: {
            ...prev.address,
            [child]: value
          }
        }));
      } else if (parent === 'bankInfo') {
        setFormData(prev => ({
          ...prev,
          bankInfo: {
            ...prev.bankInfo,
            [child]: value
          }
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedDocument = formatDocument(e.target.value);
    
    setFormData(prev => ({ 
      ...prev, 
      document: formattedDocument,
      isCompany: isCNPJ(formattedDocument)
    }));
    
    setFormErrors(prev => ({ 
      ...prev, 
      document: false,
      documentExists: false
    }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ 
      ...prev, 
      phone: formatPhone(e.target.value)
    }));
  };

  const handleZipCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        zipCode: formatCEP(e.target.value)
      }
    }));
  };

  const validateForm = (): boolean => {
    const errors = {
      name: !formData.name.trim(),
      document: !formData.document.trim() || !validateDocument(formData.document),
      documentExists: false,
      email: formData.email ? !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) : false
    };
    
    // Check if document already exists (when adding new supplier)
    if (!supplier && formData.document) {
      const existingSupplier = getSupplierByDocument(formData.document);
      if (existingSupplier && existingSupplier.id !== supplier?.id) {
        errors.documentExists = true;
      }
    }
    
    setFormErrors(errors);
    return !Object.values(errors).some(Boolean);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Sanitize all text inputs
      const sanitizedData = {
        name: sanitizeText(formData.name),
        document: formData.document, // Already validated format
        isCompany: formData.isCompany,
        stateRegistration: sanitizeText(formData.stateRegistration),
        address: {
          street: sanitizeText(formData.address.street),
          number: sanitizeText(formData.address.number),
          complement: sanitizeText(formData.address.complement),
          district: sanitizeText(formData.address.district),
          city: sanitizeText(formData.address.city),
          state: formData.address.state, // Select value, already safe
          zipCode: formData.address.zipCode // Already formatted
        },
        phone: formData.phone, // Already formatted
        email: sanitizeEmail(formData.email),
        contactPerson: sanitizeText(formData.contactPerson),
        productType: formData.productType, // Select value, already safe
        otherProductType: sanitizeText(formData.otherProductType),
        paymentTerms: sanitizeText(formData.paymentTerms),
        bankInfo: {
          bank: sanitizeText(formData.bankInfo.bank),
          agency: sanitizeText(formData.bankInfo.agency),
          account: sanitizeText(formData.bankInfo.account)
        },
        notes: sanitizeText(formData.notes)
      };

      if (supplier) {
        editSupplier({
          ...supplier,
          ...sanitizedData,
          updatedAt: new Date()
        });
      } else {
        addSupplier(sanitizedData);
      }
      onClose();
    } else {
      toast.error('Por favor, corrija os campos com erro antes de salvar.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{supplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}</DialogTitle>
          <DialogDescription>
            {supplier 
              ? 'Edite as informações do fornecedor abaixo.' 
              : 'Preencha as informações do novo fornecedor.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center">
                  Nome / Razão Social <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={formErrors.name ? 'border-red-500' : ''}
                />
                {formErrors.name && (
                  <p className="text-sm text-red-500 flex items-center mt-1">
                    <AlertCircle className="h-4 w-4 mr-1" /> Este campo é obrigatório
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="document" className="flex items-center">
                  CNPJ / CPF <span className="text-red-500 ml-1">*</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 ml-1 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Para CNPJ: XX.XXX.XXX/XXXX-XX</p>
                        <p>Para CPF: XXX.XXX.XXX-XX</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Input
                  id="document"
                  name="document"
                  value={formData.document}
                  onChange={handleDocumentChange}
                  className={formErrors.document || formErrors.documentExists ? 'border-red-500' : ''}
                  maxLength={18}
                />
                {formErrors.document && (
                  <p className="text-sm text-red-500 flex items-center mt-1">
                    <AlertCircle className="h-4 w-4 mr-1" /> CNPJ ou CPF inválido
                  </p>
                )}
                {formErrors.documentExists && (
                  <p className="text-sm text-red-500 flex items-center mt-1">
                    <AlertCircle className="h-4 w-4 mr-1" /> Este documento já existe na base
                  </p>
                )}
              </div>

              {formData.isCompany && (
                <div className="space-y-2">
                  <Label htmlFor="stateRegistration">Inscrição Estadual</Label>
                  <Input
                    id="stateRegistration"
                    name="stateRegistration"
                    value={formData.stateRegistration || ''}
                    onChange={handleChange}
                    disabled={!formData.isCompany}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2 mt-4">
              <h3 className="font-medium">Endereço</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address.street">Rua/Avenida</Label>
                  <Input
                    id="address.street"
                    name="address.street"
                    value={formData.address?.street || ''}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address.number">Número</Label>
                  <Input
                    id="address.number"
                    name="address.number"
                    value={formData.address?.number || ''}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address.complement">Complemento</Label>
                  <Input
                    id="address.complement"
                    name="address.complement"
                    value={formData.address?.complement || ''}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address.district">Bairro</Label>
                  <Input
                    id="address.district"
                    name="address.district"
                    value={formData.address?.district || ''}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address.zipCode">CEP</Label>
                  <Input
                    id="address.zipCode"
                    name="address.zipCode"
                    value={formData.address?.zipCode || ''}
                    onChange={handleZipCodeChange}
                    maxLength={9}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address.city">Cidade</Label>
                  <Input
                    id="address.city"
                    name="address.city"
                    value={formData.address?.city || ''}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address.state">Estado</Label>
                  <Select 
                    value={formData.address?.state || ''} 
                    onValueChange={(value) => handleSelectChange(value, 'address.state')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {stateOptions.map((state) => (
                        <SelectItem key={state.value} value={state.value}>
                          {state.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone Principal</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone || ''}
                  onChange={handlePhoneChange}
                  maxLength={15}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={handleChange}
                  className={formErrors.email ? 'border-red-500' : ''}
                />
                {formErrors.email && (
                  <p className="text-sm text-red-500 flex items-center mt-1">
                    <AlertCircle className="h-4 w-4 mr-1" /> E-mail inválido
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactPerson">Pessoa de Contato</Label>
                <Input
                  id="contactPerson"
                  name="contactPerson"
                  value={formData.contactPerson || ''}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="productType">Tipo de Produto/Serviço <span className="text-red-500 ml-1">*</span></Label>
                <div className="flex gap-2">
                  <Select 
                    value={formData.productType} 
                    onValueChange={(value) => handleSelectChange(value, 'productType')}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {productTypeOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {formData.productType === 'Outro' && (
                  <Input
                    id="otherProductType"
                    name="otherProductType"
                    value={formData.otherProductType || ''}
                    onChange={handleChange}
                    placeholder="Especifique o tipo"
                    className="mt-2"
                  />
                )}
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <Label htmlFor="paymentTerms">Condições de Pagamento</Label>
              <Input
                id="paymentTerms"
                name="paymentTerms"
                value={formData.paymentTerms || ''}
                onChange={handleChange}
                placeholder="Ex.: 30 dias, boleto, PIX"
              />
            </div>

            <div className="space-y-2 mt-4">
              <h3 className="font-medium">Dados Bancários</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bankInfo.bank">Banco</Label>
                  <Input
                    id="bankInfo.bank"
                    name="bankInfo.bank"
                    value={formData.bankInfo?.bank || ''}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankInfo.agency">Agência</Label>
                  <Input
                    id="bankInfo.agency"
                    name="bankInfo.agency"
                    value={formData.bankInfo?.agency || ''}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankInfo.account">Conta</Label>
                  <Input
                    id="bankInfo.account"
                    name="bankInfo.account"
                    value={formData.bankInfo?.account || ''}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes || ''}
                onChange={handleChange}
                className="min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {supplier ? 'Salvar Alterações' : 'Adicionar Fornecedor'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddSupplierModal;
