import type { APIRoute } from 'astro';

export const prerender = false;

// Resend segment "Grok Spicy Signups" — starts the "Grok Spicy Onboarding" automation.
const SEGMENT_ID = 'db1a0d1e-a6ad-4dd6-aadb-a2e82a256b02';
const SIGNUP_EVENT = 'grok.spicy_signup';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Called by the Supabase DB webhook on auth.users INSERT (see supabase/migrations/*_resend_signup_webhook.sql).
 * Creates the Resend contact and fires grok.spicy_signup to start the email sequence.
 */
export const POST: APIRoute = async ({ request }) => {
  const secret = import.meta.env.SUPABASE_WEBHOOK_SECRET;
  if (!secret || request.headers.get('x-webhook-secret') !== secret) {
    return json({ error: 'unauthorized' }, 401);
  }

  const resendKey = import.meta.env.RESEND_API_KEY;
  if (!resendKey) return json({ error: 'RESEND_API_KEY not configured' }, 500);

  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid json' }, 400);
  }

  const email = body.email?.toLowerCase().trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'valid email required' }, 400);
  }

  const headers = {
    Authorization: `Bearer ${resendKey}`,
    'Content-Type': 'application/json',
  };

  // 1. Add contact to the segment (existing contacts are upserted by Resend).
  const contactRes = await fetch('https://api.resend.com/contacts', {
    method: 'POST',
    headers,
    body: JSON.stringify({ email, segment_ids: [SEGMENT_ID], unsubscribed: false }),
  });
  if (!contactRes.ok) {
    const detail = await contactRes.text();
    console.error('resend contact create failed:', contactRes.status, detail);
    return json({ error: 'contact create failed' }, 502);
  }

  // 2. Fire the signup event occurrence — this is what starts the automation.
  // NOTE: POST /events registers event definitions; occurrences go through /events/send.
  const eventRes = await fetch('https://api.resend.com/events/send', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      event: SIGNUP_EVENT,
      email,
      payload: { source: 'grok_spicy' },
    }),
  });
  if (!eventRes.ok) {
    const detail = await eventRes.text();
    console.error('resend event fire failed:', eventRes.status, detail);
    return json({ error: 'event fire failed' }, 502);
  }

  return json({ ok: true });
};
