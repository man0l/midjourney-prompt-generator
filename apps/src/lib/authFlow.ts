import { supabase } from './supabaseClient';
import type { Session } from '@supabase/supabase-js';

export type AuthProvider = 'google' | 'discord';
export type AuthFlow = 'link' | 'oauth';

/**
 * Anonymous sessions must be *linked* to the chosen provider (not signed in
 * fresh) so the user keeps their user id, credits, and history. The DB grants
 * the welcome bonus when is_anonymous flips to false.
 */
export function resolveAuthFlow(session: Session | null): AuthFlow {
  return session?.user?.is_anonymous ? 'link' : 'oauth';
}

/**
 * True when the visitor is anonymous or has no account — the audience for the
 * hard sign-in nudge when they run out of credits. Signed-in users get the
 * plain limit toast and the pricing link instead.
 */
export function shouldNudgeSignIn(session: Session | null): boolean {
  return !session || session.user?.is_anonymous === true;
}

/** Redirects to the OAuth provider; the result lands in /auth/callback. */
export async function initiateAuth(provider: AuthProvider): Promise<{ error?: string }> {
  if (!supabase) return { error: 'Auth unavailable' };

  const { data: { session } } = await supabase.auth.getSession();
  const redirectTo = `${window.location.origin}/auth/callback`;
  const flow = resolveAuthFlow(session);

  const result = flow === 'link'
    ? await supabase.auth.linkIdentity({ provider, options: { redirectTo } })
    : await supabase.auth.signInWithOAuth({
        provider,
        options: provider === 'discord'
          ? { redirectTo, scopes: 'identify email' }
          : { redirectTo },
      });

  return result.error ? { error: result.error.message } : {};
}
