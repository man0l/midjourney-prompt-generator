import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './optimize';

const { getUser, rpc, completionsCreate } = vi.hoisted(() => ({
  getUser: vi.fn(),
  rpc: vi.fn(),
  completionsCreate: vi.fn(),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ auth: { getUser }, rpc })),
}));

vi.mock('openai', () => ({
  default: class MockOpenAI {
    chat = { completions: { create: completionsCreate } };
    // eslint-disable-next-line @typescript-eslint/no-useless-constructor
    constructor(_opts: unknown) {}
  },
}));

const USER_ID = '11111111-1111-4111-8111-111111111111';

function makeRequest(body: unknown, headers: Record<string, string> = {}) {
  return new Request('https://example.com/api/optimize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

const callRoute = (req: Request) =>
  POST({ request: req } as unknown as Parameters<typeof POST>[0]);

/** Wire mocks so auth + credits + OpenAI all succeed. */
function happyPath({ reserved = 2 } = {}) {
  getUser.mockResolvedValue({ data: { user: { id: USER_ID } }, error: null });
  rpc.mockImplementation(async (fn: string) =>
    fn === 'use_credit'
      ? { data: reserved, error: null }
      : { data: reserved + 1, error: null }, // refund_credit
  );
  completionsCreate.mockResolvedValue({
    choices: [{ message: { content: 'an optimized prompt' } }],
  });
}

describe('POST /api/optimize — guard rails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('OPENAI_API_KEY', 'sk-test');
    vi.stubEnv('PUBLIC_SUPABASE_URL', 'https://fake.supabase.co');
    vi.stubEnv('PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
  });

  afterEach(() => vi.unstubAllEnvs());

  it('rejects requests with no Authorization header before touching Supabase or OpenAI', async () => {
    const res = await callRoute(makeRequest({ prompt: 'a cat' }));
    expect(res.status).toBe(401);
    expect(getUser).not.toHaveBeenCalled();
    expect(completionsCreate).not.toHaveBeenCalled();
  });

  it('rejects a fabricated Bearer token — header presence is not enough', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: { message: 'Invalid JWT' } });

    const res = await callRoute(
      makeRequest({ prompt: 'a cat' }, { Authorization: 'Bearer not-a-real-token' }),
    );

    expect(res.status).toBe(401);
    expect(getUser).toHaveBeenCalled();
    expect(completionsCreate).not.toHaveBeenCalled();
  });

  it('returns 400 for a missing prompt even when authenticated', async () => {
    happyPath();
    const res = await callRoute(
      makeRequest({ prompt: '   ' }, { Authorization: 'Bearer good' }),
    );
    expect(res.status).toBe(400);
    expect(completionsCreate).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid JSON body', async () => {
    happyPath();
    const res = await callRoute(makeRequest('{not json', { Authorization: 'Bearer good' }));
    expect(res.status).toBe(400);
  });

  it('returns 402 out_of_credits and never calls OpenAI when the balance is zero', async () => {
    getUser.mockResolvedValue({ data: { user: { id: USER_ID } }, error: null });
    rpc.mockResolvedValue({ data: -1, error: null });

    const res = await callRoute(makeRequest({ prompt: 'a cat' }, { Authorization: 'Bearer good' }));

    expect(res.status).toBe(402);
    const body = await res.json();
    expect(body.error).toBe('out_of_credits');
    expect(rpc).toHaveBeenCalledWith('use_credit', { p_user_id: USER_ID });
    expect(completionsCreate).not.toHaveBeenCalled();
  });

  it('returns 500 and skips OpenAI when the credit RPC itself fails', async () => {
    getUser.mockResolvedValue({ data: { user: { id: USER_ID } }, error: null });
    rpc.mockResolvedValue({ data: null, error: { message: 'boom' } });

    const res = await callRoute(makeRequest({ prompt: 'a cat' }, { Authorization: 'Bearer good' }));

    expect(res.status).toBe(500);
    expect(completionsCreate).not.toHaveBeenCalled();
  });
});

describe('POST /api/optimize — functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('OPENAI_API_KEY', 'sk-test');
    vi.stubEnv('PUBLIC_SUPABASE_URL', 'https://fake.supabase.co');
    vi.stubEnv('PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
  });

  afterEach(() => vi.unstubAllEnvs());

  it('generates an optimized prompt and reports the remaining balance', async () => {
    happyPath({ reserved: 2 });

    const res = await callRoute(makeRequest({ prompt: 'a cat' }, { Authorization: 'Bearer good' }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.optimized).toBe('an optimized prompt');
    expect(body.creditsRemaining).toBe(2);
    expect(completionsCreate).toHaveBeenCalledTimes(1);
  });

  it('reserves the credit BEFORE calling OpenAI', async () => {
    happyPath();

    await callRoute(makeRequest({ prompt: 'a cat' }, { Authorization: 'Bearer good' }));

    const creditCall = rpc.mock.calls.findIndex((c) => c[0] === 'use_credit');
    expect(creditCall).toBeGreaterThanOrEqual(0);
    expect(rpc.mock.invocationCallOrder[creditCall]).toBeLessThan(
      completionsCreate.mock.invocationCallOrder[0],
    );
  });

  it('refunds the reserved credit when generation fails, responding 502', async () => {
    happyPath();
    completionsCreate.mockRejectedValue(new Error('OpenAI exploded'));

    const res = await callRoute(makeRequest({ prompt: 'a cat' }, { Authorization: 'Bearer good' }));

    expect(res.status).toBe(502);
    expect(rpc).toHaveBeenCalledWith('refund_credit', { p_user_id: USER_ID });
    const refundCall = rpc.mock.calls.findIndex((c) => c[0] === 'refund_credit');
    expect(refundCall).toBeGreaterThanOrEqual(0);
    expect(rpc.mock.invocationCallOrder[refundCall]).toBeGreaterThan(
      completionsCreate.mock.invocationCallOrder[0],
    );
  });

  it('falls back to the midjourney system prompt for unknown toolTypes', async () => {
    happyPath();

    const res = await callRoute(
      makeRequest({ prompt: 'a cat', toolType: 'does-not-exist' }, { Authorization: 'Bearer good' }),
    );

    expect(res.status).toBe(200);
    const [payload] = completionsCreate.mock.calls[0];
    expect(payload.messages[0].content).toContain('Midjourney prompt expert');
  });

  it('uses the matching system prompt for a known toolType', async () => {
    happyPath();

    await callRoute(
      makeRequest({ prompt: 'todo app', toolType: 'cursor' }, { Authorization: 'Bearer good' }),
    );

    const [payload] = completionsCreate.mock.calls[0];
    expect(payload.messages[0].content).toContain('Cursor AI prompt expert');
  });
});
