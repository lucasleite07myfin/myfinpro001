import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mensagens centralizadas (copiadas de src/data/notificationMessages.ts)
const messages = {
  due_soon: {
    title: "🔔 Despesas Recorrentes Próximas",
    message: `🔔 Você tem {count} despesa(s) vencendo em breve!

Total a pagar: {total_amount}

📋 PRÓXIMAS DESPESAS:
{expenses_list}

💡 Organize-se para evitar atrasos!`,

    whatsapp: `🔔 *Lembrete {user_name}!*

Você tem {count} despesa(s) vencendo em breve.

💰 Total: *{total_amount}*

📋 *Despesas:*
{expenses_list}

Não esqueça de pagar! 📅`
  },

  due_today: {
    title: "⏰ Despesa Vence HOJE!",
    message: `⏰ URGENTE: Despesa vence HOJE!

{description}
Valor: {amount}
Vencimento: HOJE

Pague agora para evitar juros e multas!`,

    whatsapp: `⏰ *URGENTE {user_name}!*

Despesa vence *HOJE*:

📌 {description}
💰 Valor: *{amount}*
📅 Vencimento: *HOJE*

Pague agora! 🚨`
  },

  overdue: {
    title: "🚨 Despesas VENCIDAS!",
    message: `🚨 ATENÇÃO: Você tem despesas vencidas!

{count} despesa(s) em atraso
Total: {total_amount}

📋 DESPESAS VENCIDAS:
{expenses_list}

⚠️ Regularize urgentemente para evitar mais juros!`,

    whatsapp: `🚨 *URGENTE {user_name}!*

Você tem {count} despesa(s) *VENCIDA(S)*!

💰 Total: *{total_amount}*

📋 *Em atraso:*
{expenses_list}

Regularize urgente! ⚠️`
  }
};

// Função para formatar moeda
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

// Função para formatar data
function formatDate(date: string): string {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

// Função para formatar lista de despesas
function formatExpensesList(expenses: any[], format: 'simple' | 'detailed' = 'simple'): string {
  return expenses
    .map(exp => {
      const urgency = exp.days_until_due === 0 
        ? 'HOJE' 
        : exp.days_until_due === 1 
          ? 'AMANHÃ'
          : `${exp.days_until_due} dias`;
      
      return `• ${exp.description}: ${formatCurrency(exp.amount)} (${urgency})`;
    })
    .join('\n');
}

// Função para formatar mensagem
function formatMessage(template: string, data: Record<string, any>): string {
  let message = template;
  
  Object.keys(data).forEach(key => {
    const placeholder = `{${key}}`;
    message = message.replace(placeholder, String(data[key]));
  });
  
  return message;
}

// Função para determinar nível de urgência
function getUrgencyLevel(daysUntil: number): { emoji: string; text: string; level: string } {
  if (daysUntil < 0) {
    return { emoji: '🚨', text: 'VENCIDA', level: 'overdue' };
  } else if (daysUntil === 0) {
    return { emoji: '⏰', text: 'VENCE HOJE', level: 'due_today' };
  } else if (daysUntil === 1) {
    return { emoji: '⚠️', text: 'VENCE AMANHÃ', level: 'due_soon' };
  } else if (daysUntil <= 3) {
    return { emoji: '🔔', text: `VENCE EM ${daysUntil} DIAS`, level: 'due_soon' };
  } else {
    return { emoji: '📅', text: `VENCE EM ${daysUntil} DIAS`, level: 'due_soon' };
  }
}

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

      // Filtrar despesas que vencem nos próximos X dias ou estão vencidas
      const upcomingExpenses = expenses
        .map(expense => {
          const dueDay = expense.due_day;
          let dueDate = new Date(currentYear, currentMonth, dueDay);
          
          // Se o dia já passou no mês atual, considerar o próximo mês
          if (dueDay < currentDay) {
            dueDate = new Date(currentYear, currentMonth + 1, dueDay);
          }

          const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          const urgency = getUrgencyLevel(daysUntilDue);

          return {
            ...expense,
            days_until_due: daysUntilDue,
            due_date: dueDate.toISOString().split('T')[0],
            urgency: urgency
          };
        })
        .filter(expense => 
          expense.days_until_due >= -7 && // Incluir despesas vencidas há até 7 dias
          expense.days_until_due <= daysBeforeNotification
        )
        .sort((a, b) => a.days_until_due - b.days_until_due);

      if (upcomingExpenses.length === 0) {
        console.log(`No upcoming expenses for user ${profile.id}`);
        continue;
      }

      // Buscar email do usuário
      const { data: userData } = await supabase.auth.admin.getUserById(profile.id);

      // Agrupar despesas por nível de urgência
      const overdueExpenses = upcomingExpenses.filter(e => e.days_until_due < 0);
      const dueTodayExpenses = upcomingExpenses.filter(e => e.days_until_due === 0);
      const dueSoonExpenses = upcomingExpenses.filter(e => e.days_until_due > 0);

      // Determinar mensagem principal baseada na urgência mais alta
      let messageTemplate = messages.due_soon;
      let alertType = 'recurring_expenses_due_soon';

      if (overdueExpenses.length > 0) {
        messageTemplate = messages.overdue;
        alertType = 'recurring_expenses_overdue';
      } else if (dueTodayExpenses.length > 0) {
        messageTemplate = messages.due_today;
        alertType = 'recurring_expenses_due_today';
      }

      const totalAmount = upcomingExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
      const expensesList = formatExpensesList(upcomingExpenses);

      // Dados para substituir nos placeholders
      const messageData = {
        user_name: profile.full_name || 'Usuário',
        count: upcomingExpenses.length,
        total_amount: formatCurrency(totalAmount),
        expenses_list: expensesList,
        description: dueTodayExpenses.length > 0 ? dueTodayExpenses[0].description : '',
        amount: dueTodayExpenses.length > 0 ? formatCurrency(dueTodayExpenses[0].amount) : ''
      };

      // Preparar payload para n8n
      const payload = {
        alert_type: alertType,
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
          payment_method: exp.payment_method,
          urgency_level: exp.urgency.level,
          urgency_text: exp.urgency.text,
          urgency_emoji: exp.urgency.emoji
        })),
        total_amount: totalAmount,
        notification_date: today.toISOString().split('T')[0],
        days_before_notification: daysBeforeNotification,
        overdue_count: overdueExpenses.length,
        due_today_count: dueTodayExpenses.length,
        due_soon_count: dueSoonExpenses.length,
        // Mensagens formatadas
        message: formatMessage(messageTemplate.message, messageData),
        message_whatsapp: formatMessage(messageTemplate.whatsapp, messageData),
        title: messageTemplate.title
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
