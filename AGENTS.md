# AGENTS.md

This file provides guidance to coding agents working in this repository.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Vite dev server on `:5173` |
| `npm run build` | `tsc --noEmit` then Vite build into `dist/` |
| `npm run typecheck` | Type check only |
| `npm run lint` | ESLint over `src/` and `tests/` |
| `npm test` | Run Playwright tests (LLM is mocked) |
| `npm run test:ui` | Playwright UI mode |
| `npx playwright test tests/generator.spec.ts -g "renders the first generated name"` | Run a single test by name |

Tests auto-spawn the dev server via `playwright.config.ts` (`webServer.command: npm run dev`). No Ollama needed for tests — the `/v1/chat/completions` route is mocked per test.

## Configuration

`VITE_LLM_BASE_URL` and `VITE_LLM_MODEL` are read at **build/dev-server start time** (Vite inlines them), not at runtime. Restart `npm run dev` after editing `.env`. Defaults: `http://localhost:11434` and `llama3.1` (in `src/main.ts`); `.env.example` ships a different model — `.env` is the place for personal config.

The app calls `${baseUrl}/v1/chat/completions` — any OpenAI-compatible local server works, not just Ollama.

## Architecture

This is a vanilla-TS Vite SPA. **No framework, no DOM helpers, no virtual DOM.**

### Rendering model (src/main.ts)

A single mutable `state: AppState` object holds everything. Every state change calls `render()`, which calls three sub-renderers that fully replace their subtree's children via `replaceChildren()`. There is no diffing.

All HTML lives statically in `index.html`, including four `<template>` blocks (`tpl-loading`, `tpl-error`, `tpl-name`, `tpl-history-item`). `main.ts` does not construct DOM — it clones template content and fills `.textContent` on known selectors. **When adding UI, prefer adding a `<template>` in `index.html` over building elements in TS.**

The card flip animation is driven by class swaps on `#card` (`is-idle` / `is-spinning` / `is-revealing`), gated behind `nextPaint()` (double `requestAnimationFrame`) so the browser commits the spinning frame before the reveal frame is applied.

`state.history[0]` is the *currently displayed* name; the visible history list is `history.slice(1)` (see `renderHistory`). `HISTORY_LIMIT = 8` caps the array.

### Name generation (src/lib/nameGenerator.ts)

`generateName()` is a pure async function: takes `LlmConfig`, returns `GeneratedName`. It is the only place that talks to the LLM.

Two prompt-construction details worth knowing:

1. **Seed hint pattern.** `buildSeedHint()` picks random examples from `FIRST_NAMES` / `LAST_NAMES` / `FUN_FACTS` (in `src/constants.ts`) and embeds them in the user message as *inspiration*, explicitly telling the model to invent something different. The seed pools exist to nudge variety, not to be echoed verbatim. Editing those pools changes the distribution of generations.
2. **System prompt is an asset.** `src/constants.ts` imports `src/assets/prompts/default.md` via Vite's `?raw` suffix. Edit the markdown file to change the prompt — it is not a string literal in TS.

The request uses `response_format: { type: 'json_object' }` and `stream: false`. The response parser still strips ```` ```json ```` fences defensively (some local models ignore the JSON mode flag). Required output fields: `firstName`, `lastName`, `funFact`.

### Types (src/types.ts)

Two types only: `GeneratedName` (the JSON shape returned by the LLM) and `LlmConfig` (`baseUrl`, `model`). Keep this file thin.

### Styling (src/styles.css)

All CSS in one file, including the card-flip keyframes. The Victorian aesthetic (sepia, ornaments, divider rules) is expressed in CSS — there are no images for chrome, only Unicode glyphs (`✦`) and `::before`/`::after` pseudo-elements.
