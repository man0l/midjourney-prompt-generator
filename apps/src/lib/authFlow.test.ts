import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { getSession, linkIdentity, signInWithOAuth, signOut, rpc } = vi.hoisted(() => ({
  getSession: vi.fn(),
  linkIdentity: vi.fn(),
  signInWithOAuth: vi.fn(),
  signOut: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock('./supabaseClient', () => ({
  supabase: { auth: { getSession, linkIdentity, signInWithOAuth, signOut }, rpc },
}));

import {
  clearOAuthErrorFromUrl,
  completeMergeIfPending,
  initiateAuth,
  readOAuthError,
  recoverFromIdentityExists,
  resolveAuthFlow,
  shouldNudgeSignIn,
} from './authFlow';

const anonSession = { user: { id: 'a1', is_anonymous: true } };
const realSession = { user: { id: 'r1', email: 'x@y.z', is_anonymous: false } };

let store: Record<string, string>;

beforeEach(() => {
  vi.clearAllMocks();
  // @ts-expect-error test stub for browser globals
  globalThis.window = { location: { origin: 'https://test.local' } };
  store = {};
  // @ts-expect-error test stub for localStorage
  globalThis.localStorage = {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
  };
});

afterEach(() => {
  // @ts-expect-error test stub for browser globals
  delete globalThis.window;
  // @ts-expect-error test stub for localStorage
  delete globalThis.localStorage;
});

describe('resolveAuthFlow', () => {
  it('links anonymous sessions so credits carry over', () => {
    expect(resolveAuthFlow(anonSession as any)).toBe('link');
  });

  it('uses plain OAuth for real sessions', () => {
    expect(resolveAuthFlow(realSession as any)).toBe('oauth');
    expect(resolveAuthFlow(null)).toBe('oauth');
  });
});

describe('shouldNudgeSignIn', () => {
  it('nudges anonymous and signed-out visitors (the conversion audience)', () => {
    expect(shouldNudgeSignIn(anonSession as any)).toBe(true);
    expect(shouldNudgeSignIn(null)).toBe(true);
  });

  it('does not nudge fully signed-in users', () => {
    expect(shouldNudgeSignIn(realSession as any)).toBe(false);
  });
});

describe('initiateAuth', () => {
  it('calls linkIdentity for anonymous users (upgrade path)', async () => {
    getSession.mockResolvedValue({ data: { session: anonSession } });
    linkIdentity.mockResolvedValue({ data: {}, error: null });

    await initiateAuth('google');

    expect(linkIdentity).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: 'https://test.local/auth/callback' },
    });
    expect(signInWithOAuth).not.toHaveBeenCalled();
  });

  it('calls signInWithOAuth for signed-out users', async () => {
    getSession.mockResolvedValue({ data: { session: null } });
    signInWithOAuth.mockResolvedValue({ data: {}, error: null });

    await initiateAuth('google');

    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: 'https://test.local/auth/callback' },
    });
    expect(linkIdentity).not.toHaveBeenCalled();
  });

  it('requests the discord email scope on OAuth sign-in', async () => {
    getSession.mockResolvedValue({ data: { session: null } });
    signInWithOAuth.mockResolvedValue({ data: {}, error: null });

    await initiateAuth('discord');

    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: 'discord',
      options: { redirectTo: 'https://test.local/auth/callback', scopes: 'identify email' },
    });
  });

  it('surfaces provider errors', async () => {
    getSession.mockResolvedValue({ data: { session: null } });
    signInWithOAuth.mockResolvedValue({ data: {}, error: { message: 'provider down' } });

    const result = await initiateAuth('discord');

    expect(result.error).toBe('provider down');
  });

  it('remembers the provider so identity_already_exists can recover', async () => {
    getSession.mockResolvedValue({ data: { session: anonSession } });
    linkIdentity.mockResolvedValue({ data: {}, error: null });

    await initiateAuth('google');

    expect(store['pendingAuthProvider']).toBe('google');
  });
});

