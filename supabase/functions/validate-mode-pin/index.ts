import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const logStep = (step: string, details?: unknown) => {
  console.log(JSON.stringify({ step, details, timestamp: new Date().toISOString() }));
};

interface RequestBody {
  pin: string;
  action: 'create' | 'validate' | 'update';
  newPin?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    logStep('validate-mode-pin-start', { method: req.method });

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      logStep('auth-error', { error: authError?.message });
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    logStep('user-authenticated', { userId: user.id });

    const { pin, action, newPin }: RequestBody = await req.json()

    // Validar formato do PIN (4 dígitos)
    if (!/^\d{4}$/.test(pin)) {
      logStep('invalid-pin-format', { pin: '****' });
      return new Response(
        JSON.stringify({ error: 'PIN deve conter exatamente 4 dígitos numéricos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('mode_switch_pin_hash')
      .eq('id', user.id)
      .single()

    if (profileError) {
      logStep('profile-fetch-error', { error: profileError.message });
      throw profileError
    }

    logStep('action-requested', { action, hasExistingPin: !!profile.mode_switch_pin_hash });

    switch (action) {
      case 'create': {
        // Verificar se já existe PIN
        if (profile.mode_switch_pin_hash) {
          logStep('pin-already-exists');
          return new Response(
            JSON.stringify({ error: 'PIN já configurado' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Criar hash do PIN
        const hash = await bcrypt.hash(pin)
        logStep('pin-hash-created');

        // Salvar no banco
        const { error: updateError } = await supabaseClient
          .from('profiles')
          .update({ mode_switch_pin_hash: hash })
          .eq('id', user.id)

        if (updateError) {
          logStep('pin-create-error', { error: updateError.message });
          throw updateError
        }

        logStep('pin-created-successfully');
        return new Response(
          JSON.stringify({ success: true, message: 'PIN criado com sucesso!' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'validate': {
        // Verificar se existe PIN configurado
        if (!profile.mode_switch_pin_hash) {
          logStep('no-pin-configured');
          return new Response(
            JSON.stringify({ hasPin: false }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Validar PIN
        const isValid = await bcrypt.compare(pin, profile.mode_switch_pin_hash)
        logStep('pin-validated', { isValid });

        return new Response(
          JSON.stringify({ 
            valid: isValid, 
            hasPin: true,
            message: isValid ? 'PIN correto' : 'PIN incorreto'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'update': {
        if (!newPin || !/^\d{4}$/.test(newPin)) {
          logStep('invalid-new-pin-format');
          return new Response(
            JSON.stringify({ error: 'Novo PIN inválido' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Validar PIN atual
        if (!profile.mode_switch_pin_hash) {
          logStep('no-pin-to-update');
          return new Response(
            JSON.stringify({ error: 'Nenhum PIN configurado' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const isValid = await bcrypt.compare(pin, profile.mode_switch_pin_hash)
        if (!isValid) {
          logStep('current-pin-incorrect');
          return new Response(
            JSON.stringify({ error: 'PIN atual incorreto' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Criar hash do novo PIN
        const newHash = await bcrypt.hash(newPin)
        logStep('new-pin-hash-created');

        // Atualizar no banco
        const { error: updateError } = await supabaseClient
          .from('profiles')
          .update({ mode_switch_pin_hash: newHash })
          .eq('id', user.id)

        if (updateError) {
          logStep('pin-update-error', { error: updateError.message });
          throw updateError
        }

        logStep('pin-updated-successfully');
        return new Response(
          JSON.stringify({ success: true, message: 'PIN atualizado com sucesso!' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        logStep('invalid-action', { action });
        return new Response(
          JSON.stringify({ error: 'Ação inválida' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

  } catch (error) {
    logStep('error', { error: error.message });
    console.error('Erro ao processar PIN:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
