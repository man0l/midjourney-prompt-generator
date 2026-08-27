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

  // Async path: POST returns 202 with jobId, poll until done
  if (data.jobId) {
    let attempts = 0;
    while (attempts < 40) {
      await new Promise(r => setTimeout(r, 3000));
      attempts++;
      const pollRes = await fetch(`/api/optimize?id=${encodeURIComponent(data.jobId)}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const pollData = await pollRes.json();
      if (pollData.status === 'done') {
        return {
          optimized: pollData.optimized || prompt,
          creditsRemaining: typeof pollData.creditsRemaining === 'number' ? pollData.creditsRemaining : null,
        };
      }
      if (pollData.status === 'error' || pollRes.status >= 500) throw new Error(pollData.error || 'Generation failed');
    }
    throw new Error('Generation timed out — please try again.');
  }

  return {
    optimized: data.optimized || prompt,
    creditsRemaining: typeof data.creditsRemaining === 'number' ? data.creditsRemaining : null,
  };
}
