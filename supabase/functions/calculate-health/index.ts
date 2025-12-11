import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HealthCalculation {
  userId: string;
  snapshotDate: string;
  savingsRatePct: number;
  debtIncomePct: number;
  monthsEmergencyFund: number;
  netWorthGrowth12m: number;
  totalIncome: number;
  totalExpense: number;
  totalDebt: number;
  totalAssets: number;
  emergencyFund: number;
  avgMonthlyExpense: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { mode, userId } = await req.json();
    
    console.log('Calculate health called:', { mode, userId });

    // Se for chamada autenticada de usuário único
    if (mode === 'single_user') {
      const authHeader = req.headers.get('Authorization')!;
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        throw new Error('Unauthorized');
      }

      await calculateUserHealth(supabase, user.id);
      
      return new Response(
        JSON.stringify({ success: true, message: 'Health calculated successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Se for chamada para todos os usuários (cron job)
    if (mode === 'all_users') {
      const { data: users, error } = await supabase.auth.admin.listUsers();
      
      if (error) throw error;

      const results = [];
      for (const user of users.users) {
        try {
          await calculateUserHealth(supabase, user.id);
          results.push({ userId: user.id, success: true });
        } catch (err) {
          console.error(`Error calculating health for user ${user.id}:`, err);
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          results.push({ userId: user.id, success: false, error: errorMessage });
        }
      }

      return new Response(
        JSON.stringify({ success: true, processed: results.length, results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid mode');

  } catch (error) {
    console.error('Error in calculate-health:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function calculateUserHealth(supabase: any, userId: string) {
  console.log('Calculating health for user:', userId);

  // Determinar período de cálculo (últimos 12 meses)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 12);

  // Calcular para modo pessoal
  const personalHealth = await calculateHealthForMode(supabase, userId, 'personal', startDate, endDate);
  if (personalHealth) {
    await saveHealthSnapshot(supabase, userId, personalHealth, 'health_snapshots');
  }

  // Calcular para modo empresa
  const businessHealth = await calculateHealthForMode(supabase, userId, 'business', startDate, endDate);
  if (businessHealth) {
    await saveHealthSnapshot(supabase, userId, businessHealth, 'emp_health_snapshots');
  }
}

async function calculateHealthForMode(
  supabase: any,
  userId: string,
  mode: 'personal' | 'business',
  startDate: Date,
  endDate: Date
): Promise<HealthCalculation | null> {
  
  const transactionsTable = mode === 'personal' ? 'transactions' : 'emp_transactions';
  const assetsTable = mode === 'personal' ? 'assets' : 'emp_assets';
  const liabilitiesTable = mode === 'personal' ? 'liabilities' : 'emp_liabilities';

  // Buscar transações dos últimos 12 meses
  const { data: transactions, error: txError } = await supabase
    .from(transactionsTable)
    .select('*')
    .eq('user_id', userId)
    .gte('date', startDate.toISOString().split('T')[0])
    .lte('date', endDate.toISOString().split('T')[0]);

  if (txError) {
    console.error(`Error fetching ${transactionsTable}:`, txError);
    return null;
  }

  // Buscar ativos
  const { data: assets, error: assetsError } = await supabase
    .from(assetsTable)
    .select('*')
    .eq('user_id', userId);

  if (assetsError) {
    console.error(`Error fetching ${assetsTable}:`, assetsError);
    return null;
  }

  // Buscar passivos
  const { data: liabilities, error: liabilitiesError } = await supabase
    .from(liabilitiesTable)
    .select('*')
    .eq('user_id', userId);

  if (liabilitiesError) {
    console.error(`Error fetching ${liabilitiesTable}:`, liabilitiesError);
    return null;
  }

  // Se não houver dados suficientes, não calcular
  if (!transactions || transactions.length === 0) {
    console.log(`No transactions found for user ${userId} in mode ${mode}`);
    return null;
  }

  // Calcular totais
  const totalIncome = transactions
    .filter((t: any) => t.type === 'income')
    .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

  const totalExpense = transactions
    .filter((t: any) => t.type === 'expense')
    .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

  const totalAssets = (assets || []).reduce((sum: number, a: any) => sum + Number(a.value), 0);
  const totalDebt = (liabilities || []).reduce((sum: number, l: any) => sum + Number(l.value), 0);

  // Identificar ativos líquidos para reserva de emergência
  // CORREÇÃO: Usar tipos de ativos em português conforme definido no sistema
  const liquidAssetTypes = ['Conta Bancária', 'Investimento', 'Cripto'];
  const emergencyFund = (assets || [])
    .filter((a: any) => liquidAssetTypes.includes(a.type))
    .reduce((sum: number, a: any) => sum + Number(a.value), 0);

  // Calcular despesa média mensal
  const avgMonthlyExpense = totalExpense / 12;

  // 1. Taxa de Poupança = (Receita - Despesa) / Receita × 100
  const savingsRatePct = totalIncome > 0 
    ? ((totalIncome - totalExpense) / totalIncome) * 100 
    : 0;

  // 2. Índice de Endividamento = Total Dívidas / Renda Mensal × 100
  const monthlyIncome = totalIncome / 12;
  const debtIncomePct = monthlyIncome > 0 
    ? (totalDebt / monthlyIncome) * 100 
    : 0;

  // 3. Reserva de Emergência = Reserva / Despesa Média Mensal (em meses)
  const monthsEmergencyFund = avgMonthlyExpense > 0 
    ? emergencyFund / avgMonthlyExpense 
    : 0;

  // 4. Crescimento Patrimonial (comparar com snapshot anterior)
  const { data: previousSnapshot } = await supabase
    .from(mode === 'personal' ? 'health_snapshots' : 'emp_health_snapshots')
    .select('total_assets, total_debt')
    .eq('user_id', userId)
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .single();

  let netWorthGrowth12m = 0;
  const currentNetWorth = totalAssets - totalDebt;
  
  if (previousSnapshot) {
    const previousNetWorth = Number(previousSnapshot.total_assets) - Number(previousSnapshot.total_debt);
    netWorthGrowth12m = previousNetWorth > 0 
      ? ((currentNetWorth - previousNetWorth) / previousNetWorth) * 100 
      : 0;
  }

  return {
    userId,
    snapshotDate: endDate.toISOString().split('T')[0],
    savingsRatePct: Math.round(savingsRatePct * 100) / 100,
    debtIncomePct: Math.round(debtIncomePct * 100) / 100,
    monthsEmergencyFund: Math.round(monthsEmergencyFund * 100) / 100,
    netWorthGrowth12m: Math.round(netWorthGrowth12m * 100) / 100,
    totalIncome: Math.round(totalIncome * 100) / 100,
    totalExpense: Math.round(totalExpense * 100) / 100,
    totalDebt: Math.round(totalDebt * 100) / 100,
    totalAssets: Math.round(totalAssets * 100) / 100,
    emergencyFund: Math.round(emergencyFund * 100) / 100,
    avgMonthlyExpense: Math.round(avgMonthlyExpense * 100) / 100,
  };
}

async function saveHealthSnapshot(
  supabase: any,
  userId: string,
  health: HealthCalculation,
  tableName: string
) {
  const { error } = await supabase
    .from(tableName)
    .upsert({
      user_id: userId,
      snapshot_date: health.snapshotDate,
      savings_rate_pct: health.savingsRatePct,
      debt_income_pct: health.debtIncomePct,
      months_emergency_fund: health.monthsEmergencyFund,
      net_worth_growth_12m: health.netWorthGrowth12m,
      total_income: health.totalIncome,
      total_expense: health.totalExpense,
      total_debt: health.totalDebt,
      total_assets: health.totalAssets,
      emergency_fund: health.emergencyFund,
      avg_monthly_expense: health.avgMonthlyExpense,
    }, {
      onConflict: 'user_id,snapshot_date'
    });

  if (error) {
    console.error(`Error saving to ${tableName}:`, error);
    throw error;
  }

  console.log(`Health snapshot saved to ${tableName} for user ${userId}`);
}
