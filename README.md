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
npm run check:ollama
npm run dev
```

Set `VITE_LLM_PROVIDER=mock` to force mock data covering all fragment types and layouts.
Set `VITE_LLM_PROVIDER=openai-compatible` to use a hosted or self-hosted OpenAI-compatible endpoint.

For live-site local generation from `https://bulge.netlify.app`, Ollama must allow that browser origin. See `docs/local-llm-setup.md`.

## Docs

- `AGENTS.md` — Codex operating rules and guardrails
- `CLAUDE.md` — architecture, component specs, token system, session protocol
- `design.md` — visual and interaction direction for screenshot-driven work
- `WEBs_BRIDGE_BRIEF.md` — bridge product direction
- `ROADMAP.md` — implementation phases
- `DECISIONS.md` — durable product/technical decisions
- `docs/codex-workflow.md` — recommended Codex loops
- `docs/local-llm-setup.md` — Ollama setup and live-site CORS checks
- `docs/prompt-templates.md` — reusable prompts
- `docs/verification-checklist.md` — done checklist
- `PROGRESS.md` — work-in-progress tracker, session history
- `SESSION.md` — current session scope (gitignored, overwritten each session)

## Versioning

See `CHANGELOG.md`.
