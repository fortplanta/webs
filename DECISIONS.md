# Webs Decisions Log

Record durable product and technical decisions here so future Codex sessions do not reopen settled questions.

## 2026-06-30 - Local LLM Default

Decision: Webs uses local/open-source LLM generation through Ollama by default, with OpenAI-compatible endpoints as an optional adapter.

Reason: Claude/OpenAI hosted usage costs were getting too high for exploration generation.

Implications:

- Local setup matters.
- Browser CORS must be configured for approved live origins.
- Real generation failures must not silently become mock data.

## 2026-06-30 - Bridge Product Direction

Decision: Webs is evolving into a live canvas, project brain, and local transfer broker for Figma, Cavalry, Blender, and Eagle.

Reason: The core problem is context switching and manual export/import loops across creative tools.

Implications:

- Do not replace Eagle.
- Start with Figma-Cavalry.
- Preserve editability only where formats honestly allow it.
- Label lossy artifacts as previews/renders/comparison artifacts.

## 2026-07-01 - Codex Workflow Guardrails

Decision: Codex sessions should use `AGENTS.md`, `design.md`, roadmap, decisions log, and prompt/checklist docs as durable context.

Reason: High-quality Codex output depends on repeated context, clear constraints, and review discipline.

Implications:

- Screenshot + context + design spec should be the default for UI work.
- Complex tasks should start with plan/interview mode.
- Verification is part of done.

