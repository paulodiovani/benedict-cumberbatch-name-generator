import { FIRST_NAMES, FUN_FACTS, LAST_NAMES, SYSTEM_PROMPT } from '../constants';
import type { GeneratedName, LlmConfig } from '../types';

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function buildSeedHint(): string {
  const firstName = pickRandom(FIRST_NAMES);
  const lastName = pickRandom(LAST_NAMES);
  const funFact = pickRandom(FUN_FACTS);
  return [
    `For inspiration this time, consider names in the spirit of "${firstName}" and "${lastName}" — but feel free to invent something entirely different and more surprising.`,
    `For tone, take a fun fact like "${funFact}" as a starting point — then reach for something stranger and more unexpected of your own.`,
  ].join(' ');
}

type GenerateOptions = LlmConfig & { signal?: AbortSignal };

export async function generateName({ baseUrl, model, signal }: GenerateOptions): Promise<GeneratedName> {
  const seedHint = buildSeedHint();

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({
      model,
      stream: false,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Generate a new ridiculous name. ${seedHint}` },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`LLM request failed with status ${response.status}`);
  }

  const data = await response.json();
  const raw: string = data?.choices?.[0]?.message?.content ?? '';
  const clean = raw.replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(clean) as GeneratedName;

  if (!parsed?.firstName || !parsed?.lastName || !parsed?.funFact) {
    throw new Error('LLM response missing expected fields');
  }

  return parsed;
}
