import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PRICE_IDS = {
  monthly: "price_1SJ49a2FXPwVNSnkrNTmyepP",
  annual: "price_1SJ4A02FXPwVNSnkaAVjzVZy",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
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
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { plan_type, coupon_code } = await req.json();
    logStep("Request body", { plan_type, coupon_code });

    if (!plan_type || !["monthly", "annual"].includes(plan_type)) {
      throw new Error("Invalid plan_type. Must be 'monthly' or 'annual'");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Validar cupom se fornecido
    let stripeCouponId: string | undefined;
    if (coupon_code) {
      logStep("Validating coupon", { coupon_code });
      
      const { data: coupon, error: couponError } = await supabaseClient
        .from("discount_coupons")
        .select("*")
        .eq("code", coupon_code.toUpperCase())
        .eq("is_active", true)
        .single();

      if (couponError || !coupon) {
        throw new Error("Cupom inválido ou não encontrado");
      }

      // Verificar validade
      const now = new Date();
      if (coupon.valid_until && new Date(coupon.valid_until) < now) {
        throw new Error("Cupom expirado");
      }

      // Verificar limite de uso
      if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
        throw new Error("Cupom atingiu limite de usos");
      }

      stripeCouponId = coupon.stripe_coupon_id;
      logStep("Coupon validated", { stripeCouponId, discount: coupon.discount_percent });
    }

    // Buscar ou criar customer no Stripe
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string;

    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing Stripe customer found", { customerId });
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      logStep("New Stripe customer created", { customerId });
    }

    // Criar Checkout Session
    const origin = req.headers.get("origin") || "http://localhost:3000";
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      line_items: [
        {
          price: PRICE_IDS[plan_type as keyof typeof PRICE_IDS],
          quantity: 1,
        },
      ],
      mode: "subscription",
      subscription_data: {
        trial_period_days: 3,
        metadata: {
          supabase_user_id: user.id,
          plan_type,
        },
      },
      payment_method_types: ["card"],
      allow_promotion_codes: false, // Usamos nosso próprio sistema
      success_url: `${origin}/subscription?success=true`,
      cancel_url: `${origin}/subscription?canceled=true`,
      metadata: {
        supabase_user_id: user.id,
        plan_type,
      },
    };

    // Adicionar cupom se válido
    if (stripeCouponId) {
      sessionConfig.discounts = [{ coupon: stripeCouponId }];
      
      // Incrementar uso do cupom
      await supabaseClient
        .from("discount_coupons")
        .update({ 
          current_uses: coupon_code ? ((await supabaseClient
            .from("discount_coupons")
            .select("current_uses")
            .eq("code", coupon_code.toUpperCase())
            .single()).data?.current_uses || 0) + 1 : 0
        })
        .eq("code", coupon_code.toUpperCase());
      
      logStep("Coupon applied to session");
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);
    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(
      JSON.stringify({ url: session.url, session_id: session.id }),
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
