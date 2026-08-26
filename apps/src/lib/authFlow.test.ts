import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { getSession, linkIdentity, signInWithOAuth } = vi.hoisted(() => ({
  getSession: vi.fn(),
  linkIdentity: vi.fn(),
  signInWithOAuth: vi.fn(),
}));

vi.mock('./supabaseClient', () => ({
  supabase: { auth: { getSession, linkIdentity, signInWithOAuth } },
}));

import { initiateAuth, resolveAuthFlow } from './authFlow';

const anonSession = { user: { id: 'a1', is_anonymous: true } };
const realSession = { user: { id: 'r1', email: 'x@y.z', is_anonymous: false } };

beforeEach(() => {
  vi.clearAllMocks();
  // @ts-expect-error test stub for browser global
  globalThis.window = { location: { origin: 'https://test.local' } };
});

afterEach(() => {
  // @ts-expect-error test stub for browser global
  delete globalThis.window;
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
});
