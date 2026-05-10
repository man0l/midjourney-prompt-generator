import type { APIRoute } from 'astro';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { imageUrl } = await request.json();
  if (!imageUrl) {
    return new Response(JSON.stringify({ error: 'imageUrl is required' }), { status: 400 });
  }

  const apiKey = import.meta.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Server configuration error' }), { status: 500 });
  }

  const openai = new OpenAI({ apiKey });

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a Midjourney prompt expert. Your task is to analyze images and create prompts that would recreate them.
Focus on:
1. Main subject and composition
2. Artistic style and technique
3. Lighting and atmosphere
4. Color palette and mood
5. Technical details (camera angle, perspective)
6. Relevant Midjourney parameters

Format the prompt to include appropriate Midjourney parameters when they would enhance the recreation.`,
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Create a detailed Midjourney prompt that would recreate this image. Include style, lighting, composition, and any relevant Midjourney parameters. Output the prompt only.',
          },
          {
            type: 'image_url',
            image_url: { url: imageUrl, detail: 'high' },
          },
        ],
      },
    ],
    max_completion_tokens: 500,
  });

  const prompt = response.choices[0]?.message?.content;
  if (!prompt) {
    return new Response(JSON.stringify({ error: 'Failed to generate prompt from image' }), { status: 500 });
  }

  return new Response(JSON.stringify({ prompt }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
