import React, { useState } from 'react';
import { Check, ChevronsUpDown, Settings, Plus, Star, List } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '@/types/finance';

interface CategoryComboboxProps {
  value: string;
  onValueChange: (value: string) => void;
  type: 'income' | 'expense';
  customCategories: string[];
  onCreateCategory?: (name: string) => Promise<boolean>;
  onManageCategories?: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export function CategoryCombobox({
  value,
  onValueChange,
  type,
  customCategories,
  onCreateCategory,
  onManageCategories,
  placeholder = "Selecione uma categoria",
  disabled = false,
}: CategoryComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  // Pega as categorias padrão baseado no tipo, removendo a opção "Crie sua categoria"
  const defaultCategories = (type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES)
    .filter(cat => cat !== 'Crie sua categoria');

  // Remove o prefixo "Crie sua categoria: " das categorias customizadas para exibição
  const displayCustomCategories = customCategories.map(cat => 
    cat.replace('Crie sua categoria: ', '')
  );

  // Filtra categorias baseado na busca
  const filteredDefaultCategories = defaultCategories.filter(cat =>
    cat.toLowerCase().includes(searchValue.toLowerCase())
  );

  const filteredCustomCategories = displayCustomCategories.filter(cat =>
    cat.toLowerCase().includes(searchValue.toLowerCase())
  );

  // Verifica se a busca não retornou resultados
  const noResults = filteredDefaultCategories.length === 0 && filteredCustomCategories.length === 0;

  // Remove o prefixo para exibição do valor selecionado
  const displayValue = value.replace('Crie sua categoria: ', '');

  const handleCreateCategory = async () => {
    if (!searchValue.trim() || !onCreateCategory) return;
    
    const success = await onCreateCategory(searchValue.trim());
    if (success) {
      // Define o valor com o prefixo para manter compatibilidade
      onValueChange(`Crie sua categoria: ${searchValue.trim()}`);
      setSearchValue('');
      setOpen(false);
    }
  };

  const handleSelectCategory = (selectedValue: string) => {
    // Se for uma categoria customizada (sem prefixo na lista de exibição),
    // adiciona o prefixo antes de salvar
    const isCustomCategory = displayCustomCategories.includes(selectedValue);
    const valueToSave = isCustomCategory 
      ? `Crie sua categoria: ${selectedValue}` 
      : selectedValue;
    
    onValueChange(valueToSave);
    setOpen(false);
    setSearchValue('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-background border-border focus:border-primary focus:ring-primary"
          disabled={disabled}
        >
          <span className="truncate">{displayValue || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 z-50 bg-popover" align="start">
        <Command>
          <CommandInput 
            placeholder="Buscar ou criar categoria..." 
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList className="max-h-[300px]">
            <CommandEmpty>
              {searchValue.trim() && onCreateCategory ? (
                <div 
                  className="flex items-center gap-2 px-2 py-3 cursor-pointer hover:bg-accent text-sm"
                  onClick={handleCreateCategory}
                >
                  <Plus className="h-4 w-4 text-primary" />
                  <span>Criar <span className="font-semibold">"{searchValue}"</span> como nova categoria</span>
                </div>
              ) : (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Nenhuma categoria encontrada
                </div>
              )}
            </CommandEmpty>

            {/* Seção: Minhas Categorias (Customizadas) */}
            {filteredCustomCategories.length > 0 && (
              <CommandGroup heading={
                <div className="flex items-center gap-2">
                  <Star className="h-3 w-3 text-yellow-500" />
                  <span>Minhas Categorias</span>
                </div>
              }>
                {filteredCustomCategories.map((cat) => (
                  <CommandItem
                    key={cat}
                    value={cat}
                    onSelect={handleSelectCategory}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        displayValue === cat ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {cat}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Seção: Categorias Padrão */}
            {filteredDefaultCategories.length > 0 && (
              <CommandGroup heading={
                <div className="flex items-center gap-2">
                  <List className="h-3 w-3" />
                  <span>Categorias Padrão</span>
                </div>
              }>
                {filteredDefaultCategories.map((cat) => (
                  <CommandItem
                    key={cat}
                    value={cat}
                    onSelect={handleSelectCategory}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === cat ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {cat}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Opção de criar quando há resultados mas usuário ainda quer criar */}
            {!noResults && searchValue.trim() && onCreateCategory && 
             !filteredCustomCategories.includes(searchValue) && 
             !filteredDefaultCategories.includes(searchValue) && (
              <CommandGroup>
                <CommandItem
                  onSelect={handleCreateCategory}
                  className="text-primary"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Criar <span className="font-semibold ml-1">"{searchValue}"</span>
                </CommandItem>
              </CommandGroup>
            )}

          </CommandList>
        </Command>
        
        {/* Botão Gerenciar Categorias - Sempre Visível (fora do CommandList) */}
        {onManageCategories && (
          <div className="border-t p-2">
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-foreground"
              onClick={() => {
                setOpen(false);
                onManageCategories();
              }}
            >
              <Settings className="mr-2 h-4 w-4" />
              Gerenciar minhas categorias
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
