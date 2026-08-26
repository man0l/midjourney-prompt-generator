import { supabase } from '../lib/supabaseClient';

/** Thrown when the server refuses a generation because credits are exhausted. */
export class OutOfCreditsError extends Error {
  constructor(message = "You've used all your free generations for today.") {
    super(message);
    this.name = 'OutOfCreditsError';
  }
}

export interface OptimizeResult {
  optimized: string;
  /** Authoritative balance after the server reserved one credit. */
  creditsRemaining: number | null;
}

export async function optimizePrompt(prompt: string, toolType?: string): Promise<OptimizeResult> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const res = await fetch('/api/optimize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(toolType ? { prompt, toolType } : { prompt }),
  });

  const data = await res.json();
  if (res.status === 402) throw new OutOfCreditsError();
  if (data.error) throw new Error(data.error);
  return {
    optimized: data.optimized || prompt,
    creditsRemaining: typeof data.creditsRemaining === 'number' ? data.creditsRemaining : null,
  };
}
