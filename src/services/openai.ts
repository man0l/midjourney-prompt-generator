import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export async function optimizePrompt(prompt: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a Midjourney prompt expert. Your task is to enhance prompts to create digital art masterpieces. 
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

Only use options and parameters that truly enhance the specific prompt. Combine them naturally and don't force them if they don't fit the context. Output should be a clean, natural-sounding prompt that incorporates these elements seamlessly.`
        },
        {
          role: "user",
          content: `<prompt>${prompt}</prompt> Act as a midjourney prompt expert. Add details and appropriate parameters to create a digital art masterpiece to the following <prompt>. Output the new prompt only. Do not output any tags or anything else.`
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    return response.choices[0]?.message?.content || prompt;
  } catch (error) {
    console.error('Error optimizing prompt:', error);
    throw error;
  }
} 