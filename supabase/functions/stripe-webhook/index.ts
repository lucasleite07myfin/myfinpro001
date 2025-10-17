import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
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
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const signature = req.headers.get("stripe-signature");
    const body = await req.text();

    let event: Stripe.Event;

    // Validar webhook signature (segurança crítica)
    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        logStep("Webhook signature verified");
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        logStep("Webhook signature verification failed", { error: errorMsg });
        return new Response("Invalid signature", { status: 400 });
      }
    } else {
      // Em desenvolvimento, aceitar sem verificação (mas logar warning)
      logStep("WARNING: No webhook secret configured - accepting unverified webhook");
      event = JSON.parse(body);
    }

    logStep("Processing event", { type: event.type, id: event.id });

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        const planType = session.metadata?.plan_type;
        
        logStep("Checkout completed", { userId, planType, customerId: session.customer });

        if (!userId) {
          logStep("ERROR: No user_id in session metadata");
          break;
        }

        // Criar ou atualizar subscription
        const { error } = await supabaseClient
          .from("subscriptions")
          .upsert({
            user_id: userId,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            status: "trialing",
            plan_type: planType,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: "user_id",
          });

        if (error) {
          logStep("ERROR updating subscription", { error: error.message });
        } else {
          logStep("Subscription created/updated successfully");
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id;

        logStep("Subscription updated", { 
          userId, 
          status: subscription.status,
          subscriptionId: subscription.id 
        });

        if (!userId) {
          // Tentar buscar pelo customer_id
          const { data: existingSub } = await supabaseClient
            .from("subscriptions")
            .select("user_id")
            .eq("stripe_customer_id", subscription.customer as string)
            .single();

          if (!existingSub) {
            logStep("ERROR: Could not find user for subscription");
            break;
          }
        }

        const { error } = await supabaseClient
          .from("subscriptions")
          .upsert({
            user_id: userId || (await supabaseClient
              .from("subscriptions")
              .select("user_id")
              .eq("stripe_customer_id", subscription.customer as string)
              .single()).data?.user_id,
            stripe_customer_id: subscription.customer as string,
            stripe_subscription_id: subscription.id,
            status: subscription.status,
            plan_type: subscription.items.data[0]?.price?.recurring?.interval === "year" ? "annual" : "monthly",
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
            cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: "stripe_subscription_id",
          });

        if (error) {
          logStep("ERROR updating subscription", { error: error.message });
        } else {
          logStep("Subscription updated successfully");
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        
        logStep("Subscription deleted", { subscriptionId: subscription.id });

        const { error } = await supabaseClient
          .from("subscriptions")
          .update({
            status: "canceled",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);

        if (error) {
          logStep("ERROR canceling subscription", { error: error.message });
        } else {
          logStep("Subscription canceled successfully");
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        logStep("Payment succeeded", { invoiceId: invoice.id, subscriptionId });

        if (subscriptionId) {
          const { error } = await supabaseClient
            .from("subscriptions")
            .update({
              status: "active",
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subscriptionId);

          if (error) {
            logStep("ERROR updating subscription status", { error: error.message });
          } else {
            logStep("Subscription activated successfully");
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        logStep("Payment failed", { invoiceId: invoice.id, subscriptionId });

        if (subscriptionId) {
          const { error } = await supabaseClient
            .from("subscriptions")
            .update({
              status: "past_due",
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subscriptionId);

          if (error) {
            logStep("ERROR updating subscription status", { error: error.message });
          } else {
            logStep("Subscription marked as past_due");
          }
        }
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
