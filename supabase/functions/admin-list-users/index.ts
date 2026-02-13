import { createClient } from "npm:@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar cliente com anon key para verificar o usuário
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verificar usuário autenticado
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se é admin
    const { data: roleData } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) {
      console.log(`Unauthorized access attempt by user ${user.id}`);
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar cliente admin com service role
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Fetching users list...');

    // Buscar usuários
    const { data: usersResponse, error: usersError } = await adminClient.auth.admin.listUsers();
    if (usersError) throw usersError;

    const users = usersResponse.users;

    // Buscar assinaturas e roles em paralelo
    const [subscriptionsData, rolesData] = await Promise.all([
      adminClient.from('subscriptions').select('user_id, status'),
      adminClient.from('user_roles').select('user_id, role')
    ]);

    const subscriptions = subscriptionsData.data || [];
    const roles = rolesData.data || [];

    // Criar mapa de assinaturas e roles
    const subscriptionMap = new Map(
      subscriptions.map(s => [s.user_id, s.status])
    );
    const roleMap = new Map(
      roles.map(r => [r.user_id, r.role])
    );

    // Combinar dados
    const usersList = users.map(u => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      subscription_status: subscriptionMap.get(u.id) || 'inactive',
      role: roleMap.get(u.id) || 'user',
      is_admin: roleMap.get(u.id) === 'admin'
    }));

    console.log(`Fetched ${usersList.length} users successfully`);

    return new Response(
      JSON.stringify({ users: usersList }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in admin-list-users:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
