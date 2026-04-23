import { CreateMLCEngine, MLCEngine } from '@mlc-ai/web-llm';
import type { ChatCompletionMessageParam } from '@mlc-ai/web-llm';
import { FIRST_NAME_POOLS, LAST_NAME_POOLS, SYSTEM_PROMPT } from '../constants';
import type { GeneratedName } from '../types';

export type EngineState = 'idle' | 'loading' | 'ready' | 'error';

type ProgressCallback = (progress: number, msg: string) => void;

type MockEngine = {
  chat?: {
    completions?: {
      create?: (options: { messages: ChatCompletionMessageParam[]; response_format?: object }) => Promise<{ choices: { message: { content: string } }[] }>;
    };
  };
};

declare global {
  interface Window {
    __webLlmCheckWebGPU?: () => Promise<boolean>;
    __webLlmEngine?: MockEngine;
  }
}

let engine: MLCEngine | null = null;
let engineState: EngineState = 'idle';
let loadResolve: ((engine: MLCEngine) => void) | null = null;
let loadReject: ((err: Error) => void) | null = null;

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getEngineState(): EngineState {
  return engineState;
}

function reportProgress(state: EngineState): void {
  engineState = state;
}

export async function getOrCreateEngine(onProgress?: ProgressCallback): Promise<MLCEngine> {
  if (window.__webLlmEngine?.chat?.completions?.create) {
    return window.__webLlmEngine as unknown as MLCEngine;
  }

  if (engine) {
    return engine;
  }

  if (loadResolve) {
    return new Promise((resolve, reject) => {
      loadResolve = resolve;
      loadReject = reject;
    });
  }

  return new Promise((resolve, reject) => {
    loadResolve = resolve;
    loadReject = reject;
    reportProgress('loading');

    const model = import.meta.env.VITE_LLM_MODEL ?? 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC';

    const initProgressCallback = (progress: number | object) => {
      if (typeof progress === 'number') {
        const percent = Math.round(progress * 100);
        onProgress?.(percent, `Loading model... ${percent}%`);
      } else if (progress && 'text' in progress) {
        onProgress?.(0, (progress as { text: string }).text);
      }
    };

    CreateMLCEngine(model, { initProgressCallback })
      .then((createdEngine) => {
        engine = createdEngine;
        reportProgress('ready');
        loadResolve?.(createdEngine);
        loadResolve = null;
        loadReject = null;
        resolve(createdEngine);
      })
      .catch((err) => {
        reportProgress('error');
        loadReject?.(err);
        loadResolve = null;
        loadReject = null;
        reject(err);
      });
  });
}

export async function generateNameWithEngine(
  engine: MLCEngine,
  signal?: AbortSignal
): Promise<GeneratedName> {
  return new Promise((resolve, reject) => {
    const wrapper = {
      abort: () => {
        reject(new Error('Aborted'));
      },
    };

    if (signal) {
      signal.addEventListener('abort', wrapper.abort);
    }

    (async () => {
      try {
        const firstName = pickRandom(pickRandom(FIRST_NAME_POOLS));
        const lastName = pickRandom(pickRandom(LAST_NAME_POOLS));
        const seedHint = `For inspiration this time, consider names in the spirit of "${firstName}" and "${lastName}" — but feel free to invent something entirely different and more surprising. Do NOT use those exact names.`;

        const messages: ChatCompletionMessageParam[] = [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Generate a new ridiculous name. ${seedHint}` },
        ];

        const reply = await engine.chat.completions.create({
          messages,
          response_format: { type: 'json_object' },
        });

        const raw: string = reply.choices[0]?.message?.content ?? '';
        const clean = raw.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(clean) as GeneratedName;

        if (!parsed?.firstName || !parsed?.lastName || !parsed?.funFact) {
          throw new Error('LLM response missing expected fields');
        }

        resolve(parsed);
      } catch (err) {
        reject(err);
      } finally {
        if (signal) {
          signal.removeEventListener('abort', wrapper.abort);
        }
      }
    })();
  });
}

export async function checkWebGPU(): Promise<boolean> {
  if (window.__webLlmCheckWebGPU) {
    return window.__webLlmCheckWebGPU();
  }

  try {
    const nav = navigator as Navigator & { gpu?: unknown };
    if (!nav.gpu) {
      return false;
    }
    const gpu = nav.gpu as { requestAdapter?: () => Promise<unknown> };
    const adapter = gpu.requestAdapter ? await gpu.requestAdapter() : null;
    return adapter !== null;
  } catch {
    return false;
  }
}