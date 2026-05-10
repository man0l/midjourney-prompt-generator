import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const prerender = false;

const CREDIT_LIMITS: Record<string, number> = {
  free: 3,
  starter: 500,
  pro: 1500,
  unlimited: 999999,
};

function planFromPriceId(priceId: string): string {
  const env = import.meta.env;
  if ([env.STRIPE_PRICE_STARTER_MONTHLY, env.STRIPE_PRICE_STARTER_YEARLY].includes(priceId)) return 'starter';
  if ([env.STRIPE_PRICE_PRO_MONTHLY, env.STRIPE_PRICE_PRO_YEARLY].includes(priceId)) return 'pro';
  if ([env.STRIPE_PRICE_UNLIMITED_MONTHLY, env.STRIPE_PRICE_UNLIMITED_YEARLY].includes(priceId)) return 'unlimited';
  return 'free';
}

async function verifyStripeSignature(body: string, sigHeader: string, secret: string): Promise<boolean> {
  const parts = Object.fromEntries(sigHeader.split(',').map(p => p.split('=')));
  const timestamp = parts['t'];
  const signature = parts['v1'];
  if (!timestamp || !signature) return false;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const payload = enc.encode(`${timestamp}.${body}`);
  const sigBytes = await crypto.subtle.sign('HMAC', key, payload);
  const computed = Array.from(new Uint8Array(sigBytes)).map(b => b.toString(16).padStart(2, '0')).join('');
  return computed === signature;
}

async function stripeGet(path: string, secretKey: string) {
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });
  const data: any = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? `Stripe error ${res.status}`);
  return data;
}

export const POST: APIRoute = async ({ request }) => {
  const sig = request.headers.get('stripe-signature');
  const webhookSecret = import.meta.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !webhookSecret) return new Response('Missing signature', { status: 400 });

  const body = await request.text();

  const valid = await verifyStripeSignature(body, sig, webhookSecret);
  if (!valid) return new Response('Invalid signature', { status: 400 });

  let event: any;
  try {
    event = JSON.parse(body);
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const stripeKey = import.meta.env.STRIPE_SECRET_KEY;
  const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.supabase_user_id;
        if (!userId || !session.subscription) break;

        const subscription = await stripeGet(`/subscriptions/${session.subscription}`, stripeKey);
        const priceId = subscription.items?.data[0]?.price?.id;
        const plan = planFromPriceId(priceId);
        const today = new Date().toISOString().split('T')[0];

        await supabase.from('user_subscriptions').upsert({
          user_id: userId,
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
          plan,
          status: 'active',
          current_period_end: subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000).toISOString()
            : null,
        });

        await supabase.from('user_credits').upsert({
          user_id: userId,
          credits_remaining: CREDIT_LIMITS[plan],
          monthly_credits_used: 0,
          monthly_reset_date: today,
          last_reset: new Date().toISOString(),
        });
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const priceId = subscription.items?.data[0]?.price?.id;
        const plan = planFromPriceId(priceId);

        const { data: sub } = await supabase
          .from('user_subscriptions')
          .select('user_id, plan')
          .eq('stripe_subscription_id', subscription.id)
          .maybeSingle();

        if (!sub) break;

        await supabase.from('user_subscriptions').update({
          plan,
          status: subscription.status,
          current_period_end: subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000).toISOString()
            : null,
        }).eq('stripe_subscription_id', subscription.id);

        if (sub.plan !== plan) {
          await supabase.from('user_credits').update({
            credits_remaining: CREDIT_LIMITS[plan],
            monthly_credits_used: 0,
          }).eq('user_id', sub.user_id);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;

        const { data: sub } = await supabase
          .from('user_subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', subscription.id)
          .maybeSingle();

        if (!sub) break;

        await supabase.from('user_subscriptions').update({
          plan: 'free',
          status: 'canceled',
          stripe_subscription_id: null,
        }).eq('stripe_subscription_id', subscription.id);

        await supabase.from('user_credits').update({
          credits_remaining: CREDIT_LIMITS['free'],
        }).eq('user_id', sub.user_id);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        if (invoice.subscription) {
          await supabase.from('user_subscriptions').update({
            status: 'past_due',
          }).eq('stripe_subscription_id', invoice.subscription);
        }
        break;
      }
    }
  } catch (err: any) {
    console.error('Webhook handler error:', err?.message);
    return new Response(JSON.stringify({ error: err?.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
