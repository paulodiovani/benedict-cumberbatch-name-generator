import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generate, mapError, LlmError } from '../../lib/llm';

// lib/prompt.ts reads a file at module load time — stub it out
vi.mock('../../lib/prompt', () => ({
  buildSystemPrompt: () => 'system prompt',
  buildUserPrompt: (hint: string) => `user prompt ${hint}`,
}));

vi.mock('../../lib/seeds', () => ({
  buildSeedHint: () => 'seed hint',
}));

function makeLlmResponse(content: string, status = 200): Response {
  return new Response(
    JSON.stringify({ choices: [{ message: { content } }] }),
    { status, headers: { 'Content-Type': 'application/json' } },
  );
}

const validName = { firstName: 'Percival', lastName: 'Crumplehorn', funFact: 'Once lost a duel to a hedge.' };

describe('generate()', () => {
  beforeEach(() => {
    vi.stubEnv('LLM_BASE_URL', 'https://llm.example.com');
    vi.stubEnv('LLM_MODEL', 'test-model');
    vi.stubEnv('LLM_API_KEY', 'test-key');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('returns a parsed GeneratedName on a valid response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeLlmResponse(JSON.stringify(validName))));

    const result = await generate();

    expect(result).toEqual(validName);
  });

  it('sends the request to the correct URL with Authorization header', async () => {
    const fetchMock = vi.fn().mockResolvedValue(makeLlmResponse(JSON.stringify(validName)));
    vi.stubGlobal('fetch', fetchMock);

    await generate();

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://llm.example.com/v1/chat/completions');
    expect((init.headers as Record<string, string>)['Authorization']).toBe('Bearer test-key');
  });

  it('strips trailing slash from LLM_BASE_URL', async () => {
    vi.stubEnv('LLM_BASE_URL', 'https://llm.example.com/');
    const fetchMock = vi.fn().mockResolvedValue(makeLlmResponse(JSON.stringify(validName)));
    vi.stubGlobal('fetch', fetchMock);

    await generate();

    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://llm.example.com/v1/chat/completions');
  });

  it('omits Authorization header when LLM_API_KEY is not set', async () => {
    vi.stubEnv('LLM_API_KEY', '');
    const fetchMock = vi.fn().mockResolvedValue(makeLlmResponse(JSON.stringify(validName)));
    vi.stubGlobal('fetch', fetchMock);

    await generate();

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)['Authorization']).toBeUndefined();
  });

  it('throws LlmError(500) when LLM_BASE_URL is missing', async () => {
    vi.stubEnv('LLM_BASE_URL', '');

    await expect(generate()).rejects.toMatchObject({ status: 500, message: 'LLM is not configured' });
  });

  it('throws LlmError(500) when LLM_MODEL is missing', async () => {
    vi.stubEnv('LLM_MODEL', '');

    await expect(generate()).rejects.toMatchObject({ status: 500, message: 'LLM is not configured' });
  });

  it('throws LlmError(502) when fetch rejects (network error)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    await expect(generate()).rejects.toMatchObject({ status: 502, message: 'Failed to reach LLM' });
  });

  it('throws LlmError(429) on a 429 upstream response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeLlmResponse('', 429)));

    await expect(generate()).rejects.toMatchObject({ status: 429, message: 'LLM is rate limited; try again shortly' });
  });

  it('throws LlmError(502) on a non-ok upstream response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeLlmResponse('', 500)));

    await expect(generate()).rejects.toMatchObject({ status: 502, message: 'LLM returned status 500' });
  });

  it('throws LlmError(502) when the response envelope is not valid JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('not json', { status: 200 })));

    await expect(generate()).rejects.toMatchObject({ status: 502, message: 'LLM returned malformed JSON envelope' });
  });

  it('throws LlmError(502) when the content JSON is invalid', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeLlmResponse('not json at all')));

    await expect(generate()).rejects.toMatchObject({ status: 502, message: 'LLM response is not valid JSON' });
  });

  it('strips ```json fences before parsing', async () => {
    const fenced = '```json\n' + JSON.stringify(validName) + '\n```';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeLlmResponse(fenced)));

    const result = await generate();

    expect(result).toEqual(validName);
  });

  it('throws LlmError(502) when required fields are missing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeLlmResponse(JSON.stringify({ firstName: 'Only' }))));

    await expect(generate()).rejects.toMatchObject({ status: 502, message: 'LLM response is missing expected fields' });
  });
});

describe('mapError()', () => {
  it('maps an LlmError to its own status and message', () => {
    expect(mapError(new LlmError(429, 'rate limited'))).toEqual({ status: 429, message: 'rate limited' });
  });

  it('maps an unknown error to 500', () => {
    expect(mapError(new Error('unexpected'))).toEqual({ status: 500, message: 'Unexpected server error' });
  });

  it('maps a non-error value to 500', () => {
    expect(mapError('oops')).toEqual({ status: 500, message: 'Unexpected server error' });
  });
});
