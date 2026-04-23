# The Benedict Cumberbatch Name Generator

> Based on [benedictcumberbatchgenerator.tumblr.com](http://benedictcumberbatchgenerator.tumblr.com)

A Victorian-aesthetic name generator that produces absurd, pompous, almost-plausible British names in the spirit of *Benedict Cumberbatch*. Each name comes with a deadpan fun fact about its bearer.

---

## Features

- AI-generated names powered by Claude Haiku
- Smooth card flip animation while generating
- History of previously minted names
- Seed hints for variety — no two generations feel the same

---

## Tech Stack

- **React** (no build tool required, runs as a `.jsx` artifact)
- **Anthropic API** — `claude-haiku-4-5-20251001` model
- Pure CSS animations for the flip effect

---

## Getting Started

### Prerequisites

- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com/)

### Installation

```bash
git clone https://github.com/your-username/benedict-generator.git
cd benedict-generator
npm install
```

### Environment

Create a `.env` file at the root:

```env
ANTHROPIC_API_KEY=your_api_key_here
```

> ⚠️ The current implementation calls the Anthropic API directly from the browser. For production use, move the API call to a backend server to keep your key secret.

### Run

```bash
npm run dev
```

---

## How It Works

Each time you generate a name, the app:

1. Picks a random seed hint from pools of Victorian first and last names
2. Sends the hint + a system prompt to Claude Haiku, asking for a JSON response with `firstName`, `lastName`, and `funFact`
3. Animates a card flip while the request is in flight
4. Reveals the new name once the response arrives

The seed hint nudges Claude toward variety without constraining the output — the actual names are always freshly invented.

---

## Possible Improvements

- [ ] Move API call to a backend to secure the API key
- [ ] Add a copy-to-clipboard button
- [ ] Explore [WebLLM](https://webllm.mlc.ai/) for fully offline, in-browser generation (no API key needed)
- [ ] Support alternative AI providers (Gemini, etc.)
- [ ] Shareable links per generated name

---

## License

MIT

---

*✦ No actual Benedicts were harmed in the making of this app ✦*
