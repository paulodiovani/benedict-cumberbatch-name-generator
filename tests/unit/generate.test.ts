import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { LlmError } from '../../lib/llm';

vi.mock('../../lib/llm', () => ({
  generate: vi.fn(),
  mapError: vi.fn(),
  LlmError: class LlmError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
      this.name = 'LlmError';
    }
  },
}));

import { generate, mapError } from '../../lib/llm';
import handler from '../../api/generate';

const generateMock = vi.mocked(generate);
const mapErrorMock = vi.mocked(mapError);

function makeReq(method: string): VercelRequest {
  return { method } as VercelRequest;
}

function makeRes(): { res: VercelResponse; status: number | null; body: unknown } {
  const ctx = { status: null as number | null, body: undefined as unknown };
  const json = vi.fn((data: unknown) => { ctx.body = data; return ctx.res; });
  const statusFn = vi.fn((code: number) => { ctx.status = code; return { json }; });
  ctx.res = { status: statusFn, json } as unknown as VercelResponse;
  return ctx;
}

const validName = { firstName: 'Percival', lastName: 'Crumplehorn', funFact: 'Once lost a duel to a hedge.' };

describe('GET /api/generate handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 200 with a generated name on a GET request', async () => {
    generateMock.mockResolvedValue(validName);

    const ctx = makeRes();
    await handler(makeReq('GET'), ctx.res);

    expect(ctx.status).toBe(200);
    expect(ctx.body).toEqual(validName);
  });

  it('returns 405 for non-GET methods', async () => {
    for (const method of ['POST', 'PUT', 'DELETE', 'PATCH']) {
      const ctx = makeRes();
      await handler(makeReq(method), ctx.res);

      expect(ctx.status).toBe(405);
      expect(ctx.body).toEqual({ message: 'Method not allowed' });
    }
  });

  it('calls mapError and returns the mapped status on LlmError', async () => {
    const err = new LlmError(429, 'rate limited');
    generateMock.mockRejectedValue(err);
    mapErrorMock.mockReturnValue({ status: 429, message: 'rate limited' });

    const ctx = makeRes();
    await handler(makeReq('GET'), ctx.res);

    expect(mapErrorMock).toHaveBeenCalledWith(err);
    expect(ctx.status).toBe(429);
    expect(ctx.body).toEqual({ message: 'rate limited' });
  });

  it('calls mapError and returns 500 on an unexpected error', async () => {
    generateMock.mockRejectedValue(new Error('boom'));
    mapErrorMock.mockReturnValue({ status: 500, message: 'Unexpected server error' });

    const ctx = makeRes();
    await handler(makeReq('GET'), ctx.res);

    expect(ctx.status).toBe(500);
    expect(ctx.body).toEqual({ message: 'Unexpected server error' });
  });
});
