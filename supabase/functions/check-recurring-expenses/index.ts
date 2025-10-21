import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting recurring expenses check...');

    // Buscar todos os perfis com webhook configurado
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, n8n_webhook_url, notification_days_before')
      .not('n8n_webhook_url', 'is', null)
      .not('n8n_webhook_url', 'eq', '');

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw profilesError;
    }

    if (!profiles || profiles.length === 0) {
      console.log('No profiles with webhook configured');
      return new Response(
        JSON.stringify({ message: 'No profiles with webhook configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${profiles.length} profiles with webhooks configured`);

    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    let notificationsSent = 0;

    // Processar cada perfil
    for (const profile of profiles) {
      const daysBeforeNotification = profile.notification_days_before || 3;

      // Buscar despesas recorrentes não pagas do usuário
      const { data: expenses, error: expensesError } = await supabase
        .from('recurring_expenses')
        .select('*')
        .eq('user_id', profile.id)
        .eq('is_paid', false);

      if (expensesError) {
        console.error(`Error fetching expenses for user ${profile.id}:`, expensesError);
        continue;
      }

      if (!expenses || expenses.length === 0) {
        console.log(`No unpaid expenses for user ${profile.id}`);
        continue;
      }

      // Filtrar despesas que vencem nos próximos X dias
      const upcomingExpenses = expenses
        .map(expense => {
          const dueDay = expense.due_day;
          let dueDate = new Date(currentYear, currentMonth, dueDay);
          
          // Se o dia já passou no mês atual, considerar o próximo mês
          if (dueDay < currentDay) {
            dueDate = new Date(currentYear, currentMonth + 1, dueDay);
          }

          const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

          return {
            ...expense,
            days_until_due: daysUntilDue,
            due_date: dueDate.toISOString().split('T')[0]
          };
        })
        .filter(expense => 
          expense.days_until_due >= 0 && 
          expense.days_until_due <= daysBeforeNotification
        )
        .sort((a, b) => a.days_until_due - b.days_until_due);

      if (upcomingExpenses.length === 0) {
        console.log(`No upcoming expenses for user ${profile.id}`);
        continue;
      }

      // Buscar email do usuário
      const { data: userData } = await supabase.auth.admin.getUserById(profile.id);

      // Preparar payload para n8n
      const payload = {
        user_id: profile.id,
        user_name: profile.full_name,
        user_email: userData?.user?.email || '',
        expenses: upcomingExpenses.map(exp => ({
          description: exp.description,
          amount: exp.amount,
          due_day: exp.due_day,
          due_date: exp.due_date,
          days_until_due: exp.days_until_due,
          category: exp.category,
          payment_method: exp.payment_method
        })),
        total_amount: upcomingExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0),
        notification_date: today.toISOString().split('T')[0],
        days_before_notification: daysBeforeNotification
      };

      console.log(`Sending webhook for user ${profile.id} with ${upcomingExpenses.length} expenses`);

      // Enviar webhook para n8n
      try {
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
          console.error(`Failed to send webhook for user ${profile.id}: ${webhookResponse.status}`);
        }
      } catch (webhookError) {
        console.error(`Error sending webhook for user ${profile.id}:`, webhookError);
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Check completed',
        profiles_checked: profiles.length,
        notifications_sent: notificationsSent
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in check-recurring-expenses:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
