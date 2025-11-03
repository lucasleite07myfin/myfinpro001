import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

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

    console.log('Fetching subscriptions list...');

    // Buscar assinaturas e usuários em paralelo
    const [subscriptionsData, usersResponse] = await Promise.all([
      adminClient.from('subscriptions').select('*'),
      adminClient.auth.admin.listUsers()
    ]);

    if (usersResponse.error) throw usersResponse.error;

    const subscriptions = subscriptionsData.data || [];
    const users = usersResponse.data.users;

    // Criar mapa de emails
    const emailMap = new Map(
      users.map(u => [u.id, u.email])
    );

    // Combinar dados
    const subscriptionsList = subscriptions.map(s => ({
      ...s,
      user_email: emailMap.get(s.user_id) || 'N/A'
    }));

    // Calcular estatísticas
    const stats = {
      total: subscriptions.length,
      active: subscriptions.filter(s => s.status === 'active').length,
      trialing: subscriptions.filter(s => s.status === 'trialing').length,
      canceled: subscriptions.filter(s => s.status === 'canceled').length,
      inactive: subscriptions.filter(s => s.status === 'inactive').length
    };

    console.log(`Fetched ${subscriptionsList.length} subscriptions successfully`);

    return new Response(
      JSON.stringify({ subscriptions: subscriptionsList, stats }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in admin-list-subscriptions:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
