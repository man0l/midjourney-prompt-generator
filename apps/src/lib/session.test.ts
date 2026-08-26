import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getSession, signInAnonymously } = vi.hoisted(() => ({
  getSession: vi.fn(),
  signInAnonymously: vi.fn(),
}));

vi.mock('./supabaseClient', () => ({
  supabase: { auth: { getSession, signInAnonymously } },
}));

import { ensureSession } from './session';

const sessionOf = (overrides: Record<string, unknown> = {}) =>
  ({ user: { id: 'u1' }, access_token: 'tok', ...overrides }) as any;

describe('ensureSession', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the existing session without signing in again', async () => {
    const existing = sessionOf();
    getSession.mockResolvedValue({ data: { session: existing } });

    const result = await ensureSession();

    expect(result).toBe(existing);
    expect(signInAnonymously).not.toHaveBeenCalled();
  });

  it('signs in anonymously when there is no session (first free generation)', async () => {
    const anon = sessionOf({ user: { id: 'anon-1', is_anonymous: true } });
    getSession.mockResolvedValue({ data: { session: null } });
    signInAnonymously.mockResolvedValue({ data: { session: anon, user: anon.user }, error: null });

    const result = await ensureSession();

    expect(result).toBe(anon);
    expect(signInAnonymously).toHaveBeenCalledTimes(1);
  });

  it('returns null when anonymous sign-in fails (feature disabled / rate limited)', async () => {
    getSession.mockResolvedValue({ data: { session: null } });
    signInAnonymously.mockResolvedValue({
      data: { session: null },
      error: { message: 'Anonymous sign-ins disabled' },
    });
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await ensureSession();

    expect(result).toBeNull();
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it('returns null when the response carries no session', async () => {
    getSession.mockResolvedValue({ data: { session: null } });
    signInAnonymously.mockResolvedValue({ data: { session: null }, error: null });
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await ensureSession();

    expect(result).toBeNull();
    errSpy.mockRestore();
  });
});
