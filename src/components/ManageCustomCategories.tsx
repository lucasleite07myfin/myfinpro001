import React, { useState } from 'react';
import { Pencil, Trash2, FolderEdit, Lightbulb, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SelectItem } from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

interface ManageCustomCategoriesProps {
  categories: string[];
  type: 'income' | 'expense';
  onEdit: (id: string, oldName: string, newName: string) => Promise<void>;
  onDelete: (categoryName: string) => Promise<boolean>;
}

export const ManageCustomCategories: React.FC<ManageCustomCategoriesProps> = ({
  categories,
  type,
  onEdit,
  onDelete
}) => {
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string } | null>(null);
  const [newName, setNewName] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  if (categories.length === 0) return null;

  const handleEditClick = (categoryName: string) => {
    // Remover prefixo "Crie sua categoria: " para edição
    const nameWithoutPrefix = categoryName.replace('Crie sua categoria: ', '');
    setNewName(nameWithoutPrefix);
    setEditingCategory({ id: '', name: categoryName });
  };

  const handleSaveEdit = async () => {
    if (editingCategory && newName.trim()) {
      await onEdit('', editingCategory.name, newName.trim());
      setEditingCategory(null);
      setNewName('');
    }
  };

  const handleDeleteClick = (categoryName: string) => {
    setCategoryToDelete(categoryName);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (categoryToDelete) {
      const success = await onDelete(categoryToDelete);
      if (success) {
        setDeleteDialogOpen(false);
        setCategoryToDelete(null);
      }
    }
  };

  return (
    <>
      <div className="px-2 py-2 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-200">
        <div className="flex items-center gap-2 mb-2">
          <FolderEdit className="h-4 w-4 text-orange-600" />
          <span className="text-xs font-semibold text-orange-900">
            Minhas Categorias ({categories.length})
          </span>
        </div>
        <div className="space-y-1">
          {categories.map((cat) => {
            const displayName = cat.replace('Crie sua categoria: ', '');
            return (
              <SelectItem 
                key={cat}
                value={displayName}
                className="relative group"
              >
                <div className="flex items-center justify-between w-full pr-16">
                  <span className="text-sm font-medium">
                    {displayName}
                  </span>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 hover:bg-blue-100 hover:text-blue-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleEditClick(cat);
                      }}
                      title="Editar categoria"
                      type="button"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 hover:bg-red-100 hover:text-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleDeleteClick(cat);
                      }}
                      title="Excluir categoria"
                      type="button"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </SelectItem>
            );
          })}
        </div>
      </div>
      <Separator />

      {/* Dialog de Edição */}
      <Dialog open={!!editingCategory} onOpenChange={() => setEditingCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Categoria</DialogTitle>
            <DialogDescription>
              Renomeie sua categoria personalizada. Todas as transações associadas serão atualizadas.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">Nome da Categoria</Label>
              <Input
                id="category-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Digite o novo nome"
                autoFocus
              />
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Lightbulb className="h-3 w-3" />
              A categoria será salva como "Crie sua categoria: {newName}"
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCategory(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={!newName.trim()}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Categoria</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a categoria{' '}
              <strong className="text-foreground">"{categoryToDelete}"</strong>?
              <br /><br />
              <span className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="h-4 w-4" />
                Esta ação não pode ser desfeita. A categoria só pode ser excluída se não estiver em uso.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCategoryToDelete(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
