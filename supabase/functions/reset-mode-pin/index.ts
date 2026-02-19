import { createClient } from "npm:@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";
import { generateResetPinEmail } from "./_templates/reset-pin-email.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// PBKDF2 configuration (consistent with validate-mode-pin)
const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 16;
const HASH_LENGTH = 32; // 256 bits

function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hashPin(pin: string): Promise<string> {
  const salt = generateSalt();
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(pin),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const saltBuffer = new Uint8Array(salt).buffer as ArrayBuffer;

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    HASH_LENGTH * 8
  );

  const hashBytes = new Uint8Array(derivedBits);
  // Store as: salt$hash (both in hex) - consistent with validate-mode-pin
  return `${bytesToHex(salt)}$${bytesToHex(hashBytes)}`;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, token, newPin } = await req.json();

    console.log(JSON.stringify({
      step: 'reset-mode-pin-start',
      details: { action, method: req.method },
      timestamp: new Date().toISOString()
    }));

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ========================================
    // ACTION: REQUEST - Solicitar reset de PIN
    // ========================================
    if (action === 'request') {
      // Verificar autenticação
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        console.log(JSON.stringify({
          step: 'authentication-failed',
          details: { reason: 'missing-auth-header' },
          timestamp: new Date().toISOString()
        }));
        
        return new Response(
          JSON.stringify({ error: 'Autenticação necessária' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const jwt = authHeader.replace('Bearer ', '');
      const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);

      if (userError || !user) {
        console.log(JSON.stringify({
          step: 'user-verification-failed',
          details: { error: userError?.message },
          timestamp: new Date().toISOString()
        }));
        
        return new Response(
          JSON.stringify({ error: 'Sessão inválida' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(JSON.stringify({
        step: 'user-verified',
        details: { userId: user.id },
        timestamp: new Date().toISOString()
      }));

      // Buscar informações do usuário
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.log(JSON.stringify({
          step: 'profile-fetch-error',
          details: { error: profileError.message },
          timestamp: new Date().toISOString()
        }));
      }

      // Gerar token único
      const resetToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

      // Salvar token no banco
      const { error: tokenError } = await supabase
        .from('pin_reset_tokens')
        .insert({
          user_id: user.id,
          token: resetToken,
          expires_at: expiresAt.toISOString(),
          used: false
        });

      if (tokenError) {
        console.log(JSON.stringify({
          step: 'token-save-error',
          details: { error: tokenError.message },
          timestamp: new Date().toISOString()
        }));
        
        return new Response(
          JSON.stringify({ error: 'Erro ao gerar token de reset' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(JSON.stringify({
        step: 'token-created',
        details: { userId: user.id, expiresAt: expiresAt.toISOString() },
        timestamp: new Date().toISOString()
      }));

      // Gerar URL de reset
      const siteUrl = Deno.env.get('SITE_URL') || 'http://localhost:8080';
      const resetUrl = `${siteUrl}/profile?reset_token=${resetToken}`;

      // Enviar e-mail
      const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
      
      const emailHtml = generateResetPinEmail({
        userName: profile?.full_name || user.email?.split('@')[0] || 'Usuário',
        resetUrl,
        expiresAt: expiresAt.toLocaleString('pt-BR', { 
          dateStyle: 'short', 
          timeStyle: 'short',
          timeZone: 'America/Sao_Paulo'
        })
      });

      const { error: emailError } = await resend.emails.send({
        from: 'MyFin <onboarding@resend.dev>',
        to: [user.email!],
        subject: 'Redefinição de PIN - MyFin',
        html: emailHtml,
      });

      if (emailError) {
        console.log(JSON.stringify({
          step: 'email-send-error',
          details: { error: emailError.message },
          timestamp: new Date().toISOString()
        }));
        
        return new Response(
          JSON.stringify({ error: 'Erro ao enviar e-mail' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(JSON.stringify({
        step: 'email-sent-successfully',
        details: { email: user.email },
        timestamp: new Date().toISOString()
      }));

      return new Response(
        JSON.stringify({ success: true, message: 'E-mail de recuperação enviado' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========================================
    // ACTION: RESET - Executar reset de PIN
    // ========================================
    if (action === 'reset') {
      if (!token || !newPin) {
        return new Response(
          JSON.stringify({ error: 'Token e novo PIN são obrigatórios' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validar formato do PIN
      if (!/^\d{4}$/.test(newPin)) {
        return new Response(
          JSON.stringify({ error: 'PIN deve conter exatamente 4 dígitos numéricos' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(JSON.stringify({
        step: 'validating-token',
        timestamp: new Date().toISOString()
      }));

      // Validar token
      const { data: tokenData, error: tokenError } = await supabase
        .from('pin_reset_tokens')
        .select('*')
        .eq('token', token)
        .eq('used', false)
        .single();

      if (tokenError || !tokenData) {
        console.log(JSON.stringify({
          step: 'token-validation-error',
          details: { error: tokenError?.message || 'Token não encontrado' },
          timestamp: new Date().toISOString()
        }));
        
        return new Response(
          JSON.stringify({ error: 'Token inválido ou já utilizado' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verificar se token expirou
      const now = new Date();
      const expiresAt = new Date(tokenData.expires_at);
      
      if (now > expiresAt) {
        console.log(JSON.stringify({
          step: 'token-expired',
          details: { expiresAt: tokenData.expires_at },
          timestamp: new Date().toISOString()
        }));
        
        return new Response(
          JSON.stringify({ error: 'Token expirado. Solicite um novo reset.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(JSON.stringify({
        step: 'token-valid',
        details: { userId: tokenData.user_id },
        timestamp: new Date().toISOString()
      }));

      // Hashear novo PIN
      const hashedPin = await hashPin(newPin);

      console.log(JSON.stringify({
        step: 'new-pin-hashed',
        timestamp: new Date().toISOString()
      }));

      // Atualizar PIN no perfil
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ mode_switch_pin_hash: hashedPin })
        .eq('id', tokenData.user_id);

      if (updateError) {
        console.log(JSON.stringify({
          step: 'pin-update-error',
          details: { error: updateError.message },
          timestamp: new Date().toISOString()
        }));
        
        return new Response(
          JSON.stringify({ error: 'Erro ao atualizar PIN' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Marcar token como usado
      const { error: markUsedError } = await supabase
        .from('pin_reset_tokens')
        .update({ used: true })
        .eq('token', token);

      if (markUsedError) {
        console.log(JSON.stringify({
          step: 'token-mark-used-error',
          details: { error: markUsedError.message },
          timestamp: new Date().toISOString()
        }));
      }

      console.log(JSON.stringify({
        step: 'pin-reset-successful',
        details: { userId: tokenData.user_id },
        timestamp: new Date().toISOString()
      }));

      return new Response(
        JSON.stringify({ success: true, message: 'PIN redefinido com sucesso' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Ação inválida
    return new Response(
      JSON.stringify({ error: 'Ação inválida' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in reset-mode-pin function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
