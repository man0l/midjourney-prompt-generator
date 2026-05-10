import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request }) => {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);
  const token = authHeader.slice(7);

  const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return json({ error: 'Unauthorized' }, 401);

  const { data: sub } = await supabase
    .from('user_subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single();

  if (!sub?.stripe_customer_id) return json({ error: 'No active subscription', sub }, 404);

  try {
    const stripeRes = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${import.meta.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        customer: sub.stripe_customer_id,
        return_url: new URL(request.url).origin + '/profile',
      }).toString(),
    });
    const data: any = await stripeRes.json();
    if (!stripeRes.ok) {
      return json({ error: data?.error?.message, type: data?.error?.type, code: data?.error?.code, status: stripeRes.status }, 500);
    }
    return json({ url: data.url });
  } catch (err: any) {
    return json({ error: err?.message, stage: 'fetch' }, 500);
  }
};
