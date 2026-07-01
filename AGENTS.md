# Codex Operating Rules for Webs

This file is the durable instruction layer for Codex work in this repository. Read it before making changes.

## Session Start

1. Read these files before coding:
   - `AGENTS.md`
   - `CLAUDE.md`
   - `WEBs_BRIDGE_BRIEF.md`
   - `design.md`
   - `ROADMAP.md`
   - `DECISIONS.md`
2. Check `git status --short --branch`.
3. Identify unrelated local changes and leave them untouched.
4. Restate the task in one sentence before editing.
5. For ambiguous product/design work, ask for a plan or interview step before implementation.

## Product North Star

Webs is a spatial thinking canvas evolving into a bridge between Figma, Cavalry, Blender, and Eagle.

Protect these qualities:

- Quiet, spatial, absorbing canvas interaction.
- Drop-in/drop-out movement across the canvas.
- Project-brain behavior: notes, provenance, source links, transfer history.
- Honest format handling. Do not imply lossless round trips where they do not exist.
- Eagle remains the asset library; Webs brokers and records, it does not replace Eagle.

## Engineering Guardrails

- Follow existing React + TypeScript + Vite patterns.
- Use React Flow for canvas pan/zoom; do not add custom transform math.
- Use plain CSS/custom properties; do not introduce Tailwind or CSS-in-JS.
- Prefer local helpers and existing types over new abstractions.
- Keep changes scoped to the requested behavior.
- Never silently fall back to mock data in real LLM mode.
- Mock data is only for explicit mock mode or tests.
- Preserve user/local files you did not create.

## Design Guardrails

- Build the actual tool surface, not a marketing page.
- Keep operational UI dense, calm, and scannable.
- Avoid giant hero treatments, decorative gradients, or generic SaaS cards.
- Cards are for fragments, repeated items, modals, and framed tools only.
- Do not nest cards inside cards.
- Use icons for tool actions when possible.
- Keep text legible and non-overlapping at desktop and mobile widths.
- Verify visually when UI changes matter.

## LLM Guardrails

- Default local provider is Ollama with `qwen3:8b`.
- Qwen3 must be called with `think: false` for normal response content.
- Browser access from the live Netlify app requires Ollama CORS via `OLLAMA_ORIGINS`.
- Generation failures should be visible and retryable, not replaced with demo content.
- Validate generated JSON before rendering.

## Verification

Before finishing code work, run the smallest relevant checks:

- `npm run build`
- `npm run test`
- `npm run lint` when style/static analysis changed or before larger commits
- Browser verification for UI, canvas, or generation flows when available

Report exactly what passed, what could not be run, and any remaining risk.

## Git Rules

- Commit only files touched for the task.
- Do not stage unrelated local files such as `SESSION.md` unless explicitly asked.
- Use concise commit messages.
- Push only when the user asks or the current task is clearly live-deploy oriented.

