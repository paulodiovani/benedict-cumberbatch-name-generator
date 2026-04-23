# The Benedict Cumberbatch Name Generator

> Based on [benedictcumberbatchgenerator.tumblr.com](http://benedictcumberbatchgenerator.tumblr.com) and many others.

A Victorian-aesthetic name generator that produces absurd, pompous, almost-plausible British names in the spirit of *Benedict Cumberbatch*. Each name comes with a deadpan fun fact about its bearer.

Uses **WebLLM** for in-browser LLM inference — no API keys, no server, runs entirely client-side.

---

## Stack

- **Vite** (vanilla TS template) — dev server and production bundler
- **TypeScript**
- **[WebLLM](https://webllm.mlc.ai/)** — browser-based LLM inference with WebGPU acceleration

---

## Prerequisites

- Node.js 20+
- A WebGPU-enabled browser:
  - Chrome / Edge: WebGPU enabled by default
  - Firefox: Enable `dom.webgpu.enabled` in `about:config`
  - Test your browser: [webgpureport.org](https://webgpureport.org/)

---

## Getting started

```bash
npm install
cp .env.example .env     # optional — defaults target Qwen2.5-1.5B
npm run dev
```

Open <http://localhost:5173>.

On first visit, the model will download (~1GB) and load. Subsequent visits use cached model data.

### WebGPU not available?

If you see an error about WebGPU not being available:

- **Firefox**: Go to `about:config`, search for `dom.webgpu.enabled`, set to `true`, then restart the browser
- **Chrome / Edge**: WebGPU is enabled by default. If issues persist, check [webgpureport.org](https://webgpureport.org/) for support

### Switching models

Edit `.env`:

```
VITE_LLM_MODEL=Qwen2.5-1.5B-Instruct-q4f16_1-MLC
```

Available models (see [WebLLM docs](https://webllm.mlc.ai/docs/) for full list):

| Model | Size | Notes |
|-------|------|-------|
| `Qwen2.5-1.5B-Instruct-q4f16_1-MLC` | ~1GB | Default |
| `Llama-3.2-1B-Instruct-q4f16_1-MLC` | ~1GB | Good alternative |
| `Phi-3.5-Mini-Instruct-q4f16_1-MLC` | ~2GB | Larger, better quality |

Restart `npm run dev` after changing models — the new model will download on next visit.

---

## Scripts

| Command           | Purpose                                             |
|-------------------|-----------------------------------------------------|
| `npm run dev`     | Vite dev server on `:5173`                          |
| `npm run build`   | Typecheck, then build static assets into `dist/`  |
| `npm run preview` | Serve the built `dist/` locally                   |
| `npm run lint`    | ESLint over `src/` and `tests/`                    |
| `npm run typecheck` | `tsc --noEmit`                                   |
| `npm test`        | Playwright tests                                   |
| `npm run test:ui` | Playwright in UI mode                             |

---

## Deploying the built `dist/`

`npm run build` produces a fully static `dist/` folder. Asset URLs are relative (`base: './'` in `vite.config.ts`), so you can drop it anywhere:

- **GitHub Pages** — push `dist/` to a `gh-pages` branch or any sub-path.
- **Amazon S3** — sync `dist/` to a bucket configured for static site hosting.
- Any other static host.

Note: The built app runs entirely in the browser — no external server needed at runtime.

---

## Project layout

```
src/
  main.ts                  — entry: owns state, wires events, re-renders
  styles.css               — all visual styles + card-flip animation
  constants.ts             — seed pools, system prompt
  types.ts                 — GeneratedName
  lib/
    nameGenerator.ts       — re-exports WebLLM engine functions
    webllmEngine.ts      — WebLLM engine initialization + generation
tests/
  generator.spec.ts        — Playwright tests
index.html                 — static DOM tree + <template> blocks for card states
```

---

## License

MIT

---

*✦ No actual Benedicts were harmed in the making of this app ✦*