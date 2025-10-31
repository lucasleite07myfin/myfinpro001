import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessInviteRequest {
  token: string;
  user_id: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { token, user_id }: ProcessInviteRequest = await req.json();

    if (!token || !user_id) {
      return new Response(
        JSON.stringify({ error: 'Token e user_id são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar convite
    const { data: invite, error: inviteError } = await supabaseAdmin
      .from('business_invites')
      .select('*')
      .eq('token', token)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (inviteError || !invite) {
      return new Response(
        JSON.stringify({ error: 'Convite inválido ou expirado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se já existe sub-account
    const { data: existingSubAccount } = await supabaseAdmin
      .from('business_sub_accounts')
      .select('*')
      .eq('owner_id', invite.owner_id)
      .eq('sub_user_id', user_id)
      .maybeSingle();

    if (existingSubAccount) {
      console.log(`Sub-account já existe: ${user_id} já vinculado ao owner ${invite.owner_id}`);
      
      // Marcar convite como usado mesmo assim
      await supabaseAdmin
        .from('business_invites')
        .update({ used: true })
        .eq('id', invite.id);
      
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Você já está vinculado a este proprietário',
          already_linked: true
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extrair informações adicionais do convite
    const additionalInfo = invite.additional_info || {};

    // Criar sub-account
    const { error: subAccountError } = await supabaseAdmin
      .from('business_sub_accounts')
      .insert({
        owner_id: invite.owner_id,
        sub_user_id: user_id,
        access_type: 'employee',
        is_active: true,
        department: additionalInfo.department,
        position: additionalInfo.position,
        employee_code: additionalInfo.employee_code,
        phone: additionalInfo.phone,
        admission_date: additionalInfo.admission_date,
        notes: additionalInfo.notes,
        ...invite.permissions,
      });

    if (subAccountError) {
      console.error('❌ Erro ao criar sub-account:', {
        error: subAccountError,
        user_id,
        owner_id: invite.owner_id,
        permissions: invite.permissions
      });
      return new Response(
        JSON.stringify({ error: 'Erro ao vincular funcionário', details: subAccountError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Marcar convite como usado
    await supabaseAdmin
      .from('business_invites')
      .update({ used: true })
      .eq('id', invite.id);

    console.log(`✅ Sub-account criado com sucesso: user_id=${user_id} vinculado ao owner_id=${invite.owner_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        owner_id: invite.owner_id,
        message: 'Funcionário vinculado com sucesso',
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
