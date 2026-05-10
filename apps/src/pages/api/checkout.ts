import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function stripePost(path: string, params: Record<string, string>, secretKey: string) {
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(params).toString(),
  });
  const data: any = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? `Stripe error ${res.status}`);
  return data;
}

export const POST: APIRoute = async ({ request }) => {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);
  const token = authHeader.slice(7);

  const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return json({ error: 'Unauthorized' }, 401);

  let body: { priceId?: string };
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
  const priceId = body.priceId?.trim();
  if (!priceId) return json({ error: 'Missing priceId' }, 400);

  const stripeKey = import.meta.env.STRIPE_SECRET_KEY;
  const origin = new URL(request.url).origin;

  try {
    const { data: sub } = await supabase
      .from('user_subscriptions')
      .select('stripe_customer_id, stripe_subscription_id, plan')
      .eq('user_id', user.id)
      .maybeSingle();

    let customerId = sub?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripePost('/customers', {
        email: user.email ?? '',
        'metadata[supabase_user_id]': user.id,
      }, stripeKey);
      customerId = customer.id;
      await supabase.from('user_subscriptions').upsert({
        user_id: user.id,
        stripe_customer_id: customerId,
        plan: 'free',
        status: 'active',
      });
    }

    // If user already has an active paid subscription, send them to the billing portal
    if (sub?.stripe_subscription_id && sub?.plan !== 'free') {
      const portal = await stripePost('/billing_portal/sessions', {
        customer: customerId,
        return_url: `${origin}/profile`,
      }, stripeKey);
      return json({ url: portal.url });
    }

    const session = await stripePost('/checkout/sessions', {
      customer: customerId,
      'payment_method_types[0]': 'card',
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      mode: 'subscription',
      success_url: `${origin}/?checkout=success`,
      cancel_url: `${origin}/?checkout=cancelled`,
      'metadata[supabase_user_id]': user.id,
      'automatic_tax[enabled]': 'true',
      'customer_update[address]': 'auto',
      allow_promotion_codes: 'true',
    }, stripeKey);

    return json({ url: session.url });
  } catch (err: any) {
    return json({ error: err?.message ?? 'Unknown error' }, 500);
  }
};
