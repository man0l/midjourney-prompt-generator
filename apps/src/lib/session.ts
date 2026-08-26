import { supabase } from './supabaseClient';
import type { Session } from '@supabase/supabase-js';

/**
 * Returns the current session, transparently upgrading a first-time visitor
 * to an anonymous account (3 free generations/day) when they trigger a
 * paid action. No sign-in modal, no friction.
 *
 * Returns null only if anonymous sign-in fails (feature disabled server-side,
 * rate limited) — callers should fall back to the sign-in modal.
 */
export async function ensureSession(): Promise<Session | null> {
  if (!supabase) return null;

  const { data: { session } } = await supabase.auth.getSession();
  if (session) return session;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.session) {
    console.error('Anonymous sign-in failed:', error?.message);
    return null;
  }
  return data.session;
}
