import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting spending limit check...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Get current month in YYYY-MM format
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    console.log('Current month:', currentMonth);

    // Fetch profiles with webhooks configured and spending limits
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, n8n_webhook_url, monthly_spending_limit, full_name')
      .not('n8n_webhook_url', 'is', null)
      .not('monthly_spending_limit', 'is', null);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw profilesError;
    }

    console.log(`Found ${profiles?.length || 0} profiles with webhooks and spending limits`);

    let notificationsSent = 0;

    // Check spending for each profile
    for (const profile of profiles || []) {
      try {
        // Calculate total expenses for current month
        const { data: transactions, error: transactionsError } = await supabase
          .from('emp_transactions')
          .select('amount')
          .eq('user_id', profile.id)
          .eq('type', 'expense')
          .gte('date', `${currentMonth}-01`)
          .lt('date', `${now.getFullYear()}-${String(now.getMonth() + 2).padStart(2, '0')}-01`);

        if (transactionsError) {
          console.error(`Error fetching transactions for user ${profile.id}:`, transactionsError);
          continue;
        }

        const totalSpent = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
        const limit = Number(profile.monthly_spending_limit);
        const percentUsed = (totalSpent / limit) * 100;

        console.log(`User ${profile.id} - Spent: R$ ${totalSpent.toFixed(2)}, Limit: R$ ${limit.toFixed(2)}, Percent: ${percentUsed.toFixed(1)}%`);

        // Send notification if spending exceeds 100% of limit
        if (totalSpent > limit) {
          const exceededAmount = totalSpent - limit;
          const exceededPercent = percentUsed - 100;

          // Get user email
          const { data: userData } = await supabase.auth.admin.getUserById(profile.id);
          const userEmail = userData?.user?.email || 'N/A';

          const payload = {
            alert_type: 'spending_limit_exceeded',
            user_id: profile.id,
            user_name: profile.full_name || 'Usuário',
            user_email: userEmail,
            month: currentMonth,
            total_spent: totalSpent,
            spending_limit: limit,
            exceeded_amount: exceededAmount,
            exceeded_percent: exceededPercent.toFixed(1),
            message: `⚠️ ALERTA: Você excedeu seu limite de gastos!\n\nGastos do mês: R$ ${totalSpent.toFixed(2)}\nLimite configurado: R$ ${limit.toFixed(2)}\nExcedido em: R$ ${exceededAmount.toFixed(2)} (${exceededPercent.toFixed(1)}%)`
          };

          console.log(`Sending webhook for user ${profile.id} - exceeded by R$ ${exceededAmount.toFixed(2)}`);

          const webhookResponse = await fetch(profile.n8n_webhook_url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });

          if (webhookResponse.ok) {
            console.log(`Webhook sent successfully for user ${profile.id}`);
            notificationsSent++;
          } else {
            console.error(`Failed to send webhook for user ${profile.id}:`, await webhookResponse.text());
          }
        }
      } catch (error) {
        console.error(`Error processing user ${profile.id}:`, error);
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Spending limit check completed',
        notifications_sent: notificationsSent,
        profiles_checked: profiles?.length || 0,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in check-spending-limit:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
