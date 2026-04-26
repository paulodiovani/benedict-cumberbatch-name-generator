import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const SYSTEM_PROMPT = readFileSync(join(here, 'prompts/default.md'), 'utf8');

export function buildSystemPrompt(): string {
  return SYSTEM_PROMPT;
}

export function buildUserPrompt(seedHint: string): string {
  return `Generate a new ridiculous name. ${seedHint}`;
}
