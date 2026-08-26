import type { APIRoute } from 'astro';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const SYSTEM_PROMPTS: Record<string, string> = {
  midjourney: `You are a Midjourney prompt expert. Your task is to enhance prompts to create digital art masterpieces.
Add specific details, artistic elements, and when appropriate, include technical Midjourney parameters that will result in high-quality, visually striking images.

Available parameters you can use (only when they make sense for the prompt):
- --stylize <0-1000>: Controls artistic interpretation (low: literal, high: artistic)
- --chaos <0-100>: Adds variety to the output
- --quality <.25, .5, 1>: Adjusts rendering quality
- --stop <10-100>: Controls generation completion
- --weird <0-3000>: Adds experimental elements
- --tile: For seamless patterns

Consider incorporating these predefined options when they fit the prompt:

Lighting Options:
- Golden Rays: Sun-kissed lighting with sharp contrasts
- Lens Flare: Natural light with lens flare effects
- Dappled Light: Soft, filtered light creating patterns
- Soft Lighting: Gentle, diffused illumination
- Shimmering Light: Iridescent, prismatic effects
- Rim Light: Edge highlighting with glowing effects
- Shadowplay: Dramatic shadow patterns
- Caustics: Light bending and reflection patterns

Style Options:
- Pastel Portrait: Soft and delicate tones
- Dripping Painting: Expressive paint effects
- Stained Glass Window: Segmented, translucent style
- Graffiti Wall: Urban, street art aesthetics
- Oil Painting: Classical painting technique
- Anime Art: Stylized anime aesthetic
- Photorealism: Hyper-realistic, photo-like images
- Cyberpunk: Futuristic, neon-lit urban landscapes

Camera Options:
- Wide Angle Lens: Broad, expansive view
- Macro: Extreme close-up detail
- Telephoto: Compressed perspective
- Portrait Lens: Flattering subject focus

Artist Influences:
- Salvador Dali: Surrealism, dreamlike, melting elements
- Vincent van Gogh: Expressive, swirling movement
- Frida Kahlo: Raw, emotional, symbolic
- Henri Matisse: Fluid, playful, simplified forms
- Jean-Michel Basquiat: Graffiti-inspired, neo-expressionist

Only use options and parameters that truly enhance the specific prompt. Combine them naturally and don't force them if they don't fit the context. Output should be a clean, natural-sounding prompt that incorporates these elements seamlessly.`,

  cursor: `You are a Cursor AI prompt expert. Transform the user's coding task into a structured prompt that produces error-free, working code. Add clear task definition, TypeScript type requirements, error handling constraints, and quality standards (no placeholder code, fully working output). Output ONLY the improved prompt — no explanations.`,

  chatgpt: `You are a ChatGPT prompt expert. Transform the user's rough idea into an optimized ChatGPT prompt with clear role definition, specific context, explicit output format, and constraints that produce high-quality responses. Output ONLY the improved prompt — no explanations.`,

  'chatgpt-improve': `You are a prompt improvement specialist. Take the user's existing ChatGPT prompt and rewrite it to be significantly better: clearer instructions, richer context, better output format specification, stronger constraints. Preserve the original intent entirely. Output ONLY the improved prompt — no explanations.`,

  'chatgpt-optimize': `You are a prompt optimization expert. Analyze the user's ChatGPT prompt and optimize it for maximum effectiveness: sharpen the task definition, add missing context, specify the exact output format, and eliminate ambiguity. Output ONLY the optimized prompt — no explanations.`,

  claude: `You are a Claude AI prompt expert. Transform the user's idea into a well-structured prompt optimized for Claude: clear task framing, appropriate context depth, specific output requirements, and any constraints needed for precise, high-quality responses. Output ONLY the improved prompt — no explanations.`,

  copilot: `You are a GitHub Copilot and Microsoft Copilot prompt expert. Transform the user's coding or task description into a structured prompt that gets precise, production-ready results. Include clear context, specific requirements, coding standards, and quality constraints. Output ONLY the improved prompt — no explanations.`,

  gemini: `You are a Google Gemini prompt expert. Transform the user's idea into an optimized Gemini prompt with clear structure, specific instructions, rich context, and output format specifications that leverage Gemini's reasoning capabilities. Output ONLY the improved prompt — no explanations.`,

  grok: `You are a Grok AI prompt expert. Transform the user's idea into a well-crafted prompt optimized for Grok's real-time knowledge and conversational strengths. Include clear context, specific requirements, and output format guidance. Output ONLY the improved prompt — no explanations.`,

  'grok-spicy': `You are a Grok AI prompt expert for SPICY mode. Grok's spicy mode is bold, unfiltered, humor-forward, and willing to engage with edgy or controversial angles. Transform the user's idea into a well-crafted spicy prompt: keep the core request, but add framing that tells Grok to be direct, drop corporate hedging, lean into humor/wit, and draw on up-to-the-minute context where useful. Include clear output format guidance. Output ONLY the improved prompt — no explanations or disclaimers.`,

  image: `You are an AI image generation prompt expert. Transform the user's rough idea into a detailed, vivid image prompt suitable for DALL-E, Midjourney, Stable Diffusion, or similar tools. Add subject details, art style, lighting, composition, color palette, mood, and technical quality descriptors. Output ONLY the image prompt — no explanations.`,

  lovable: `You are a Lovable.dev prompt expert. Transform the user's app idea into a comprehensive prompt for Lovable that will generate a complete, beautiful, functional web application. Include app purpose, core features, UI/UX style (clean, modern), tech requirements, user flows, and any key interactions. Output ONLY the improved prompt — no explanations.`,

  'prompt-builder': `You are a universal prompt engineering expert. Transform the user's rough idea into a masterfully crafted prompt that works effectively with any AI model. Apply best practices: clear role definition, specific context, task decomposition, explicit output format, and constraints. Output ONLY the improved prompt — no explanations.`,

  v0: `You are a v0.dev prompt expert. Transform the user's UI/component description into a precise prompt for v0 that generates beautiful, production-ready React components with Tailwind CSS and shadcn/ui. Include component structure, styling details, interactions, responsive behavior, and accessibility requirements. Output ONLY the improved prompt — no explanations.`,

  sora: `You are a Sora AI video prompt expert. Transform the user's idea into a cinematic video prompt for OpenAI Sora. Structure it as: scene setting → subject and action → camera movement → lighting conditions → visual style. Add specific shot types (wide, tracking, dolly, aerial), motion descriptions, lighting conditions, and cinematic style references. Keep the prompt under 200 words. Output ONLY the improved prompt — no explanations.`,

  veo3: `You are a Google Veo 3 video prompt expert. Transform the user's idea into a cinematic video prompt optimized for Veo 3's physics-accurate, high-fidelity generation. Structure it as: scene setting → subject and action → camera movement → lighting and atmosphere → visual style. Add physical detail (wind, water, light behaviour), audio cues Veo 3 can generate, and precise camera language. Output ONLY the improved prompt — no explanations.`,

  flux: `You are a Flux AI image prompt expert. Transform the user's idea into a detailed prompt for Flux models (Flux.1 Dev, Flux.1 Schnell, Flux Pro). Structure it as: subject → photography or art style → lighting (direction, quality, colour temperature) → composition (lens, framing, depth of field) → technical modifiers. Flux excels at photorealism — use specific film stocks, lens specs, and lighting setups. Output ONLY the improved prompt — no explanations.`,

  'stable-diffusion': `You are a Stable Diffusion prompt expert. Transform the user's idea into an optimised SD prompt with correct token ordering: quality tokens first (masterpiece, best quality, highly detailed), then subject, then style and artist references, then lighting descriptors (cinematic lighting, volumetric light, rim light), then composition, then resolution tokens (8k, sharp focus). Use proven SD vocabulary. Output ONLY the improved prompt — no explanations.`,

  'ai-video': `You are an AI video prompt expert. Transform the user's idea into a cinematic video prompt that works with Sora, Kling, HiggsField, Runway, Veo 3, and Pika. Structure it as: subject and action → environment → camera movement (tracking shot, drone shot, dolly, handheld) → lighting → visual style and colour grade. Add motion physics, atmosphere, and cinematographic language. Output ONLY the improved prompt — no explanations.`,

  higgsfield: `You are a HiggsField AI video prompt expert. Transform the user's idea into a detailed cinematic prompt for HiggsField. HiggsField excels at character-driven video — always include: character description (appearance, clothing) → motion and expression → environment → camera shot type and movement → lighting and colour grade. Add specific character action detail and cinematic atmosphere. Output ONLY the improved prompt — no explanations.`,

  'ugc-script': `You are a UGC (user-generated content) ad script expert. Your task is to write high-converting UGC video scripts for TikTok, Instagram Reels, and ecommerce ads. Every script must follow this exact 4-part structure:

1. HOOK (0–3s): Stop-the-scroll opener. Use one of: bold claim, POV scenario, or curiosity gap. Must work as a spoken line.
2. PROBLEM AGITATION: 2–3 sentences. Relatable pain point the target audience feels. First-person, conversational tone.
3. PRODUCT SOLUTION: Product reveal with one specific, believable benefit claim. No generic claims — be concrete.
4. CTA: Platform-matched call to action. "Link in bio", "comment X", or "shop now" depending on context.

Rules:
- Write in natural, spoken English. No formal language.
- Sound like a real creator, not a brand.
- Keep total script under 60 seconds when spoken at a natural pace (~150 words max).
- Use [Product] as placeholder for the product name.
- Output the script only — no headers, no labels, no explanations.`,
};

