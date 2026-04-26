import { buildSystemPrompt, buildUserPrompt } from './prompt';
import { buildSeedHint } from './seeds';
import type { GeneratedName } from './types';

export class LlmError extends Error {
  constructor(public readonly status: number, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'LlmError';
  }
}

export async function generate(): Promise<GeneratedName> {
  const baseUrl = process.env.LLM_BASE_URL;
  const model = process.env.LLM_MODEL;
  const apiKey = process.env.LLM_API_KEY;

  if (!baseUrl || !model) {
    throw new LlmError(500, 'LLM is not configured');
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  let response: Response;
  try {
    response = await fetch(`${baseUrl.replace(/\/$/, '')}/v1/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        stream: false,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: buildSystemPrompt() },
          { role: 'user', content: buildUserPrompt(buildSeedHint()) },
        ],
      }),
    });
  } catch (err) {
    throw new LlmError(502, 'Failed to reach LLM', { cause: err });
  }

  if (response.status === 429) {
    throw new LlmError(429, 'LLM is rate limited; try again shortly');
  }
  if (!response.ok) {
    throw new LlmError(502, `LLM returned status ${response.status}`);
  }

  let data: { choices?: Array<{ message?: { content?: string } }> };
  try {
    data = await response.json();
  } catch (err) {
    throw new LlmError(502, 'LLM returned malformed JSON envelope', { cause: err });
  }
  const raw = data?.choices?.[0]?.message?.content ?? '';
  const clean = raw.replace(/```json|```/g, '').trim();

  let parsed: Partial<GeneratedName>;
  try {
    parsed = JSON.parse(clean) as Partial<GeneratedName>;
  } catch (err) {
    throw new LlmError(502, 'LLM response is not valid JSON', { cause: err });
  }

  if (
    typeof parsed.firstName !== 'string' ||
    typeof parsed.lastName !== 'string' ||
    typeof parsed.funFact !== 'string'
  ) {
    throw new LlmError(502, 'LLM response is missing expected fields');
  }

  return {
    firstName: parsed.firstName,
    lastName: parsed.lastName,
    funFact: parsed.funFact,
  };
}

export function mapError(err: unknown): { status: number; message: string } {
  if (err instanceof LlmError) {
    return { status: err.status, message: err.message };
  }
  return { status: 500, message: 'Unexpected server error' };
}
