import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AddAdminRequest {
  email: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create Supabase client with service role key for elevated permissions
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { email }: AddAdminRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Adding admin role for email: ${email}`);

    // 1. Find user by email
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error('Error fetching users:', userError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user', details: userError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const user = userData.users.find(u => u.email === email);

    if (!user) {
      return new Response(
        JSON.stringify({ error: `User with email ${email} not found` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found user with id: ${user.id}`);

    // 2. Insert admin role (using service role key bypasses RLS)
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: user.id,
        role: 'admin'
      })
      .select()
      .single();

    if (roleError) {
      // Check if it's a unique constraint violation (user already has admin role)
      if (roleError.code === '23505') {
        console.log('User already has admin role');
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'User already has admin role',
            user_id: user.id,
            email: email
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.error('Error inserting role:', roleError);
      return new Response(
        JSON.stringify({ error: 'Failed to add admin role', details: roleError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Admin role added successfully:', roleData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Admin role added successfully',
        user_id: user.id,
        email: email,
        role: roleData
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
