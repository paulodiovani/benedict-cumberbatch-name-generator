# The Benedict Cumberbatch Name Generator

> Based on [benedictcumberbatchgenerator.tumblr.com](http://benedictcumberbatchgenerator.tumblr.com) and many others.

A Victorian-aesthetic name generator that produces absurd, pompous, almost-plausible British names in the spirit of *Benedict Cumberbatch*. Each name comes with a deadpan fun fact about its bearer.

Vite SPA frontend + a single Vercel Serverless Function backend. Talks to any **OpenAI-compatible LLM** (local [Ollama](https://ollama.com) or cloud API).

---

## Stack

- **Vite** (vanilla TS) — dev server and production bundler
- **TypeScript**
- **Vercel Functions** — serverless backend
- **OpenAI-compatible LLM** — any local (Ollama) or cloud model (Groq, OpenAI, etc.)

---

## Prerequisites

- Node.js 20+
- For local development: [Ollama](https://ollama.com/download) running locally (`ollama serve`) with a model pulled (e.g. `ollama pull llama3.1`)
- **OR** API credentials for a cloud LLM (Groq, OpenAI, etc.)

---

## Getting started

```bash
npm install
cp .env.example .env
npm run dev:vercel
```

Open <http://localhost:3000>.

### Configuring the LLM

Edit `.env` with your LLM credentials (these are server-side only, never bundled into the SPA):

**Local (Ollama):**
```
LLM_BASE_URL=http://localhost:11434
LLM_MODEL=llama3.1
LLM_API_KEY=
```

**Cloud (Groq, OpenAI, etc.):**
```
LLM_BASE_URL=https://api.groq.com/openai
LLM_MODEL=llama-3.3-70b-versatile
LLM_API_KEY=gsk_your_api_key_here
```

Then restart `npm run dev:vercel`. Any OpenAI-compatible endpoint will work.

---

## Scripts

| Command            | Purpose                                                                      |
|--------------------|----------------------------------------------------------------------|
| `npm run dev`      | Vite dev server on `:5173` (frontend only — `/api/generate` returns 404) |
| `npm run dev:vercel` | `vercel dev` — Vite + serverless functions on one port (mirrors production) |
| `npm run build`    | `tsc --noEmit` then Vite build into `dist/`                          |
| `npm run typecheck` | Type check only (covers `src/`, `api/`, `lib/`, `tests/`)             |
| `npm run lint`     | ESLint over `src/`, `tests/`, `api/`, `lib/`                        |
| `npm test`         | Run Playwright tests (`/api/generate` is mocked per test)            |
| `npm run test:ui`  | Playwright UI mode                                                   |

---

## Deployment (Vercel)

Single project, auto-detected by Vercel:
- `src/` → Vite build into `dist/` (static frontend)
- `api/*.ts` → bundled as serverless functions

Set `LLM_BASE_URL`, `LLM_MODEL`, `LLM_API_KEY` in the Vercel dashboard (Production + Preview). One `git push` deploys both frontend and backend.

For other static hosts, see notes below.

### Deploying the built `dist/` to static hosts

`npm run build` produces a static `dist/` folder with relative asset URLs (`base: './'`):

- **GitHub Pages** — push `dist/` to a `gh-pages` branch or sub-path.
- **Amazon S3** — sync `dist/` to a bucket configured for static site hosting.
- Any other static host.

Note: the frontend will still need a backend to call `/api/generate`. Either:
1. **Use Vercel Functions** (recommended) — deploy the whole project to Vercel.
2. **Self-host the backend** — duplicate `api/generate.ts` logic and run it on your own server, then point the frontend's `api/generate` fetch to that URL.

---

## Architecture

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

---

## License

MIT

---

*✦ No actual Benedicts were harmed in the making of this app ✦*
