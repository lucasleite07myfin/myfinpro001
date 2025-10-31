import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BiometricAuthRequest {
  credential_id: string;
  email: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { credential_id, email }: BiometricAuthRequest = await req.json();

    console.log('Authenticating biometric for email:', email);

    // Find user by email and verify credential
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('id, biometric_credential_id, biometric_enabled')
      .eq('id', (
        await supabaseClient
          .from('profiles')
          .select('id')
          .limit(1)
          .single()
      ).data?.id ?? '')
      .single();

    // Get user by email from auth
    const { data: { users }, error: usersError } = await supabaseClient.auth.admin.listUsers();
    
    if (usersError) {
      console.error('Error listing users:', usersError);
      throw new Error('Failed to find user');
    }

    const user = users.find(u => u.email === email);
    
    if (!user) {
      console.error('User not found');
      throw new Error('User not found');
    }

    // Get profile for this user
    const { data: userProfile, error: userProfileError } = await supabaseClient
      .from('profiles')
      .select('biometric_credential_id, biometric_enabled')
      .eq('id', user.id)
      .single();

    if (userProfileError || !userProfile) {
      console.error('Profile not found:', userProfileError);
      throw new Error('Biometric not configured');
    }

    if (!userProfile.biometric_enabled) {
      console.error('Biometric not enabled for user');
      throw new Error('Biometric authentication not enabled');
    }

    // Verify credential ID matches
    if (userProfile.biometric_credential_id !== credential_id) {
      console.error('Credential ID mismatch');
      throw new Error('Invalid biometric credential');
    }

    console.log('Credential verified, generating session...');

    // Generate session token for the user
    const { data: sessionData, error: sessionError } = await supabaseClient.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
    });

    if (sessionError || !sessionData) {
      console.error('Error generating session:', sessionError);
      throw new Error('Failed to generate session');
    }

    console.log('Session generated successfully');

    return new Response(
      JSON.stringify({
        access_token: sessionData.properties.hashed_token,
        user: {
          id: user.id,
          email: user.email,
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in biometric-auth function:', error);
    return new Response(
      JSON.stringify({
        error: (error as Error).message || 'Authentication failed'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      }
    );
  }
});