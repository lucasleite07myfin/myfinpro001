import React, { useState } from 'react';
import { Pencil, Trash2, FolderEdit, Lightbulb, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
      <div className="px-2 py-2 bg-muted/50 border-b">
        <div className="flex items-center gap-2 mb-2">
          <FolderEdit className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground">
            Minhas Categorias ({categories.length})
          </span>
        </div>
        <div className="space-y-1">
          {categories.map((cat) => (
            <div 
              key={cat}
              className="flex items-center justify-between gap-2 p-1.5 rounded-md hover:bg-muted/80 group"
            >
              <span className="text-sm flex-1 truncate">{cat}</span>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleEditClick(cat)}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive hover:text-destructive"
                  onClick={() => handleDeleteClick(cat)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
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
