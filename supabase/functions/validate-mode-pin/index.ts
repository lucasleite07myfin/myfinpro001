import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const logStep = (step: string, details?: unknown) => {
  console.log(JSON.stringify({ step, details, timestamp: new Date().toISOString() }));
};

// PBKDF2 configuration
const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 16;
const HASH_LENGTH = 32; // 256 bits

// Generate cryptographically secure random salt
function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
}

// Convert bytes to hex string
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Convert hex string to bytes
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

// Hash PIN using PBKDF2 with salt
async function hashPinWithSalt(pin: string, salt: Uint8Array): Promise<string> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(pin),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  
  // Create a proper ArrayBuffer from the Uint8Array for TypeScript compatibility
  const saltBuffer = new Uint8Array(salt).buffer as ArrayBuffer;
  
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    HASH_LENGTH * 8 // bits
  );
  
  const hashBytes = new Uint8Array(derivedBits);
  // Store as: salt$hash (both in hex)
  return `${bytesToHex(salt)}$${bytesToHex(hashBytes)}`;
}

// Create a new salted hash for a PIN
async function createPinHash(pin: string): Promise<string> {
  const salt = generateSalt();
  return hashPinWithSalt(pin, salt);
}

// Verify PIN against stored hash
async function verifyPin(pin: string, storedHash: string): Promise<boolean> {
  // Check if it's a legacy SHA-256 hash (no $ separator, 64 chars)
  if (!storedHash.includes('$') && storedHash.length === 64) {
    // Legacy verification - compare with simple SHA-256
    const encoder = new TextEncoder();
    const data = encoder.encode(pin);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const legacyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return legacyHash === storedHash;
  }
  
  // New PBKDF2 format: salt$hash
  const [saltHex, hashHex] = storedHash.split('$');
  if (!saltHex || !hashHex) {
    logStep('invalid-hash-format', { format: 'expected salt$hash' });
    return false;
  }
  
  const salt = hexToBytes(saltHex);
  const expectedHash = await hashPinWithSalt(pin, salt);
  
  // Constant-time comparison to prevent timing attacks
  const expected = expectedHash.split('$')[1];
  if (expected.length !== hashHex.length) return false;
  
  let result = 0;
  for (let i = 0; i < expected.length; i++) {
    result |= expected.charCodeAt(i) ^ hashHex.charCodeAt(i);
  }
  return result === 0;
}

interface RequestBody {
  pin: string;
  action: 'create' | 'validate' | 'update';
  newPin?: string;
}

// Rate limiting configuration
const MAX_PIN_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MINUTES = 15;

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

    // Rate limiting check using service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000).toISOString();
    const rateLimitIdentifier = `pin_${user.id}`;
    
    const { data: attempts, error: rateLimitError } = await supabaseAdmin
      .from('rate_limit_attempts')
      .select('id')
      .eq('identifier', rateLimitIdentifier)
      .eq('action', 'pin_validate')
      .gte('created_at', windowStart);

    if (rateLimitError) {
      logStep('rate-limit-check-error', { error: rateLimitError.message });
    }

    const attemptCount = attempts?.length || 0;
    
    if (attemptCount >= MAX_PIN_ATTEMPTS) {
      logStep('rate-limit-exceeded', { attempts: attemptCount, max: MAX_PIN_ATTEMPTS });
      return new Response(
        JSON.stringify({ 
          error: 'Muitas tentativas. Aguarde 15 minutos.',
          retryAfter: RATE_LIMIT_WINDOW_MINUTES * 60
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

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

        // Criar hash do PIN com PBKDF2 e salt
        const pinHash = await createPinHash(pin)
        logStep('pin-hash-created', { algorithm: 'PBKDF2' });

        // Salvar no banco
        const { error: updateError } = await supabaseClient
          .from('profiles')
          .update({ mode_switch_pin_hash: pinHash })
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
        // Record the attempt for rate limiting
        await supabaseAdmin
          .from('rate_limit_attempts')
          .insert({ identifier: rateLimitIdentifier, action: 'pin_validate' });

        // Verificar se existe PIN configurado
        if (!profile.mode_switch_pin_hash) {
          logStep('no-pin-configured');
          return new Response(
            JSON.stringify({ hasPin: false }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Validar PIN (supports both legacy and new format)
        const isValid = await verifyPin(pin, profile.mode_switch_pin_hash)
        logStep('pin-validated', { isValid });

        // If valid and using legacy hash, upgrade to PBKDF2
        if (isValid && !profile.mode_switch_pin_hash.includes('$')) {
          const upgradedHash = await createPinHash(pin);
          await supabaseClient
            .from('profiles')
            .update({ mode_switch_pin_hash: upgradedHash })
            .eq('id', user.id);
          logStep('pin-hash-upgraded-to-pbkdf2');
        }

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

        const isValid = await verifyPin(pin, profile.mode_switch_pin_hash)
        if (!isValid) {
          // Record failed attempt
          await supabaseAdmin
            .from('rate_limit_attempts')
            .insert({ identifier: rateLimitIdentifier, action: 'pin_validate' });
          
          logStep('current-pin-incorrect');
          return new Response(
            JSON.stringify({ error: 'PIN atual incorreto' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Criar hash do novo PIN com PBKDF2 e salt
        const newHash = await createPinHash(newPin)
        logStep('new-pin-hash-created', { algorithm: 'PBKDF2' });

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
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    logStep('error', { error: errorMessage });
    console.error('Erro ao processar PIN:', error)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
