import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VALIDATE-COUPON] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const { code } = await req.json();

    if (!code || typeof code !== "string") {
      throw new Error("Código do cupom é obrigatório");
    }

    const normalizedCode = code.toUpperCase().trim();
    logStep("Validating coupon", { code: normalizedCode });

    const { data: coupon, error } = await supabaseClient
      .from("discount_coupons")
      .select("*")
      .eq("code", normalizedCode)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      logStep("Database error", { error: error.message });
      throw error;
    }

    if (!coupon) {
      logStep("Coupon not found or inactive");
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: "Cupom inválido ou não encontrado" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Verificar validade
    const now = new Date();
    if (coupon.valid_until && new Date(coupon.valid_until) < now) {
      logStep("Coupon expired", { valid_until: coupon.valid_until });
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: "Cupom expirado" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Verificar limite de uso
    if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
      logStep("Coupon usage limit reached", { 
        current_uses: coupon.current_uses, 
        max_uses: coupon.max_uses 
      });
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: "Cupom atingiu limite de usos" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    logStep("Coupon is valid", { discount_percent: coupon.discount_percent });

    return new Response(
      JSON.stringify({ 
        valid: true, 
        discount_percent: coupon.discount_percent,
        code: coupon.code 
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
