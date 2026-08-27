import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

type PreviewJob = {
  id: string;
  status: 'pending' | 'done' | 'error';
  b64_json?: string;
  imageUrl?: string;
  error?: string;
  creditsRemaining?: number;
};

// In-memory store — survives warm function, best-effort for Hobby 30s limit.
// Grok-imagine takes ~70s, so we use waitUntil to keep work alive past response.
const jobs = new Map<string, PreviewJob>();

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

  const jobId = crypto.randomUUID();
  const job: PreviewJob = { id: jobId, status: 'pending', creditsRemaining: r2 };
  jobs.set(jobId, job);

  const doGenerate = async () => {
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
      job.status = 'done';
      job.b64_json = b64_json;
      job.imageUrl = imageUrl;
    } catch (err: any) {
      job.status = 'error';
      job.error = err?.message || 'Preview failed';
      // Refund both credits on failure
      const svcKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
      if (svcKey) {
        const svc = createClient(supabaseUrl, svcKey);
        await svc.rpc('refund_credit', { p_user_id: user.id });
        await svc.rpc('refund_credit', { p_user_id: user.id });
      } else {
        await supabase.rpc('refund_credit', { p_user_id: user.id });
        await supabase.rpc('refund_credit', { p_user_id: user.id });
      }
    }
    // Auto-expire job after 5 min
    setTimeout(() => jobs.delete(jobId), 5 * 60_000);
  };

  // Keep generation alive past the response using waitUntil when available (Vercel).
  const waitUntil = (globalThis as any).waitUntil as ((p: Promise<void>) => void) | undefined;
  if (waitUntil) {
    waitUntil(doGenerate());
  } else {
    // Fallback: fire-and-forget (may be killed on Hobby if function returns too early,
    // but worth trying — Vercel keeps the event loop briefly).
    void doGenerate();
  }

  return json({ jobId, creditsRemaining: r2 }, 202);
};

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const jobId = url.searchParams.get('id');
  if (!jobId) return json({ error: 'Missing id' }, 400);
  const job = jobs.get(jobId);
  if (!job) return json({ error: 'Job not found or expired' }, 404);
  if (job.status === 'pending') return json({ status: 'pending', creditsRemaining: job.creditsRemaining });
  if (job.status === 'error') return json({ status: 'error', error: job.error, creditsRemaining: job.creditsRemaining }, 502);
  return json({ status: 'done', b64_json: job.b64_json, imageUrl: job.imageUrl, creditsRemaining: job.creditsRemaining });
};
