import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RegisterBiometricRequest {
  user_id: string;
  credential_id: string;
  public_key: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    // Verify JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { user_id, credential_id, public_key }: RegisterBiometricRequest = await req.json();

    // Verify user_id matches authenticated user
    if (user_id !== user.id) {
      throw new Error('User ID mismatch');
    }

    console.log('Registering biometric for user:', user_id);

    // Update profile with biometric credentials
    const { data: updateData, error: updateError } = await supabaseClient
      .from('profiles')
      .update({
        biometric_credential_id: credential_id,
        biometric_public_key: public_key,
        biometric_enabled: true,
      })
      .eq('id', user_id)
      .select();

    if (updateError) {
      console.error('Error updating profile:', updateError);
      console.error('Update error details:', JSON.stringify(updateError, null, 2));
      console.error('User ID:', user_id);
      console.error('Credential ID length:', credential_id?.length);
      throw updateError;
    }

    console.log('Update successful, rows affected:', updateData?.length || 0);
    if (!updateData || updateData.length === 0) {
      console.warn('No rows were updated! User may not exist in profiles table.');
    }

    console.log('Biometric registered successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Biometric credentials registered successfully' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in register-biometric function:', error);
    const errorMessage = (error as Error).message || 'Internal server error';
    return new Response(
      JSON.stringify({ 
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: errorMessage === 'Unauthorized' ? 401 : 500,
      }
    );
  }
});