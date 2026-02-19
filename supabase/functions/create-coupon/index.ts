import Stripe from "npm:stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-COUPON] ${step}${detailsStr}`);
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Verificar se é admin usando a função has_role
    const { data: isAdminData, error: roleError } = await supabaseClient
      .rpc("has_role", { _user_id: user.id, _role: "admin" });

    if (roleError || !isAdminData) {
      logStep("Permission denied", { userId: user.id, isAdmin: isAdminData });
      throw new Error("Você não tem permissão para criar cupons");
    }

    logStep("Admin verified");

    const { code, discount_percent, valid_until, max_uses } = await req.json();

    // Validações
    if (!code || typeof code !== "string" || code.trim().length === 0) {
      throw new Error("Código do cupom é obrigatório");
    }

    if (!discount_percent || discount_percent <= 0 || discount_percent > 100) {
      throw new Error("Porcentagem de desconto deve estar entre 1 e 100");
    }

    const normalizedCode = code.toUpperCase().trim();
    logStep("Creating coupon", { code: normalizedCode, discount_percent });

    // Verificar se já existe
    const { data: existing } = await supabaseClient
      .from("discount_coupons")
      .select("id")
      .eq("code", normalizedCode)
      .maybeSingle();

    if (existing) {
      throw new Error("Já existe um cupom com este código");
    }

    // Criar no Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const stripeCoupon = await stripe.coupons.create({
      percent_off: discount_percent,
      duration: "once",
      name: normalizedCode,
    });

    logStep("Stripe coupon created", { stripeCouponId: stripeCoupon.id });

    // Salvar no banco de dados
    const { data: newCoupon, error: insertError } = await supabaseClient
      .from("discount_coupons")
      .insert({
        code: normalizedCode,
        discount_percent,
        stripe_coupon_id: stripeCoupon.id,
        valid_until: valid_until || null,
        max_uses: max_uses || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      logStep("ERROR inserting coupon", { error: insertError.message });
      // Tentar deletar do Stripe se falhar no BD
      await stripe.coupons.del(stripeCoupon.id);
      throw insertError;
    }

    logStep("Coupon created successfully", { couponId: newCoupon.id });

    return new Response(
      JSON.stringify({ 
        success: true, 
        coupon: newCoupon 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
