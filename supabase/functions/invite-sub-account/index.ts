import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { generateEmployeeInviteEmail } from "./_templates/employee-invite.ts";

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
  additional_info?: {
    department?: string;
    position?: string;
    employee_code?: string;
    phone?: string;
    admission_date?: string;
    notes?: string;
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

    const { email, permissions, additional_info }: InviteRequest = await req.json();

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
        additional_info,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error('Erro ao criar convite:', insertError);
      return new Response(
        JSON.stringify({ error: 'Erro ao criar convite' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar nome da empresa do owner
    const { data: ownerProfile } = await supabaseClient
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    const companyName = ownerProfile?.full_name || 'Empresa';

    // Gerar link de convite
    const siteUrl = Deno.env.get('SITE_URL') || 'http://localhost:5173';
    const inviteUrl = `${siteUrl}/auth?invite_token=${token}`;

    console.log(`Convite criado para ${email} pelo usuário ${user.id}`);
    console.log(`Link de convite: ${inviteUrl}`);

    // Enviar email via Resend
    let emailSent = false;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        
        const html = generateEmployeeInviteEmail({
          employeeEmail: email,
          companyName,
          inviteUrl,
          expiresAt: expiresAt.toISOString(),
          department: additional_info?.department,
          position: additional_info?.position,
        });

        const { error: emailError } = await resend.emails.send({
          from: 'MyFin <onboarding@resend.dev>',
          to: [email],
          subject: `Convite para ${companyName} - Sistema MyFin`,
          html,
        });

        if (emailError) {
          console.error('Erro ao enviar email:', emailError);
        } else {
          emailSent = true;
          console.log(`Email enviado com sucesso para ${email}`);
        }
      } catch (emailError) {
        console.error('Erro ao processar email:', emailError);
      }
    } else {
      console.warn('RESEND_API_KEY não configurada. Email não enviado.');
    }

    return new Response(
      JSON.stringify({
        success: true,
        invite_url: inviteUrl,
        expires_at: expiresAt.toISOString(),
        email_sent: emailSent,
        message: emailSent 
          ? 'Convite criado e email enviado com sucesso' 
          : 'Convite criado. Por favor, envie o link manualmente.',
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
