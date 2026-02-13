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

async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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

    // Hash the incoming token to compare against stored hash
    const tokenHash = await hashToken(token);

    // Buscar convite by hash
    const { data: invite, error: inviteError } = await supabaseAdmin
      .from('business_invites')
      .select('*')
      .eq('token', tokenHash)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (inviteError || !invite) {
      // Fallback: try matching plaintext token for backwards compatibility with existing invites
      const { data: legacyInvite, error: legacyError } = await supabaseAdmin
        .from('business_invites')
        .select('*')
        .eq('token', token)
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (legacyError || !legacyInvite) {
        return new Response(
          JSON.stringify({ error: 'Convite inválido ou expirado' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Process legacy invite and update token to hash
      return await processInvite(supabaseAdmin, legacyInvite, user_id, tokenHash);
    }

    return await processInvite(supabaseAdmin, invite, user_id);
  } catch (error) {
    console.error('Erro ao processar convite:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function processInvite(
  supabaseAdmin: ReturnType<typeof createClient>,
  invite: Record<string, unknown>,
  user_id: string,
  updateTokenHash?: string
) {
  // Verificar se já existe sub-account
  const { data: existingSubAccount } = await supabaseAdmin
    .from('business_sub_accounts')
    .select('*')
    .eq('owner_id', invite.owner_id as string)
    .eq('sub_user_id', user_id)
    .maybeSingle();

  if (existingSubAccount) {
    console.log(`Sub-account já existe: ${user_id} já vinculado ao owner ${invite.owner_id}`);
    
    // Marcar convite como usado
    const updateData: Record<string, unknown> = { used: true };
    if (updateTokenHash) updateData.token = updateTokenHash;
    
    await supabaseAdmin
      .from('business_invites')
      .update(updateData)
      .eq('id', invite.id as string);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Você já está vinculado a este proprietário',
        already_linked: true
      }),
      { status: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } }
    );
  }

  // Extrair informações adicionais do convite
  const additionalInfo = (invite.additional_info || {}) as Record<string, unknown>;
  const permissions = (invite.permissions || {}) as Record<string, unknown>;

  // Criar sub-account
  const { error: subAccountError } = await supabaseAdmin
    .from('business_sub_accounts')
    .insert({
      owner_id: invite.owner_id as string,
      sub_user_id: user_id,
      access_type: 'employee',
      is_active: true,
      department: additionalInfo.department as string | undefined,
      position: additionalInfo.position as string | undefined,
      employee_code: additionalInfo.employee_code as string | undefined,
      phone: additionalInfo.phone as string | undefined,
      admission_date: additionalInfo.admission_date as string | undefined,
      notes: additionalInfo.notes as string | undefined,
      ...permissions,
    });

  if (subAccountError) {
    console.error('❌ Erro ao criar sub-account:', {
      error: subAccountError,
      user_id,
      owner_id: invite.owner_id,
    });
    return new Response(
      JSON.stringify({ error: 'Erro ao vincular funcionário' }),
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } }
    );
  }

  // Marcar convite como usado
  const updateData: Record<string, unknown> = { used: true };
  if (updateTokenHash) updateData.token = updateTokenHash;
  
  await supabaseAdmin
    .from('business_invites')
    .update(updateData)
    .eq('id', invite.id as string);

  console.log(`✅ Sub-account criado com sucesso: user_id=${user_id} vinculado ao owner_id=${invite.owner_id}`);

  return new Response(
    JSON.stringify({
      success: true,
      owner_id: invite.owner_id,
      message: 'Funcionário vinculado com sucesso',
    }),
    { status: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } }
  );
}
