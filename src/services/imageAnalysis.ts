import OpenAI from 'openai';
import { supabase } from '../lib/supabase';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export async function uploadAndAnalyzeImage(file: File): Promise<string> {
  try {
    // Check if user is authenticated
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      throw new Error('You must be logged in to upload images');
    }

    // Validate file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      throw new Error('Image size must be less than 20MB');
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    // Upload to Supabase Storage
    const fileName = `${Date.now()}-${file.name}`;
    const { data: _, error: uploadError } = await supabase.storage
      .from('inspiration-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw new Error(`Failed to upload image to storage: ${uploadError.message}`);
    }

    // Get the public URL for the uploaded image
    const { data: { publicUrl } } = supabase.storage
      .from('inspiration-images')
      .getPublicUrl(fileName);

    // Analyze the image using OpenAI Vision
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a Midjourney prompt expert. Your task is to analyze images and create prompts that would recreate them.
Focus on:
1. Main subject and composition
2. Artistic style and technique
3. Lighting and atmosphere
4. Color palette and mood
5. Technical details (camera angle, perspective)
6. Relevant Midjourney parameters

Format the prompt to include appropriate Midjourney parameters when they would enhance the recreation.`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Create a detailed Midjourney prompt that would recreate this image. Include style, lighting, composition, and any relevant Midjourney parameters. Output the prompt only."
            },
            {
              type: "image_url",
              image_url: {
                url: publicUrl,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 500
    });

    // Optionally, clean up the uploaded file if you don't need to keep it
    // await supabase.storage.from('images').remove([fileName]);

    const generatedPrompt = response.choices[0]?.message?.content;
    if (!generatedPrompt) {
      throw new Error('Failed to generate prompt from image');
    }

    return generatedPrompt;
  } catch (error) {
    console.error('Error in uploadAndAnalyzeImage:', error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('Failed to analyze image');
  }
} 