
import React, { useState, useEffect } from 'react';
import { Plus, FileUp, Search, Edit, Trash2, AlertTriangle, FileText } from 'lucide-react';
import { useBusiness } from '@/contexts/BusinessContext';
import { formatDateToDB } from '@/utils/formatters';
import MainLayout from '@/components/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AddSupplierModal from '@/components/AddSupplierModal';
import { Supplier } from '@/types/supplier';
import { formatCEP } from '@/utils/documentValidator';
import { toast } from 'sonner';

const Suppliers: React.FC = () => {
  const { suppliers, deleteSupplier } = useBusiness();
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [supplierToEdit, setSupplierToEdit] = useState<Supplier | undefined>(undefined);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | undefined>(undefined);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  
  // Filter suppliers based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredSuppliers(suppliers);
    } else {
      const term = searchTerm.toLowerCase().trim();
      const filtered = suppliers.filter(supplier => {
        const name = supplier.name?.toLowerCase() || '';
        const document = supplier.document?.toLowerCase() || '';
        const email = supplier.email?.toLowerCase() || '';
        const phone = supplier.phone?.toLowerCase() || '';
        const contact = supplier.contactPerson?.toLowerCase() || '';
        const city = supplier.address?.city?.toLowerCase() || '';
        const productType = supplier.productType?.toLowerCase() || '';
        
        return name.includes(term) || 
               document.includes(term) || 
               email.includes(term) || 
               phone.includes(term) ||
               contact.includes(term) ||
               city.includes(term) ||
               productType.includes(term);
      });
      setFilteredSuppliers(filtered);
    }
  }, [searchTerm, suppliers]);
  
  // Handle edit supplier
  const handleEditSupplier = (supplier: Supplier) => {
    setSupplierToEdit(supplier);
    setIsAddModalOpen(true);
  };
  
  // Handle delete supplier
  const handleDeleteSupplierClick = (supplier: Supplier) => {
    setSupplierToDelete(supplier);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDeleteSupplier = () => {
    if (supplierToDelete) {
      deleteSupplier(supplierToDelete.id);
      setIsDeleteDialogOpen(false);
      setSupplierToDelete(undefined);
    }
  };
  
  // Modal open/close handlers
  const openAddModal = () => {
    setSupplierToEdit(undefined);
    setIsAddModalOpen(true);
  };
  
  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setSupplierToEdit(undefined);
  };
  
  // Format address for display
  const formatAddress = (supplier: Supplier): string => {
    const { address } = supplier;
    if (!address) return '';
    
    const parts = [];
    
    if (address.street) {
      let streetPart = address.street;
      if (address.number) streetPart += `, ${address.number}`;
      parts.push(streetPart);
    }
    
    if (address.city) {
      let cityPart = address.city;
      if (address.state) cityPart += ` - ${address.state}`;
      parts.push(cityPart);
    }
    
    if (address.zipCode) {
      parts.push(formatCEP(address.zipCode));
    }
    
    return parts.join(' • ');
  };
  
  // Export suppliers to CSV
  const exportToCSV = () => {
    const headers = [
      'Nome/Razão Social',
      'CNPJ/CPF',
      'Inscrição Estadual',
      'Endereço',
      'Telefone',
      'Email',
      'Pessoa de Contato',
      'Tipo de Produto/Serviço',
      'Condições de Pagamento',
      'Observações'
    ];
    
    const rows = filteredSuppliers.map(supplier => [
      supplier.name,
      supplier.document || '',
      supplier.stateRegistration || '',
      formatAddress(supplier),
      supplier.phone || '',
      supplier.email || '',
      supplier.contactPerson || '',
      supplier.productType === 'Outro' ? (supplier.otherProductType || 'Outro') : (supplier.productType || ''),
      supplier.paymentTerms || '',
      supplier.notes || ''
    ]);
    
    // Note: generateCSV already handles BOM and proper cell escaping
    const csvContent = [
      '\ufeff', // BOM
      headers.map(h => `"${h}"`).join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const date = formatDateToDB(new Date());
    link.setAttribute('href', url);
    link.setAttribute('download', `fornecedores_${date}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success("Arquivo CSV de fornecedores exportado com sucesso!");
  };
  
  // Export suppliers to Excel
  const exportToExcel = () => {
    const headers = [
      'Nome/Razão Social', 'CNPJ/CPF', 'Inscrição Estadual', 'Endereço', 
      'Telefone', 'Email', 'Pessoa de Contato', 'Tipo de Produto/Serviço', 
      'Condições de Pagamento', 'Observações'
    ];
    
    const rows = filteredSuppliers.map(supplier => [
      supplier.name || '',
      supplier.document || '',
      supplier.stateRegistration || '',
      formatAddress(supplier),
      supplier.phone || '',
      supplier.email || '',
      supplier.contactPerson || '',
      supplier.productType === 'Outro' ? (supplier.otherProductType || 'Outro') : (supplier.productType || ''),
      supplier.paymentTerms || '',
      supplier.notes || ''
    ]);
    
    let excelContent = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
    excelContent += '<head><meta charset="UTF-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Fornecedores</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>';
    excelContent += '<body><table>';
    excelContent += '<tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr>';
    rows.forEach(row => {
      excelContent += '<tr>' + row.map(cell => `<td>${cell}</td>`).join('') + '</tr>';
    });
    excelContent += '</table></body></html>';
    
    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const date = formatDateToDB(new Date());
    link.download = `fornecedores_${date}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success("Arquivo Excel de fornecedores exportado com sucesso!");
  };
  
  // Export suppliers to PDF (HTML for printing)
  const exportToPDF = () => {
    const headers = ['Nome/Razão Social', 'CNPJ/CPF', 'Telefone', 'Email', 'Pessoa de Contato', 'Endereço', 'Tipo de Produto'];
    
    const rows = filteredSuppliers.map(supplier => [
      supplier.name || '',
      supplier.document || '',
      supplier.phone || '',
      supplier.email || '',
      supplier.contactPerson || '',
      formatAddress(supplier),
      supplier.productType === 'Outro' ? (supplier.otherProductType || 'Outro') : (supplier.productType || '')
    ]);
    
    let pdfContent = `
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: bold; }
          h1 { color: #333; margin-bottom: 5px; }
          .subtitle { color: #666; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <h1>Lista de Fornecedores</h1>
        <p class="subtitle">Data: ${new Date().toLocaleDateString('pt-BR')}</p>
        <table>
          <thead>
            <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
    
    const blob = new Blob([pdfContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const date = formatDateToDB(new Date());
    link.download = `fornecedores_${date}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success("Arquivo PDF de fornecedores exportado com sucesso! (HTML formatado para impressão)");
  };
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-2xl font-bold">Fornecedores</h1>
          
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="hidden md:flex"
                >
                  <FileUp className="mr-2 h-4 w-4" />
                  Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportToCSV} className="cursor-pointer">
                  <FileText className="mr-2 h-4 w-4" />
                  <span>Exportar CSV</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToExcel} className="cursor-pointer">
                  <FileText className="mr-2 h-4 w-4" />
                  <span>Exportar Excel</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToPDF} className="cursor-pointer">
                  <FileText className="mr-2 h-4 w-4" />
                  <span>Exportar PDF</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="sm" onClick={openAddModal}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Fornecedor
            </Button>
          </div>
        </div>
        
        <div className="flex items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar fornecedores..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className="ml-2 md:hidden"
              >
                <FileUp className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportToCSV} className="cursor-pointer">
                <FileText className="mr-2 h-4 w-4" />
                <span>Exportar CSV</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToExcel} className="cursor-pointer">
                <FileText className="mr-2 h-4 w-4" />
                <span>Exportar Excel</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToPDF} className="cursor-pointer">
                <FileText className="mr-2 h-4 w-4" />
                <span>Exportar PDF</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Nome / Razão Social</TableHead>
                <TableHead>CNPJ / CPF</TableHead>
                <TableHead className="hidden md:table-cell">Telefone</TableHead>
                <TableHead className="hidden lg:table-cell">Endereço</TableHead>
                <TableHead className="hidden lg:table-cell">Tipo Produto/Serviço</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    {searchTerm ? (
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Search className="h-8 w-8 mb-2" />
                        <p>Nenhum fornecedor encontrado para "{searchTerm}"</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <AlertTriangle className="h-8 w-8 mb-2" />
                        <p>Nenhum fornecedor cadastrado</p>
                        <Button variant="link" onClick={openAddModal}>
                          Adicionar fornecedor
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                filteredSuppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">
                      <div>
                        {supplier.name}
                      </div>
                      {supplier.contactPerson && (
                        <div className="text-sm text-muted-foreground mt-0.5">
                          Contato: {supplier.contactPerson}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>{supplier.document}</div>
                      {supplier.email && (
                        <div className="text-sm text-muted-foreground mt-0.5 truncate max-w-[160px]">
                          {supplier.email}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {supplier.phone || '—'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell max-w-[250px] truncate">
                      {formatAddress(supplier) || '—'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {supplier.productType === 'Outro' ? supplier.otherProductType || 'Outro' : supplier.productType}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditSupplier(supplier)}
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Editar</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSupplierClick(supplier)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                          <span className="sr-only">Excluir</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Add/Edit Supplier Modal */}
        <AddSupplierModal 
          isOpen={isAddModalOpen} 
          onClose={closeAddModal} 
          supplier={supplierToEdit}
        />
        
        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o fornecedor{' '}
                <span className="font-semibold">{supplierToDelete?.name}</span>?
                <br />
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={confirmDeleteSupplier}
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
};

export default Suppliers;
