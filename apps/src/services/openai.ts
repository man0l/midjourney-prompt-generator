import { supabase } from '../lib/supabaseClient';

export async function optimizePrompt(prompt: string): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const res = await fetch('/api/optimize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ prompt }),
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.optimized || prompt;
} 