describe('recoverFromIdentityExists', () => {
  it('stages credits, signs out the anon session, then re-auths', async () => {
    store['pendingAuthProvider'] = 'discord';
    rpc.mockResolvedValue({ data: null, error: null });
    signOut.mockResolvedValue({});
    signInWithOAuth.mockResolvedValue({ data: {}, error: null });

    const recovered = await recoverFromIdentityExists();

    expect(recovered).toBe(true);
    expect(rpc).toHaveBeenCalledWith('stage_credit_merge', { p_token: expect.any(String) });
    // The anonymous session must be gone before redirecting: GoTrue treats a
    // cookie-authenticated /authorize as a link attempt and the same conflict
    // would fire right back.
    expect(signOut).toHaveBeenCalledTimes(1);
    const [stagedBeforeSignOut, signedOutBeforeRedirect] = [
      rpc.mock.invocationCallOrder[0]! < signOut.mock.invocationCallOrder[0]!,
      signOut.mock.invocationCallOrder[0]! < signInWithOAuth.mock.invocationCallOrder[0]!,
    ];
    expect(stagedBeforeSignOut && signedOutBeforeRedirect).toBe(true);

    const call = signInWithOAuth.mock.calls[0][0];
    expect(call.provider).toBe('discord');
    expect(call.options.redirectTo).toMatch(/^https:\/\/test\.local\/auth\/callback\?merge=[0-9a-f-]{36}$/);
    expect(call.options.scopes).toBe('identify email');
    expect(store['mergeAttempted']).toBeDefined();
  });

  it('gives up without looping when already attempted once', async () => {
    store['pendingAuthProvider'] = 'google';
    store['mergeAttempted'] = 'some-token';

    const recovered = await recoverFromIdentityExists();

    expect(recovered).toBe(false);
    expect(rpc).not.toHaveBeenCalled();
    expect(signInWithOAuth).not.toHaveBeenCalled();
    expect(store['mergeAttempted']).toBeUndefined();
  });

  it('does nothing without a remembered provider', async () => {
    const recovered = await recoverFromIdentityExists();

    expect(recovered).toBe(false);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('aborts when staging fails', async () => {
    store['pendingAuthProvider'] = 'google';
    rpc.mockResolvedValue({ data: null, error: { message: 'insufficient privilege' } });

    const recovered = await recoverFromIdentityExists();

    expect(recovered).toBe(false);
    expect(signInWithOAuth).not.toHaveBeenCalled();
    expect(store['mergeAttempted']).toBeUndefined();
  });
});

describe('completeMergeIfPending', () => {
  it('transfers staged credits and clears the loop guard', async () => {
    store['mergeAttempted'] = 'tok';
    rpc.mockResolvedValue({ data: 3, error: null });

    const transferred = await completeMergeIfPending('tok');

    expect(transferred).toBe(3);
    expect(rpc).toHaveBeenCalledWith('complete_credit_merge', { p_token: 'tok' });
    expect(store['mergeAttempted']).toBeUndefined();
  });

  it('returns 0 on rpc error or missing token', async () => {
    store['mergeAttempted'] = 'tok';
    rpc.mockResolvedValue({ data: null, error: { message: 'boom' } });
    expect(await completeMergeIfPending('tok')).toBe(0);

    rpc.mockClear();
    expect(await completeMergeIfPending(null)).toBe(0);
    expect(rpc).not.toHaveBeenCalled();
  });
});

describe('readOAuthError', () => {
  it('parses errors delivered in the hash fragment (authorize-phase failures)', () => {
    // @ts-expect-error test stub for browser globals
    globalThis.window = {
      location: { search: '', hash: '#error=server_error&error_code=identity_already_exists&error_description=Identity+is+already+linked+to+another+user&sb=al' },
    };
    try {
      expect(readOAuthError()).toEqual({
        error: 'server_error',
        code: 'identity_already_exists',
        description: 'Identity is already linked to another user',
      });
    } finally {
      // @ts-expect-error test stub for browser globals
      delete globalThis.window;
    }
  });

  it('parses query-string delivery and lets query values win on collision', () => {
    // @ts-expect-error test stub for browser globals
    globalThis.window = {
      location: { search: '?error=access_denied&error_code=bad_code', hash: '#error=server_error&sb=x' },
    };
    try {
      expect(readOAuthError()).toEqual({ error: 'access_denied', code: 'bad_code', description: null });
    } finally {
      // @ts-expect-error test stub for browser globals
      delete globalThis.window;
    }
  });

  it('returns null when no OAuth error params are present', () => {
    // @ts-expect-error test stub for browser globals
    globalThis.window = { location: { search: '?utm_source=x', hash: '#pricing' } };
    try {
      expect(readOAuthError()).toBeNull();
    } finally {
      // @ts-expect-error test stub for browser globals
      delete globalThis.window;
    }
  });
});

describe('clearOAuthErrorFromUrl', () => {
  it('strips OAuth error params from both query and fragment', () => {
    const replaceState = vi.fn();
    // @ts-expect-error test stub for browser globals
    globalThis.window = {
      location: { href: 'https://test.local/?keep=1&error=server_error&error_description=oink#pass=true&error_code=identity_already_exists' },
      history: { replaceState },
    };
    try {
      clearOAuthErrorFromUrl();
      const replaced = replaceState.mock.calls[0][2] as string;
      expect(replaced.startsWith('https://test.local/?keep=1')).toBe(true);
      expect(replaced).not.toContain('error');
    } finally {
      // @ts-expect-error test stub for browser globals
      delete globalThis.window;
    }
  });
});
