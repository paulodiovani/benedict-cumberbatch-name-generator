# The Benedict Cumberbatch Name Generator

> Based on [benedictcumberbatchgenerator.tumblr.com](http://benedictcumberbatchgenerator.tumblr.com)

A Victorian-aesthetic name generator that produces absurd, pompous, almost-plausible British names in the spirit of *Benedict Cumberbatch*. Each name comes with a deadpan fun fact about its bearer.

Front-end only. Talks to a **local LLM via [Ollama](https://ollama.com)** — no API keys, no third-party calls, no server.

---

## Stack

- **Vite** (vanilla TS template) — dev server and production bundler
- **TypeScript**
- **Ollama** — any local model exposed through Ollama's OpenAI-compatible endpoint
- **Playwright** — smoke tests with the LLM call mocked
- **ESLint** + `.editorconfig`

---

## Prerequisites

- Node.js 20+
- [Ollama](https://ollama.com/download) running locally (`ollama serve`)
- A model pulled, e.g. `ollama pull llama3.1`

---

## Getting started

```bash
npm install
cp .env.example .env     # optional — defaults already target localhost:11434 + llama3.1
npm run dev
```

Open <http://localhost:5173>.

### Switching models

Edit `.env`:

```
VITE_LLM_BASE_URL=http://localhost:11434
VITE_LLM_MODEL=mistral
```

Then restart `npm run dev`. Any model served by Ollama (or any other OpenAI-compatible local server) will work — the app only speaks `POST /v1/chat/completions`.

---

## Scripts

| Command           | Purpose                                             |
|-------------------|-----------------------------------------------------|
| `npm run dev`     | Vite dev server on `:5173`                          |
| `npm run build`   | Typecheck, then build static assets into `dist/`    |
| `npm run preview` | Serve the built `dist/` locally                     |
| `npm run lint`    | ESLint over `src/` and `tests/`                     |
| `npm run typecheck` | `tsc --noEmit`                                    |
| `npm test`        | Playwright tests (LLM call is mocked — no Ollama needed) |
| `npm run test:ui` | Playwright in UI mode                               |

---

## Deploying the built `dist/`

`npm run build` produces a fully static `dist/` folder. Asset URLs are relative (`base: './'` in `vite.config.ts`), so you can drop it anywhere without further configuration:

- **GitHub Pages** — push `dist/` to a `gh-pages` branch or any sub-path.
- **Amazon S3** — sync `dist/` to a bucket configured for static site hosting.
- Any other static host.

Note: the client still needs to reach whichever LLM server you configured in `VITE_LLM_BASE_URL` at the time of `npm run build`. For a hosted demo, point it at a publicly reachable Ollama-compatible endpoint (and be mindful of CORS).

---

## Project layout

```
src/
  main.ts                  — entry: owns state, wires events, re-renders
  styles.css               — all visual styles + card-flip animation
  constants.ts             — seed pools, system prompt
  types.ts                 — GeneratedName, LlmConfig
  lib/nameGenerator.ts     — pure logic: buildSeedHint, generateName
tests/
  generator.spec.ts        — Playwright smoke tests (LLM route mocked)
index.html                 — static DOM tree + <template> blocks for card states
```

---

## License

MIT

---

*✦ No actual Benedicts were harmed in the making of this app ✦*
