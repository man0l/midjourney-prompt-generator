import type { APIRoute } from 'astro';
import OpenAI from 'openai';

export const prerender = false;

const ALLOWED_ORIGINS = [
  'https://chatgpt.com',
  'https://claude.ai',
  'https://gemini.google.com',
  'https://grok.com',
];

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  // Allow any Chrome/Firefox extension origin
  if (origin.startsWith('chrome-extension://')) return true;
  if (origin.startsWith('moz-extension://')) return true;
  return false;
}

const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function rateCheck(ip: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(ip);
  if (!bucket || now > bucket.resetAt) {
    rateBuckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (bucket.count >= RATE_LIMIT) return false;
  bucket.count++;
  return true;
}

function cors(origin: string | null): Record<string, string> {
  const allow = isAllowedOrigin(origin) ? origin! : '';
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  };
}

function json(body: unknown, status: number, extra: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...extra },
  });
}

export const OPTIONS: APIRoute = ({ request }) => {
  const origin = request.headers.get('origin');
  if (!isAllowedOrigin(origin)) {
    return new Response(null, { status: 403 });
  }
  return new Response(null, { status: 204, headers: cors(origin) });
};

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const origin = request.headers.get('origin');
  const headers = cors(origin);

  if (!isAllowedOrigin(origin)) {
    return json({ error: 'Forbidden' }, 403, headers);
  }

  const ip =
    clientAddress ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown';
  if (!rateCheck(ip)) {
    return json({ error: 'Rate limit exceeded' }, 429, headers);
  }

  let body: { prompt?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400, headers);
  }

  const prompt = (body.prompt || '').trim();
  if (!prompt) return json({ error: 'Missing prompt' }, 400, headers);
  if (prompt.length > 4000) {
    return json({ error: 'Prompt too long (max 4000 chars)' }, 400, headers);
  }

  const apiKey = process.env.VITE_OPENAI_API_KEY;
  if (!apiKey) return json({ error: 'Server not configured' }, 500, headers);

  try {
    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: 'gpt-5-nano',
      messages: [
        {
          role: 'system',
          content:
            "You are a prompt improvement assistant. Rewrite the user's prompt to be clearer, more specific, and more effective for an AI assistant, while preserving original intent and language. Respond ONLY with the improved prompt — no explanations, no prefix, no quotes, no markdown fencing.",
        },
        { role: 'user', content: prompt },
      ],
    });

    const improved =
      completion.choices[0]?.message?.content?.trim() || prompt;
    return json({ improved }, 200, headers);
  } catch (err: any) {
    return json({ error: err?.message || 'OpenAI error' }, 502, headers);
  }
};
