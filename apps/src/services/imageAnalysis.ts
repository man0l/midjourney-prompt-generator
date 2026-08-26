import { supabase } from '../lib/supabaseClient';
import { OutOfCreditsError } from './openai';

export interface ImageAnalysisResult {
  prompt: string;
  /** Authoritative balance after the server reserved one credit. */
  creditsRemaining: number | null;
}

export async function uploadAndAnalyzeImage(file: File): Promise<ImageAnalysisResult> {
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  if (authError || !session) {
    throw new Error('You must be logged in to upload images');
  }

  if (file.size > 20 * 1024 * 1024) {
    throw new Error('Image size must be less than 20MB');
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  const fileName = `${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from('inspiration-images')
    .upload(fileName, file, { cacheControl: '3600', upsert: false });

  if (uploadError) {
    throw new Error(`Failed to upload image to storage: ${uploadError.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from('inspiration-images')
    .getPublicUrl(fileName);

  const res = await fetch('/api/analyze-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ imageUrl: publicUrl }),
  });

  const data = await res.json();
  if (res.status === 402) throw new OutOfCreditsError();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to analyze image');
  }

  return {
    prompt: data.prompt,
    creditsRemaining: typeof data.creditsRemaining === 'number' ? data.creditsRemaining : null,
  };
}
