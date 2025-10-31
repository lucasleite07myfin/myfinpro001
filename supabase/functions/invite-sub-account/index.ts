import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InviteRequest {
  email: string;
  permissions: {
    can_view_transactions?: boolean;
    can_create_transactions?: boolean;
    can_edit_transactions?: boolean;
    can_delete_transactions?: boolean;
    can_view_investments?: boolean;
    can_manage_investments?: boolean;
    can_view_suppliers?: boolean;
    can_manage_suppliers?: boolean;
    can_view_dre?: boolean;
    can_view_cashflow?: boolean;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verificar autenticação
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { email, permissions }: InviteRequest = await req.json();

    // Validar email
    if (!email || !email.includes('@')) {
      return new Response(
        JSON.stringify({ error: 'Email inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se já existe convite ativo
    const { data: existingInvite } = await supabaseClient
      .from('business_invites')
      .select('*')
      .eq('owner_id', user.id)
      .eq('email', email.toLowerCase())
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (existingInvite) {
      return new Response(
        JSON.stringify({ error: 'Já existe um convite ativo para este email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Gerar token único
    const token = crypto.randomUUID();

    // Criar convite com expiração de 7 dias
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { error: insertError } = await supabaseClient
      .from('business_invites')
      .insert({
        owner_id: user.id,
        email: email.toLowerCase(),
        token,
        permissions,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error('Erro ao criar convite:', insertError);
      return new Response(
        JSON.stringify({ error: 'Erro ao criar convite' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Gerar link de convite
    const inviteUrl = `${Deno.env.get('SITE_URL') || 'http://localhost:5173'}/auth?invite_token=${token}`;

    console.log(`Convite criado para ${email} pelo usuário ${user.id}`);
    console.log(`Link de convite: ${inviteUrl}`);

    // TODO: Enviar email com o link (integrar com serviço de email)

    return new Response(
      JSON.stringify({
        success: true,
        invite_url: inviteUrl,
        expires_at: expiresAt.toISOString(),
        message: 'Convite criado com sucesso',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro ao processar convite:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
