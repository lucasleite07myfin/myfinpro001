import { supabase } from '@/integrations/supabase/client';

export const addAdminRole = async (email: string) => {
  const { data, error } = await supabase.functions.invoke('add-admin', {
    body: { email }
  });

  if (error) {
    console.error('Error adding admin role:', error);
    throw error;
  }

  console.log('Admin role added:', data);
  return data;
};

// Execute immediately to add the admin
addAdminRole('leite.07@hotmail.com')
  .then((result) => {
    console.log('✅ Admin added successfully:', result);
  })
  .catch((error) => {
    console.error('❌ Failed to add admin:', error);
  });
