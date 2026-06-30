# Webs

A spatial thinking tool for associative, non-linear minds. Scatter fragments of interest on an infinite canvas. Clusters form by theme. The AI surfaces connections you haven't made yet.

## Stack

- Vite 8 + React 19 + TypeScript
- React Flow canvas
- Local/open-source LLM via Ollama by default
- Plain CSS with custom properties

## Run locally

```bash
npm install
cp .env.example .env.local
ollama pull qwen3:8b
ollama serve
npm run dev
```

Set `VITE_LLM_PROVIDER=mock` to force mock data covering all fragment types and layouts.
Set `VITE_LLM_PROVIDER=openai-compatible` to use a hosted or self-hosted OpenAI-compatible endpoint.

## Docs

- `CLAUDE.md` — architecture, component specs, token system, session protocol
- `PROGRESS.md` — work-in-progress tracker, session history
- `SESSION.md` — current session scope (gitignored, overwritten each session)

## Versioning

See `CHANGELOG.md`.
