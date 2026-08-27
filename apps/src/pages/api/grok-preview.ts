import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

export const POST: APIRoute = async ({ request }) => {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '').trim();
  if (!token) return json({ error: 'Unauthorized' }, 401);

  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return json({ error: 'Server not configured' }, 500);

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return json({ error: 'Unauthorized' }, 401);

  let body: { prompt?: string };
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
  const prompt = (body.prompt || '').trim();
  // NSFW is supported — forward prompt as-is, no sanitization.
  if (!prompt) return json({ error: 'Missing prompt' }, 400);

  const openrouterKey = import.meta.env.OPENROUTER_API_KEY;
  if (!openrouterKey) return json({ error: 'Preview not configured' }, 500);

  // Reserve 2 credits atomically
  const { data: r1, error: e1 } = await supabase.rpc('use_credit', { p_user_id: user.id });
  if (e1) return json({ error: 'Credit check failed' }, 500);
  if (r1 === null || r1 === -1) return json({ error: 'out_of_credits' }, 402);
  const { data: r2, error: e2 } = await supabase.rpc('use_credit', { p_user_id: user.id });
  if (e2) { await supabase.rpc('refund_credit', { p_user_id: user.id }); return json({ error: 'Credit check failed' }, 500); }
  if (r2 === null || r2 === -1) { await supabase.rpc('refund_credit', { p_user_id: user.id }); return json({ error: 'Not enough credits for preview (needs 2)' }, 402); }

  try {
    const res = await fetch('https://openrouter.ai/api/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openrouterKey}`,
        'HTTP-Referer': 'https://midjourney-prompt-generator.eu',
        'X-Title': 'Midjourney Prompt Generator',
      },
      body: JSON.stringify({ model: 'x-ai/grok-imagine-image-2.0', prompt }),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`OpenRouter ${res.status}: ${t.slice(0, 400)}`);
    }
    const data = await res.json() as { data?: Array<{ b64_json?: string; url?: string }>; b64_json?: string; imageUrl?: string };
    const item = data.data?.[0];
    const b64_json = item?.b64_json ?? (data as any).b64_json;
    const imageUrl = item?.url ?? (data as any).imageUrl;
    if (!b64_json && !imageUrl) throw new Error('No image returned');
    return json({ b64_json, imageUrl, creditsRemaining: r2 });
  } catch (err: any) {
    await supabase.rpc('refund_credit', { p_user_id: user.id });
    await supabase.rpc('refund_credit', { p_user_id: user.id });
    return json({ error: err?.message || 'Preview failed' }, 502);
  }
};
