import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { getSession, linkIdentity, signInWithOAuth, rpc } = vi.hoisted(() => ({
  getSession: vi.fn(),
  linkIdentity: vi.fn(),
  signInWithOAuth: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock('./supabaseClient', () => ({
  supabase: { auth: { getSession, linkIdentity, signInWithOAuth }, rpc },
}));

import {
  completeMergeIfPending,
  initiateAuth,
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
  it('stages credits and re-auths into the existing account', async () => {
    store['pendingAuthProvider'] = 'discord';
    rpc.mockResolvedValue({ data: null, error: null });
    signInWithOAuth.mockResolvedValue({ data: {}, error: null });

    const recovered = await recoverFromIdentityExists();

    expect(recovered).toBe(true);
    expect(rpc).toHaveBeenCalledWith('stage_credit_merge', { p_token: expect.any(String) });
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
