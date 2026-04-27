import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const SYSTEM_PROMPT = readFileSync(join(__dirname, 'prompts/default.md'), 'utf8');

export function buildSystemPrompt(): string {
  return SYSTEM_PROMPT;
}

export function buildUserPrompt(seedHint: string): string {
  return `Generate a new ridiculous name. ${seedHint}`;
}
