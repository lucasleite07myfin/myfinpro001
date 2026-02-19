import { createClient } from "npm:@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Mensagens centralizadas (copiadas de src/data/notificationMessages.ts)
const messages = {
  exceeded: {
    title: "⚠️ ALERTA: Limite de Gastos Excedido",
    message: `⚠️ ALERTA: Você excedeu seu limite de gastos!

Gastos do mês: {total_spent}
Limite configurado: {spending_limit}
Excedido em: {exceeded_amount} ({exceeded_percent}%)

💡 Dica: Revise seus gastos e considere ajustar seu orçamento para o próximo mês.`,
    
    whatsapp: `🚨 *Atenção {user_name}!*

Você excedeu seu limite de gastos mensal.

📊 *Resumo:*
• Gastou: *{total_spent}*
• Limite: {spending_limit}
• Excedente: *{exceeded_amount}* ({exceeded_percent}%)

É hora de revisar seus gastos! 💰`
  },
  
  warning_75: {
    title: "⚠️ Atenção: 75% do Limite Atingido",
    message: `⚠️ Você atingiu 75% do seu limite de gastos!

Gastos até agora: {total_spent}
Limite configurado: {spending_limit}
Ainda disponível: {remaining_amount}

💡 Dica: Você está no caminho certo, mas fique atento aos próximos gastos.`,
    
    whatsapp: `⚠️ *Atenção {user_name}!*

Você já gastou 75% do seu limite mensal.

📊 *Status:*
• Gastou: {total_spent}
• Limite: {spending_limit}
• Disponível: {remaining_amount}

Fique atento aos próximos gastos! 👀`
  },
  
  warning_90: {
    title: "🚨 Alerta: 90% do Limite Atingido",
    message: `🚨 ATENÇÃO: Você atingiu 90% do seu limite de gastos!

Gastos até agora: {total_spent}
Limite configurado: {spending_limit}
Ainda disponível: {remaining_amount}

⚠️ Você está próximo de exceder seu limite. Controle seus gastos!`,
    
    whatsapp: `🚨 *ATENÇÃO {user_name}!*

Você já gastou 90% do seu limite mensal!

📊 *Status Crítico:*
• Gastou: {total_spent}
• Limite: {spending_limit}
• Disponível: {remaining_amount}

🛑 Controle urgente necessário!`
  }
};

// Função para formatar moeda
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

// Função para formatar mensagem substituindo placeholders
function formatMessage(template: string, data: Record<string, any>): string {
  let message = template;
  
  Object.keys(data).forEach(key => {
    const placeholder = `{${key}}`;
    const value = data[key];
    
    if (typeof value === 'number' && (
      key.includes('amount') || 
      key.includes('spent') || 
      key.includes('limit')
    )) {
      message = message.replace(placeholder, formatCurrency(value));
    } else {
      message = message.replace(placeholder, String(value));
    }
  });
  
  return message;
}

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

        // Determinar tipo de alerta
        let alertType = null;
        let messageTemplate = null;
        
        if (totalSpent > limit) {
          alertType = 'spending_limit_exceeded';
          messageTemplate = messages.exceeded;
        } else if (percentUsed >= 90) {
          alertType = 'spending_limit_warning_90';
          messageTemplate = messages.warning_90;
        } else if (percentUsed >= 75) {
          alertType = 'spending_limit_warning_75';
          messageTemplate = messages.warning_75;
        }

        // Enviar notificação se houver alerta
        if (alertType && messageTemplate) {
          const exceededAmount = totalSpent - limit;
          const exceededPercent = percentUsed - 100;
          const remainingAmount = limit - totalSpent;

          // Get user email
          const { data: userData } = await supabase.auth.admin.getUserById(profile.id);
          const userEmail = userData?.user?.email || 'N/A';

          // Dados para substituir nos placeholders
          const messageData = {
            user_name: profile.full_name || 'Usuário',
            total_spent: totalSpent,
            spending_limit: limit,
            exceeded_amount: exceededAmount > 0 ? exceededAmount : 0,
            exceeded_percent: exceededPercent.toFixed(1),
            remaining_amount: remainingAmount > 0 ? remainingAmount : 0,
            percent_used: percentUsed.toFixed(1),
            month: currentMonth
          };

          const payload = {
            alert_type: alertType,
            user_id: profile.id,
            user_name: profile.full_name || 'Usuário',
            user_email: userEmail,
            month: currentMonth,
            total_spent: totalSpent,
            spending_limit: limit,
            exceeded_amount: exceededAmount > 0 ? exceededAmount : 0,
            exceeded_percent: exceededPercent.toFixed(1),
            remaining_amount: remainingAmount > 0 ? remainingAmount : 0,
            percent_used: percentUsed.toFixed(1),
            // Mensagens formatadas
            message: formatMessage(messageTemplate.message, messageData),
            message_whatsapp: formatMessage(messageTemplate.whatsapp, messageData),
            title: messageTemplate.title
          };

          console.log(`Sending webhook for user ${profile.id} - Alert: ${alertType}`);

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
