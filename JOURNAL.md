# The Benedict Cumberbatch Name Generator — A Developer Journal

Posted Apr 27, 2026

By _Paulo Diovani_

A short journal of how a silly weekend project ended up touring half of the small-LLM ecosystem before landing on a boring, sensible architecture.

## The idea

There is a small corner of the internet dedicated to generating Benedict Cumberbatch-style names — absurd, pompous, vaguely British, almost plausible. The original [benedictcumberbatchgenerator.tumblr.com](http://benedictcumberbatchgenerator.tumblr.com) and many copies have been doing this for years using fixed lists of first and last names randomly combined.

Modern Large Language Models, however, have a peculiar talent for this exact kind of nonsense. So I figured: why pre-bake a list, when an LLM can invent a fresh "Bombadil Wafflesnatch" on demand, complete with a deadpan fun fact about him? – That was the whole brief.

What I did not expect was that the _model_ would turn out to be the entire project, and the web app the easy part.

## Round 1: claude.ai (web) and a single .jsx file

The first version was the laziest possible. I opened claude.ai, described the idea, asked for a UI, and got back a single 268-line `BenedictCumberbatchGenerator.jsx` artifact — React, inline styles, calling the Anthropic API directly with `claude-haiku-4-5-20251001`. It even had a card flip animation and a history list.

It worked on first try, which is honestly a bit anticlimactic.

But shipping a `.jsx` file with a hardcoded model name and an API key floating around the frontend is not a real project. It was a sketch. So the next morning I committed it as the starting point, made a `feature/name-generator` branch, and started rewriting it properly.

### Rewrite as a webpage with Vite

I dropped React entirely. The whole app is one card, one button, and a list — there is no reason to pull in a framework for that. So:

- Vanilla TypeScript with Vite as the dev server and bundler.
- A handful of `<template>` blocks in `index.html` for the loading, error, name and history-item views.
- A single mutable `state` object and a `render()` function that calls `replaceChildren()` on three subtrees. No diffing, no virtual DOM.
- Playwright for end-to-end tests, with `/api/generate` mocked at the network layer.

The CSS is also one file, including the card-flip keyframes. The Victorian aesthetic is achieved with sepia, ornaments, divider rules and Unicode glyphs (`✦`) — no images for chrome.

Without the framework, the whole thing fits in a single `main.ts` you can read top to bottom.

## Round 2: trying to run it locally on Ollama

With the Anthropic API working, the obvious next question was: do I really need a paid API for a joke name generator?

I have been running [Ollama](https://ollama.com) on my laptop for a while, so I went looking for the smallest model that could pull this off. The bar felt low — invent two words and a sentence, output some JSON. How hard could it be?

So I spent an embarrassing afternoon pulling and trying models. From my shell history:

```
ollama pull tinyllama
ollama pull smollm2:135m
ollama pull smollm2:360m
ollama pull qwen2.5:0.5b
ollama pull qwen2.5:1.5b
ollama pull qwen2.5:1.5b-instruct-q2_K
ollama pull qwen3:0.6b
ollama pull llama3.2:1b
ollama pull llama3.2:1b-instruct-q4_K_M
```

The results, charitably, were _not great_.

`smollm2:135m` is impressively coherent for its size, but coherent in the way a parrot is coherent — it does not understand "absurd but almost believable". `tinyllama` produced things like _John Smith_ and called it a day. `qwen3:0.6b` got distracted by reasoning and never reached the JSON. `qwen2.5:0.5b` hallucinated markdown around its output. `llama3.2:1b` was the closest, but only when it remembered the rules, which was about half the time.

I tried four full prompt rewrites against `qwen2.5:1.5b`, three generations each. Every "improvement" regressed something else:

- Adding a syllable-count rule produced compound run-on names like `Shackletonslydebythewind`.
- Removing the concrete fun-fact example collapsed the fun facts into etymologies and meta-commentary.
- A full rewrite "from scratch" was the worst variant — bloated 30-word fun facts with markdown artifacts.

I also briefly tried switching the output format from JSON to pipe-separated values, on the theory that the smaller models would have an easier time. They did not. The format was never the bottleneck. The model was.

The conclusion, after a day of this: there is no sub-2B model that does this task well, regardless of prompting or output format. The task _looks_ trivial — write two words and a sentence — but it actually requires stylistic judgement (what counts as "absurd but almost believable"), and that judgement seems to live above some parameter-count threshold I was not going to cross with a 1.5B model.

I left the prompt as the original `default.md` and walked away from the small-model rabbit hole.

## Round 3: the WebLLM detour

Before giving up on running this locally, I made one more attempt — this time in the browser. The `feature/webllm` branch is the artifact.

[WebLLM](https://webllm.mlc.ai/) is a beautiful project: it takes an MLC-compiled model, ships it as `.wasm` + weights, and runs inference fully in the user's browser via WebGPU. No backend at all. No API key. No serverless. Just a static page. For a silly project, this would have been perfect — the whole thing could live on GitHub Pages and cost nothing to run.

I wired up `@mlc-ai/web-llm`, added a `webllmEngine.ts` module, made the UI show a download progress bar for the model weights, and tried it.

It works. But there are two problems I could not get past:

1. **The model size.** The smallest viable models are several hundred MB of weights. The first time a user opens the page, they wait minutes for a download — for a name generator. Cached after that, but the first impression is brutal.
2. **Quality, again.** The browser-runnable models are small for the same reason the Ollama small models were small: they fit in modest memory budgets. And from the previous round, I already knew "small" did not work for this task. The 1.5B-class WebLLM models reproduced the same failure modes — ordinary names, missing fun facts, inconsistent JSON.

I left the branch as a `(wip)` commit and never merged it. It is a fun proof-of-concept but the wrong tool for this specific problem. If the day comes when a 3B-ish model in WebLLM nails the absurd-Victorian register and ships in 100MB, I will revisit.

## Round 4: just use a real model

After the small-model and WebLLM detours, I gave up on cleverness. I pulled `qwen2.5:14b` to my local Ollama, pointed the app at it, and hit generate.

It was, in the user's own words from the moment, "much better". Stylistically on point, JSON-clean, fun facts that landed. Effectively a Haiku-class output from a model I can run on my own machine.

That settled the prompt question. The 14B model handles the original `default.md` prompt without any of the contortions I had tried on the 1.5B version. The lesson, again: above some parameter threshold the prompt _just works_; below it, no amount of prompt engineering recovers what is missing.

## Round 5: refactoring as a Vercel app

Running it locally on `qwen2.5:14b` is great for me. But I cannot ship that to anyone else — visitors would need their own Ollama with a 14B model pulled, which is several gigabytes and a long wait.

So the obvious move was: keep the architecture flexible enough to use _any_ OpenAI-compatible endpoint, and host the production version on something cheap and serverless.

This is where the Vercel refactor comes in. The shape of the app is now embarrassingly conventional:

```
.
├── api/generate.ts       # Vercel serverless function — the POST handler
├── lib/                  # backend helpers
│   ├── llm.ts            # fetch upstream + error mapping
│   ├── prompt.ts         # buildSystemPrompt(), buildUserPrompt()
│   ├── seeds.ts          # name seed pools + buildSeedHint()
│   └── prompts/default.md
├── src/                  # frontend (vanilla TS, no framework)
└── tests/generator.spec.ts
```

The frontend POSTs to `/api/generate` with no parameters, the backend returns `{ firstName, lastName, funFact }`. The backend reads three env vars at runtime — `LLM_BASE_URL`, `LLM_MODEL`, `LLM_API_KEY` — and forwards to whichever OpenAI-compatible endpoint they point at.

The same code runs against local Ollama, against [Groq](https://groq.com), against OpenAI, against any other OpenAI-compatible service. That portability fell out of the architecture for free, simply by sticking to the OpenAI chat completions shape.

Production runs against a hosted model on Groq. Local development runs against my own `qwen2.5:14b` via Ollama. Same code, different `.env`.

A few small details from the refactor that I am happy with:

- The system prompt lives in `lib/prompts/default.md` as an asset, not as a string literal in TypeScript. Edits to the prompt are pure markdown edits — no escaping, no code review, no rebuild.
- The seeds pattern in `lib/seeds.ts` picks random examples from `FIRST_NAMES` / `LAST_NAMES` / `FUN_FACTS` pools and embeds them in the user message _as inspiration_, with explicit instructions to invent something different. The pools nudge variety; they are not meant to be echoed verbatim. Editing the pools shifts the distribution of generations.
- The frontend treats every non-200 response as a single generic "machine jammed" error. The JSON `message` from the backend is still in `response.json()` for DevTools debugging, but the user never sees the upstream's specific complaint. This keeps the Victorian conceit intact.

## Conclusion and Caveats

What started as a one-shot claude.ai sketch ended up as a small but proper web app, after a long detour through the lower end of the open-model ecosystem.

If I had to extract one lesson from the whole thing, it is this: do not try to outsmart the parameter count. There is a real floor for "creative voice + format compliance", and prompt-engineering tricks do not lower it. Pick a model that can do the task, and your prompt gets to be a few clean paragraphs of markdown.

A few caveats worth naming, though…

- The seed pools in `lib/seeds.ts` are doing more work than they look like. Pure prompt + pure model produces a lot of repetition over a session. The random hints are what keep generations feeling fresh.
- The `feature/webllm` branch is still there. I have not deleted it, on the off chance that browser-side models become genuinely viable for this task in a year or two. If you are reading this and a 2B-ish model now nails it in a 100MB WebGPU bundle, please open a PR.
- The `GeneratedName` type is duplicated across `src/types.ts` and `lib/types.ts`. It is one three-field interface. Introducing a `shared/` folder for one type would be more ceremony than the duplication costs.

The whole repo is around a thousand lines of code, three env vars, and one markdown prompt. That feels about right for what it is — a generator of pompous Victorian names that nobody actually needs. ✦

## Appendix: timeline

- **Apr 23** — Initial claude.ai artifact (React, Anthropic API, Claude Haiku). Rewrite as Vite + vanilla TS. First Ollama experiments. Prompt iteration against `qwen2.5:1.5b`. WIP `feature/webllm` branch.
- **Apr 26** — `qwen2.5:14b` confirmed as the working local model. Refactor as a Vercel app with `api/` + `lib/` split. Backend unit tests. Build and deploy fixes.
- **Apr 27** — Polish: better user feedback, OG image, favicon. This journal.
