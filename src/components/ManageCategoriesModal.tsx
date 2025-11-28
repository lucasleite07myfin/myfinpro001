import React, { useState } from 'react';
import { Pencil, Trash2, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface ManageCategoriesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: string[];
  type: 'income' | 'expense';
  onEdit: (id: string, oldName: string, newName: string) => Promise<void>;
  onDelete: (categoryName: string) => Promise<boolean>;
}

export function ManageCategoriesModal({
  open,
  onOpenChange,
  categories,
  type,
  onEdit,
  onDelete,
}: ManageCategoriesModalProps) {
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [deletingCategory, setDeletingCategory] = useState<string | null>(null);

  // Remove o prefixo "Crie sua categoria: " para exibição
  const displayCategories = categories.map(cat => 
    cat.replace('Crie sua categoria: ', '')
  );

  const handleEditClick = (category: string) => {
    setEditingCategory(category);
    setEditValue(category);
  };

  const handleSaveEdit = async () => {
    if (!editingCategory || !editValue.trim()) return;

    // O id não é usado na implementação atual, mas mantemos para compatibilidade
    await onEdit('', editingCategory, editValue.trim());
    setEditingCategory(null);
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setEditValue('');
  };

  const handleDeleteClick = (category: string) => {
    setDeletingCategory(category);
  };

  const handleConfirmDelete = async () => {
    if (!deletingCategory) return;

    const success = await onDelete(deletingCategory);
    if (success) {
      setDeletingCategory(null);
    }
  };

  const handleCancelDelete = () => {
    setDeletingCategory(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciar Categorias</DialogTitle>
            <DialogDescription>
              Edite ou exclua suas categorias personalizadas de {type === 'income' ? 'receitas' : 'despesas'}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-4">
            {displayCategories.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Você ainda não tem categorias personalizadas.</p>
                <p className="text-sm mt-2">
                  Use a busca no campo de categoria para criar uma nova!
                </p>
              </div>
            ) : (
              displayCategories.map((category) => (
                <div
                  key={category}
                  className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                >
                  {editingCategory === category ? (
                    <div className="flex-1 flex items-center gap-2">
                      <div className="flex-1">
                        <Label htmlFor="edit-category" className="sr-only">
                          Editar categoria
                        </Label>
                        <Input
                          id="edit-category"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveEdit();
                            } else if (e.key === 'Escape') {
                              handleCancelEdit();
                            }
                          }}
                          className="h-8"
                          autoFocus
                        />
                      </div>
                      <Button
                        size="sm"
                        onClick={handleSaveEdit}
                        disabled={!editValue.trim()}
                      >
                        Salvar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCancelEdit}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="font-normal">
                          {category}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditClick(category)}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteClick(category)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog para confirmar exclusão */}
      <AlertDialog open={!!deletingCategory} onOpenChange={() => setDeletingCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a categoria <strong>"{deletingCategory}"</strong>?
              <br />
              <br />
              As transações que usam esta categoria serão mantidas, mas a categoria não estará mais disponível para novas transações.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
