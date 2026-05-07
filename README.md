# Webs

A spatial thinking tool for associative, non-linear minds. Scatter fragments of interest on an infinite canvas. Clusters form by theme. The AI surfaces connections you haven't made yet.

## Stack

- Vite 8 + React 19 + TypeScript
- Custom pan-zoom canvas (no diagram library)
- Anthropic API (claude-sonnet-4-5)
- Plain CSS with custom properties

## Run locally

```bash
npm install
cp .env.example .env.local   # add VITE_ANTHROPIC_API_KEY
npm run dev
```

Without an API key, the app falls back to mock data covering all fragment types and layouts.

## Docs

- `CLAUDE.md` — architecture, component specs, token system, session protocol
- `PROGRESS.md` — work-in-progress tracker, session history
- `SESSION.md` — current session scope (gitignored, overwritten each session)

## Versioning

See `CHANGELOG.md`.
