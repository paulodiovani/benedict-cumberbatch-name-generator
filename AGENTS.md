# AGENTS.md

This file provides guidance to coding agents working in this repository.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Vite dev server on `:5173` (frontend only — `/api/generate` returns 404) |
| `npm run dev:vercel` | `vercel dev` — Vite + serverless functions on one port (mirrors production) |
| `npm run build` | `tsc --noEmit` then Vite build into `dist/` |
| `npm run typecheck` | Type check only (covers `src/`, `api/`, `lib/`, `tests/`) |
| `npm run lint` | ESLint over `src/`, `tests/`, `api/`, `lib/` |
| `npm test` | Run Playwright tests (`/api/generate` is mocked per test) |
| `npm run test:ui` | Playwright UI mode |
| `npx playwright test tests/generator.spec.ts -g "renders the first generated name"` | Run a single test by name |

Tests auto-spawn the Vite dev server via `playwright.config.ts` and intercept `/api/generate` at the network layer — no real backend or upstream LLM is needed in CI.

## Configuration

The backend reads three env vars at runtime (`process.env`, **not** Vite-inlined):

```
LLM_BASE_URL   # OpenAI-compatible base URL (e.g. https://api.groq.com/openai)
LLM_MODEL      # e.g. llama-3.3-70b-versatile
LLM_API_KEY    # bearer token sent as Authorization: Bearer <key>
```

Set these in `.env` for local `vercel dev`, and in the Vercel dashboard (Production + Preview) for deploys. They are **not** prefixed with `VITE_`, so they never reach the browser bundle. `.env.example` ships neutral defaults — put personal config in `.env`.

## Architecture

Vite SPA frontend + a single Vercel Serverless Function backend, deployed from one project.

```
.
├── api/generate.ts          # Vercel function — POST handler, ~12 lines
├── lib/                     # backend helpers (imported by api/generate.ts)
│   ├── llm.ts               # fetch upstream + error mapping
│   ├── prompt.ts            # buildSystemPrompt(), buildUserPrompt()
│   ├── seeds.ts             # FIRST_NAMES / LAST_NAMES / FUN_FACTS + buildSeedHint()
│   ├── types.ts             # GeneratedName (backend copy)
│   └── prompts/default.md   # system prompt asset, read via fs.readFileSync
├── src/                     # frontend (vanilla TS, no framework)
│   ├── lib/nameGenerator.ts # POST /api/generate, returns GeneratedName
│   ├── constants.ts         # HISTORY_LIMIT
│   ├── types.ts             # GeneratedName (frontend copy — duplicated, one type)
│   ├── main.ts              # state + render loop
│   └── styles.css
└── tests/generator.spec.ts  # Playwright; mocks **/api/generate
```

### Frontend ↔ backend contract

```
POST /api/generate            → 200 { firstName, lastName, funFact }
                              → 4xx/5xx { message: string }
```

Status codes the backend can return:
- `200` — success
- `405` — non-POST
- `429` — upstream rate limited
- `502` — upstream non-OK or returned malformed/incomplete JSON
- `504` — upstream timeout (30s)
- `500` — config missing or unexpected error

The frontend treats any non-200 as a generic "machine jammed" error to the user; the JSON `message` is in `response.json()` for debugging in DevTools.

### Rendering model (src/main.ts)

A single mutable `state: AppState` object holds everything. Every state change calls `render()`, which calls three sub-renderers that fully replace their subtree's children via `replaceChildren()`. There is no diffing.

All HTML lives statically in `index.html`, including four `<template>` blocks (`tpl-loading`, `tpl-error`, `tpl-name`, `tpl-history-item`). `main.ts` does not construct DOM — it clones template content and fills `.textContent` on known selectors. **When adding UI, prefer adding a `<template>` in `index.html` over building elements in TS.**

The card flip animation is driven by class swaps on `#card` (`is-idle` / `is-spinning` / `is-revealing`), gated behind `nextPaint()` (double `requestAnimationFrame`) so the browser commits the spinning frame before the reveal frame is applied.

`state.history[0]` is the *currently displayed* name; the visible history list is `history.slice(1)` (see `renderHistory`). `HISTORY_LIMIT = 8` caps the array.

### Backend (api/ + lib/)

`api/generate.ts` is a thin Vercel handler — it delegates to `lib/llm.ts:generate()` and uses `lib/llm.ts:mapError()` to convert thrown `LlmError`s into HTTP status + JSON body.

Two prompt-construction details worth knowing:

1. **Seed hint pattern.** `buildSeedHint()` (in `lib/seeds.ts`) picks random examples from `FIRST_NAMES` / `LAST_NAMES` / `FUN_FACTS` and embeds them in the user message as *inspiration*, explicitly telling the model to invent something different. The seed pools exist to nudge variety, not to be echoed verbatim. Editing those pools changes the distribution of generations.
2. **System prompt is an asset.** `lib/prompt.ts` reads `lib/prompts/default.md` via `fs.readFileSync` at module load. Edit the markdown file to change the prompt — it is not a string literal in TS. Vercel's bundler picks up the file via static analysis of the `__dirname`-relative path; if a deploy ever ships without the asset, add `includeFiles` to a `vercel.json`.

The upstream request uses `response_format: { type: 'json_object' }` and `stream: false`. The response parser still strips ```` ```json ```` fences defensively (some local models ignore the JSON mode flag). Required output fields: `firstName`, `lastName`, `funFact`.

### Types

`GeneratedName` is duplicated in `src/types.ts` and `lib/types.ts` (one three-field interface each). They must stay in sync — but with one type, that's cheaper than introducing a `shared/` folder.

### Styling (src/styles.css)

All CSS in one file, including the card-flip keyframes. The Victorian aesthetic (sepia, ornaments, divider rules) is expressed in CSS — there are no images for chrome, only Unicode glyphs (`✦`) and `::before`/`::after` pseudo-elements.

## Deployment (Vercel)

Single project. Vercel auto-detects:
- Vite from `package.json` → builds with `npm run build`, serves `dist/` as static.
- `api/*.ts` → bundles each file as a serverless function.

No `vercel.json` is required. Set `LLM_BASE_URL`, `LLM_MODEL`, `LLM_API_KEY` in the project's Environment Variables (Production + Preview). One `git push` deploys both halves.
