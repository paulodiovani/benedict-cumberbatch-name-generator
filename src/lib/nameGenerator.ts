import type { GeneratedName } from '../types';

export async function generateName(signal?: AbortSignal): Promise<GeneratedName> {
  const response = await fetch('/api/generate', { method: 'POST', signal });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message ?? `Request failed with status ${response.status}`);
  }
  return (await response.json()) as GeneratedName;
}
