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
        content: `You are a Midjourney prompt expert. Your PRIMARY job is to capture the visual style so precisely that someone could regenerate the exact same look. Scene description is secondary — style is everything.

═══ STEP 1 — IDENTIFY THE STYLE DNA (always first, always thorough) ═══

You MUST identify and name the specific visual style with precision. "animated style" or "cartoon style" is NEVER acceptable — they are too vague to reproduce. Instead drill down:

Rendering technique — pick the most accurate:
  • 3D render: Pixar-style 3D, DreamWorks 3D, Illumination (Despicable Me) style, Disney CGI, stylized 3D render, soft subsurface 3D, clay-render, toon-shaded 3D
  • 2D animation: Disney golden-age hand-drawn, Disney Revival (Tangled/Frozen), Saturday morning cartoon, Hanna-Barbera, anime (shonen, shojo, Studio Ghibli, Kyoto Animation), flat 2D vector animation
  • Illustration: children's book illustration, editorial illustration, concept art, graphic novel, comic book (Marvel/DC house style, indie comic), storybook watercolor, gouache illustration
  • Other: cel-shaded, pixel art, stop-motion aesthetic, paper cutout, oil painting, pastel illustration

Character design specifics (when characters are present):
  • Head-to-body ratio: large head chibi (2–3 heads tall), normal cartoon (4–5 heads), semi-realistic
  • Eyes: large expressive anime eyes, small dot eyes, realistic eyes, half-circle eyes
  • Face structure: rounded soft faces, angular stylized, simplified flat shapes
  • Skin shading: flat with no shading, cell-shaded with hard shadow, soft gradient shading, subsurface glow

Color treatment:
  • Saturation: vivid saturated, muted pastel, earthy desaturated, neon
  • Color harmony: warm dominant (oranges, ambers), cool dominant, complementary split
  • Shading style: flat color, two-tone cell shading, soft airbrushed gradients, painterly blended

Lighting approach — describe what you see visually:
  • "warm golden rim light from behind with soft fill from the front"
  • "flat ambient light with no strong shadows, even pastel tones"
  • "dramatic top-down light with hard toon shadows"

Reference the closest known studio/artist/film if recognizable:
  • "in the style of Pixar's Coco", "Illumination Studios character design", "Studio Ghibli background painting", "early 2000s Disney Channel cartoon", "Cartoon Network Adventure Time flat design", "Craig McCracken style"
  • For illustration: "in the style of Mary Blair", "Charley Harper flat illustration", "James Jean concept art"

═══ STEP 2 — DESCRIBE THE SCENE ═══

After nailing the style, describe subject, composition, and setting using:
  • Archetype shorthand: "lumberjack" not "bearded man with axe". "picnic" not "family on checkered blanket".
  • Synonym stacking for key details: "sleeping slumbering napping cat" to reinforce closed eyes.
  • Spatial prepositions: above, beside, behind, within, across, in front of.

═══ NEVER USE THESE TOKENS ═══
4K, 8K, HD, HDR, ultra HD, high-resolution, dpi, retina display, crystal clear,
ultra detailed, insanely detailed, hyper detailed, maximum detail,
hyper realistic, ultra realistic,
octane render, unreal engine, v-ray, lumion, renderman, blender render, arnold render,
studio lighting, professional lighting, volumetric lighting, global illumination, ray tracing,
masterpiece, award-winning, trending, ArtStation, DeviantArt, Behance,
perfect composition, best quality, highest quality,
ultra, super, hyper, insanely, extremely.

Output ONLY the descriptive prompt text. No Midjourney parameters.`,
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Analyze this image. Start with a precise, detailed style description (rendering technique, character design, color treatment, shading, studio/artist reference). Then describe the scene. Output the Midjourney prompt text only — no parameters.',
          },
          {
            type: 'image_url',
            image_url: { url: imageUrl, detail: 'high' },
          },
        ],
      },
    ],
    max_completion_tokens: 800,
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
