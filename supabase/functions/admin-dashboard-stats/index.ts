import { createClient } from "npm:@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
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

    console.log('Fetching admin dashboard stats...');

    // Buscar estatísticas em paralelo - using aggregation for transactions (privacy)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [usersResponse, subscriptionsData, couponsData, totalTxCount, recentIncomeTx] = await Promise.all([
      adminClient.auth.admin.listUsers(),
      adminClient.from('subscriptions').select('status'),
      adminClient.from('discount_coupons').select('is_active'),
      adminClient.from('transactions').select('id', { count: 'exact', head: true }),
      adminClient.from('transactions')
        .select('amount')
        .eq('type', 'income')
        .gte('created_at', thirtyDaysAgo.toISOString())
    ]);

    if (usersResponse.error) throw usersResponse.error;

    const users = usersResponse.data.users;
    const subscriptions = subscriptionsData.data || [];
    const coupons = couponsData.data || [];

    // Calcular estatísticas
    const totalUsers = users.length;
    const activeSubscriptions = subscriptions.filter(s => s.status === 'active').length;
    const trialingSubscriptions = subscriptions.filter(s => s.status === 'trialing').length;
    const canceledSubscriptions = subscriptions.filter(s => s.status === 'canceled').length;

    const monthlyRevenue = (recentIncomeTx.data || [])
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalTransactions = totalTxCount.count || 0;
    const activeCoupons = coupons.filter(c => c.is_active).length;

    // Taxa de conversão
    const conversionRate = totalUsers > 0 
      ? ((activeSubscriptions / totalUsers) * 100).toFixed(1)
      : '0.0';

    const stats = {
      users: {
        total: totalUsers,
        active: users.filter(u => u.last_sign_in_at).length,
        new_this_month: users.filter(u => {
          const createdAt = new Date(u.created_at);
          const now = new Date();
          return createdAt.getMonth() === now.getMonth() && 
                 createdAt.getFullYear() === now.getFullYear();
        }).length
      },
      subscriptions: {
        total: subscriptions.length,
        active: activeSubscriptions,
        trialing: trialingSubscriptions,
        canceled: canceledSubscriptions
      },
      coupons: {
        total: coupons.length,
        active: activeCoupons
      },
      financial: {
        monthly_revenue: monthlyRevenue,
        total_transactions: totalTransactions,
        conversion_rate: conversionRate
      }
    };

    console.log('Dashboard stats fetched successfully');

    return new Response(
      JSON.stringify(stats),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in admin-dashboard-stats:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
