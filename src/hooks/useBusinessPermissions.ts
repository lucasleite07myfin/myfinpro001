import { useSubAccount } from '@/contexts/SubAccountContext';

export const useBusinessPermissions = () => {
  const { permissions, isSubAccount } = useSubAccount();

  return {
    canView: (resource: string): boolean => {
      if (!isSubAccount) return true; // Owners têm acesso total
      const permissionKey = `can_view_${resource}` as keyof typeof permissions;
      return permissions[permissionKey] ?? false;
    },
    canCreate: (resource: string): boolean => {
      if (!isSubAccount) return true;
      const permissionKey = `can_create_${resource}` as keyof typeof permissions;
      return permissions[permissionKey] ?? false;
    },
    canEdit: (resource: string): boolean => {
      if (!isSubAccount) return true;
      const permissionKey = `can_edit_${resource}` as keyof typeof permissions;
      return permissions[permissionKey] ?? false;
    },
    canDelete: (resource: string): boolean => {
      if (!isSubAccount) return true;
      const permissionKey = `can_delete_${resource}` as keyof typeof permissions;
      return permissions[permissionKey] ?? false;
    },
    canManage: (resource: string): boolean => {
      if (!isSubAccount) return true;
      const permissionKey = `can_manage_${resource}` as keyof typeof permissions;
      return permissions[permissionKey] ?? false;
    },
  };
};