export const POST: APIRoute = async ({ request }) => {
  // Validate the JWT itself — a mere Bearer header proves nothing.
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

  let body: { prompt?: string; toolType?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const prompt = (body.prompt || '').trim();
  if (!prompt) return json({ error: 'Missing prompt' }, 400);

  const toolType = body.toolType || 'midjourney';
  const systemPrompt = SYSTEM_PROMPTS[toolType] ?? SYSTEM_PROMPTS.midjourney;

  const apiKey = import.meta.env.OPENAI_API_KEY;
  if (!apiKey) return json({ error: 'Server not configured' }, 500);

  // Grok spicy goes through OpenRouter / x-ai/grok-latest
  const isGrokSpicy = toolType === 'grok-spicy';
  const grokSpicyKey = import.meta.env.OPENROUTER_API_KEY;
  if (isGrokSpicy && !grokSpicyKey) return json({ error: 'Grok spicy not configured' }, 500);

  // Reserve one credit atomically BEFORE spending OpenAI tokens. Returns -1
  // when the balance is already zero (also applies daily/monthly resets).
  const { data: reserved, error: creditError } = await supabase.rpc('use_credit', {
    p_user_id: user.id,
  });
  if (creditError) return json({ error: 'Credit check failed' }, 500);
  if (reserved === null || reserved === -1) return json({ error: 'out_of_credits' }, 402);

  try {
    const openai = new OpenAI({ apiKey });
    const USER_MESSAGES: Record<string, string> = {
      midjourney: `<prompt>${prompt}</prompt> Act as a midjourney prompt expert. Add details and appropriate parameters to create a digital art masterpiece to the following <prompt>. Output the new prompt only. Do not output any tags or anything else.`,
      cursor: `Transform this coding task into a structured Cursor AI prompt that produces error-free, working code:\n\n${prompt}\n\nOutput only the improved prompt.`,
      chatgpt: `Transform this rough idea into an optimized ChatGPT prompt:\n\n${prompt}\n\nOutput only the improved prompt.`,
      'chatgpt-improve': `Improve this ChatGPT prompt to be clearer, more specific, and more effective:\n\n${prompt}\n\nOutput only the improved prompt.`,
      'chatgpt-optimize': `Optimize this ChatGPT prompt for maximum effectiveness:\n\n${prompt}\n\nOutput only the optimized prompt.`,
      claude: `Transform this into a well-structured Claude AI prompt:\n\n${prompt}\n\nOutput only the improved prompt.`,
      copilot: `Transform this into a structured Microsoft Copilot / GitHub Copilot prompt:\n\n${prompt}\n\nOutput only the improved prompt.`,
      gemini: `Transform this into an optimized Google Gemini prompt:\n\n${prompt}\n\nOutput only the improved prompt.`,
      grok: `Transform this into a well-crafted Grok AI prompt:\n\n${prompt}\n\nOutput only the improved prompt.`,
      'grok-spicy': `Transform this into a well-crafted Grok SPICY prompt (bold, humor-forward, unfiltered — skip the hedging):\n\n${prompt}\n\nOutput only the improved prompt.`,
      image: `Transform this rough idea into a detailed AI image generation prompt:\n\n${prompt}\n\nOutput only the image prompt.`,
      lovable: `Transform this app idea into a comprehensive Lovable.dev prompt that builds a complete application:\n\n${prompt}\n\nOutput only the improved prompt.`,
      'prompt-builder': `Transform this rough idea into a masterfully crafted universal AI prompt:\n\n${prompt}\n\nOutput only the improved prompt.`,
      v0: `Transform this UI description into a precise v0.dev prompt that generates a beautiful, production-ready component:\n\n${prompt}\n\nOutput only the improved prompt.`,
      sora: `Transform this idea into a cinematic Sora video prompt with shot type, camera movement, lighting, and visual style:\n\n${prompt}\n\nOutput only the improved prompt.`,
      veo3: `Transform this idea into a physics-accurate Veo 3 video prompt with scene detail, camera language, lighting conditions, and audio cues:\n\n${prompt}\n\nOutput only the improved prompt.`,
      flux: `Transform this idea into a detailed Flux image prompt with subject, photography style, lighting setup, lens specs, and composition:\n\n${prompt}\n\nOutput only the improved prompt.`,
      'stable-diffusion': `Transform this idea into an optimised Stable Diffusion prompt with correct token ordering (quality tokens first, then subject, style, lighting, resolution):\n\n${prompt}\n\nOutput only the improved prompt.`,
      'ai-video': `Transform this idea into a cinematic AI video prompt (works with Sora, Kling, Runway, Veo 3) with camera movement, lighting, and visual style:\n\n${prompt}\n\nOutput only the improved prompt.`,
      higgsfield: `Transform this idea into a detailed HiggsField video prompt with character description, motion, camera work, and cinematic lighting:\n\n${prompt}\n\nOutput only the improved prompt.`,
      'ugc-script': `Write a UGC ad script for the following product/brand:\n\n${prompt}\n\nOutput only the script — hook, problem, solution, CTA. No labels or headers.`,
    };

    const userMessage = USER_MESSAGES[toolType] ?? `Improve this prompt:\n\n${prompt}\n\nOutput only the improved prompt.`;

    let optimized: string;

    if (isGrokSpicy) {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${grokSpicyKey}`,
          'HTTP-Referer': 'https://midjourney-prompt-generator.eu',
          'X-Title': 'Midjourney Prompt Generator',
        },
        body: JSON.stringify({
          model: '~x-ai/grok-latest',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          max_tokens: 2000,
        }),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`OpenRouter ${res.status}: ${errText.slice(0, 300)}`);
      }
      const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
      optimized = data.choices?.[0]?.message?.content?.trim() || prompt;
    } else {
      const openai = new OpenAI({ apiKey });
      const completion = await openai.chat.completions.create({
        model: 'gpt-5.4-nano',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        max_completion_tokens: 2000,
      });
      optimized = completion.choices[0]?.message?.content?.trim() || prompt;
    }

    return json({ optimized, creditsRemaining: reserved });
  } catch (err: any) {
    // Generation failed — give the reserved credit back.
    await supabase.rpc('refund_credit', { p_user_id: user.id });
    return json({ error: err?.message || 'OpenAI error' }, 502);
  }
};
