import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/contexts/UserContext';
import { logger } from '@/utils/logger';

interface BusinessPermissions {
  can_view_transactions: boolean;
  can_create_transactions: boolean;
  can_edit_transactions: boolean;
  can_delete_transactions: boolean;
  can_view_investments: boolean;
  can_manage_investments: boolean;
  can_view_suppliers: boolean;
  can_manage_suppliers: boolean;
  can_view_dre: boolean;
  can_view_cashflow: boolean;
}

interface SubAccountContextType {
  isSubAccount: boolean;
  ownerId: string | null;
  permissions: BusinessPermissions;
  loading: boolean;
}

const defaultPermissions: BusinessPermissions = {
  can_view_transactions: false,
  can_create_transactions: false,
  can_edit_transactions: false,
  can_delete_transactions: false,
  can_view_investments: false,
  can_manage_investments: false,
  can_view_suppliers: false,
  can_manage_suppliers: false,
  can_view_dre: false,
  can_view_cashflow: false,
};

const SubAccountContext = createContext<SubAccountContextType>({
  isSubAccount: false,
  ownerId: null,
  permissions: defaultPermissions,
  loading: true,
});

export const useSubAccount = () => {
  const context = useContext(SubAccountContext);
  if (!context) {
    throw new Error('useSubAccount must be used within a SubAccountProvider');
  }
  return context;
};

interface SubAccountProviderProps {
  children: ReactNode;
}

export const SubAccountProvider: React.FC<SubAccountProviderProps> = ({ children }) => {
  const { user } = useUser();
  const [state, setState] = useState<SubAccountContextType>({
    isSubAccount: false,
    ownerId: null,
    permissions: defaultPermissions,
    loading: true,
  });

  useEffect(() => {
    let mounted = true;

    const loadSubAccountData = async () => {
      if (!user) {
        if (mounted) {
          setState({
            isSubAccount: false,
            ownerId: null,
            permissions: defaultPermissions,
            loading: false,
          });
        }
        return;
      }

      try {
        const { data, error } = await supabase
          .from('business_sub_accounts')
          .select('*')
          .eq('sub_user_id', user.id)
          .eq('is_active', true)
          .abortSignal(AbortSignal.timeout(5000))
          .maybeSingle();

        if (error) {
          logger.error('Erro ao carregar sub-account:', error);
          // Continue mesmo com erro, não trave o app
          if (mounted) {
            setState({
              isSubAccount: false,
              ownerId: null,
              permissions: defaultPermissions,
              loading: false,
            });
          }
          return;
        }

        if (mounted) {
          if (data) {
            setState({
              isSubAccount: true,
              ownerId: data.owner_id,
              permissions: {
                can_view_transactions: data.can_view_transactions,
                can_create_transactions: data.can_create_transactions,
                can_edit_transactions: data.can_edit_transactions,
                can_delete_transactions: data.can_delete_transactions,
                can_view_investments: data.can_view_investments,
                can_manage_investments: data.can_manage_investments,
                can_view_suppliers: data.can_view_suppliers,
                can_manage_suppliers: data.can_manage_suppliers,
                can_view_dre: data.can_view_dre,
                can_view_cashflow: data.can_view_cashflow,
              },
              loading: false,
            });
          } else {
            setState({
              isSubAccount: false,
              ownerId: null,
              permissions: defaultPermissions,
              loading: false,
            });
          }
        }
      } catch (error) {
        logger.error('Erro ao carregar dados de sub-account:', error);
        if (mounted) {
          setState({
            isSubAccount: false,
            ownerId: null,
            permissions: defaultPermissions,
            loading: false,
          });
        }
      }
    };

    loadSubAccountData();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  return (
    <SubAccountContext.Provider value={state}>
      {children}
    </SubAccountContext.Provider>
  );
};
