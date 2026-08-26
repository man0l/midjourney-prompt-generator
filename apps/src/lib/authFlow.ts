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

  // The callback needs to know which provider to re-auth with if GoTrue
  // rejects the link because the identity belongs to an existing account.
  localStorage.setItem(PENDING_PROVIDER_KEY, provider);

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

const PENDING_PROVIDER_KEY = 'pendingAuthProvider';
const MERGE_GUARD_KEY = 'mergeAttempted';

/**
 * Recovery for GoTrue's identity_already_exists: the visitor is anonymous and
 * tried to link a Google/Discord identity that already belongs to an older
 * account. GoTrue refuses the link, so instead we stage the anonymous
 * session's remaining credits under a one-time token and sign in to the
 * existing account; /auth/callback then transfers the credits.
 *
 * Returns true if re-auth was kicked off (the page is about to redirect).
 * A guard flag prevents redirect loops if the same error comes back.
 */
export async function recoverFromIdentityExists(): Promise<boolean> {
  if (!supabase || typeof localStorage === 'undefined') return false;

  const provider = localStorage.getItem(PENDING_PROVIDER_KEY) as AuthProvider | null;
  if (!provider) return false;
  if (localStorage.getItem(MERGE_GUARD_KEY)) {
    // Already attempted once — don't loop.
    localStorage.removeItem(MERGE_GUARD_KEY);
    return false;
  }

  const token = crypto.randomUUID();
  const { error } = await supabase.rpc('stage_credit_merge', { p_token: token });
  if (error) return false;

  localStorage.setItem(MERGE_GUARD_KEY, token);
  // Stage first, then drop the anonymous session: with manual linking enabled
  // GoTrue treats a cookie-authenticated /authorize as another *link* attempt,
  // which re-fires the same identity_already_exists conflict. Signing out
  // makes the next hop a plain sign-in into the existing account instead.
  await supabase.auth.signOut();
  const redirectTo = `${window.location.origin}/auth/callback?merge=${token}`;
  await supabase.auth.signInWithOAuth({
    provider,
    options: provider === 'discord'
      ? { redirectTo, scopes: 'identify email' }
      : { redirectTo },
  });
  return true;
}

/**
 * Called from /auth/callback with the merge token once the existing account's
 * session is active. Transfers the staged anonymous credits and clears the
 * loop guard. Returns the number of credits transferred (0 if nothing staged).
 */
export async function completeMergeIfPending(token: string | null): Promise<number> {
  localStorage.removeItem(MERGE_GUARD_KEY);
  if (!supabase || !token) return 0;

  const { data, error } = await supabase.rpc('complete_credit_merge', { p_token: token });
  return error ? 0 : (data ?? 0);
}

export interface OAuthError {
  error: string | null;
  code: string | null;
  description: string | null;
}

/**
 * GoTrue lands OAuth failures in either the query string or the hash fragment
 * depending on which phase rejected the request:
 *   /?error=server_error&error_code=identity_already_exists   (callback phase)
 *   /#error=server_error&error_code=identity_already_exists&… (authorize phase)
 * Read both forms; query-string values win when both are present.
 */
export function readOAuthError(): OAuthError | null {
  if (typeof window === 'undefined') return null;

  const merged = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  for (const [key, value] of new URLSearchParams(window.location.search)) {
    merged.set(key, value);
  }

  if (!merged.get('error') && !merged.get('error_code')) return null;
  return {
    error: merged.get('error'),
    code: merged.get('error_code'),
    description: merged.get('error_description'),
  };
}

/** Strips OAuth error params from the query string and drops the fragment. */
export function clearOAuthErrorFromUrl(): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  for (const key of ['error', 'error_code', 'error_description']) url.searchParams.delete(key);
  url.hash = '';
  window.history.replaceState({}, '', url.toString());
}
