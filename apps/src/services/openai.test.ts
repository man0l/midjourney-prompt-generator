import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }));

vi.mock('../lib/supabaseClient', () => ({
  supabase: { auth: { getSession } },
}));

import { optimizePrompt, OutOfCreditsError } from './openai';

const fetchMock = vi.fn();

beforeEach(() => {
  getSession.mockResolvedValue({
    data: { session: { access_token: 'tok-123' } },
  });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('optimizePrompt', () => {
  it('posts the prompt with the session token and returns optimized text + balance', async () => {
    fetchMock.mockResolvedValue({
      status: 200,
      json: async () => ({ optimized: 'better prompt', creditsRemaining: 2 }),
    });

    const result = await optimizePrompt('my idea');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/optimize');
    expect(init.headers.Authorization).toBe('Bearer tok-123');
    expect(JSON.parse(init.body)).toEqual({ prompt: 'my idea' });
    expect(result).toEqual({ optimized: 'better prompt', creditsRemaining: 2 });
  });

  it('forwards toolType when provided (tool pages)', async () => {
    fetchMock.mockResolvedValue({
      status: 200,
      json: async () => ({ optimized: 'x', creditsRemaining: 1 }),
    });

    await optimizePrompt('todo app', 'cursor');

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      prompt: 'todo app',
      toolType: 'cursor',
    });
  });

  it('throws OutOfCreditsError on a 402 response', async () => {
    fetchMock.mockResolvedValue({
      status: 402,
      json: async () => ({ error: 'out_of_credits' }),
    });

    await expect(optimizePrompt('my idea')).rejects.toBeInstanceOf(OutOfCreditsError);
  });

  it('throws a plain error carrying server error messages', async () => {
    fetchMock.mockResolvedValue({
      status: 502,
      json: async () => ({ error: 'OpenAI exploded' }),
    });

    await expect(optimizePrompt('my idea')).rejects.toThrow('OpenAI exploded');
  });
});
