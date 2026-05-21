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
        content: `You are a Midjourney prompt expert. Analyze the image and write a prompt to recreate it.

FOLLOW THESE RULES STRICTLY:

Archetype shorthand: Use the most iconic short label for characters and scenes rather than verbose descriptions. "lumberjack" beats "bearded man in plaid shirt carrying an axe". "picnic" beats "family sitting on a checkered blanket with a basket of food". Name the archetype when one exists.

Visual language: Use concrete nouns, descriptive adjectives, prepositions, and adverbs that describe exactly what you see. Lean on spatial prepositions (above, beside, behind, within, across) and descriptive adjectives (weathered, glossy, intricate, atmospheric).

Synonym stacking for key details: For important details that must appear, use 2–3 synonyms together. "a sleeping slumbering napping cat" reinforces the closed-eyes detail. "a seated resting lounging figure" reinforces the pose.

Art and culture references: Reference artists, art movements, photography styles, historical periods, or design movements when clearly visible.

NEVER USE THESE TOKENS (they degrade image quality and add noise):
- Resolution/quality words: 4K, 6K, 8K, 16K, HD, HDR, ultra HD, high-resolution, 1080p, dpi, ppi, retina display, crystal clear, display quality
- Detail modifiers: ultra detailed, insanely detailed, hyper detailed, extreme detail, maximum detail, super detailed
- Realism buzzwords: hyper realistic, ultra realistic
- Render engines: octane render, unreal engine, v-ray, lumion, renderman, blender render, arnold render, redshift render, cycles render
- Platform tags: masterpiece, award-winning, trending, trending on ArtStation, trending on DeviantArt, ArtStation, DeviantArt, Behance, best quality, perfect composition, highest quality
- Weak adverbs: ultra, super, hyper, insanely, extremely, remarkably

Camera metadata: Only use lens/aperture values (85mm, f/1.4) if the image clearly has a photographic look where that framing is the dominant characteristic. Never use them as generic quality boosters.

Lighting: Describe by what it looks like, not by jargon. "warm amber backlight casting long soft shadows" beats "cinematic lighting". "diffuse cool overhead light" beats "studio lighting".

Output ONLY the descriptive prompt text. No Midjourney parameters (--v, --ar, --style, --q, etc.).`,
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Write a Midjourney prompt to recreate this image. Use archetype shorthand, concrete visual language, and synonym stacking for key details. Output the descriptive prompt text only — no parameters.',
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
