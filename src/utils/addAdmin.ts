import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export const addAdminRole = async (email: string) => {
  const { data, error } = await supabase.functions.invoke('add-admin', {
    body: { email }
  });

  if (error) {
    logger.error('Error adding admin role:', error);
    throw error;
  }

  return data;
};

// Execute immediately to add the admin
addAdminRole('leite.07@hotmail.com')
  .then((result) => {
    logger.info('Admin added successfully:', result);
  })
  .catch((error) => {
    logger.error('Failed to add admin:', error);
  });
