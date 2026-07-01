# Prompt Templates

Copy these into Codex and fill the brackets.

## Start a Session

```text
Read AGENTS.md, CLAUDE.md, WEBs_BRIDGE_BRIEF.md, design.md, ROADMAP.md, and DECISIONS.md.
Then inspect git status and summarize:
1. current project direction
2. files likely involved
3. risks/unknowns
Do not code yet.
```

## Interview Me First

```text
Before planning or coding, interview me.
Ask up to 5 questions that would materially change the implementation.
Then propose a plan with tradeoffs.
```

## Screenshot-Driven UI Work

```text
Use the attached screenshot plus design.md.
Goal: [what should change]
Preserve: [what must not change]
Avoid: [visual/interaction anti-patterns]
Definition of done: [browser states/screens/checks]
```

## Bridge Feature

```text
Implement [bridge feature].
Read WEBs_BRIDGE_BRIEF.md, ROADMAP.md, DECISIONS.md, and relevant source.
Respect format reality: editable vs rendered artifacts must be labeled honestly.
Start with Figma-Cavalry unless the task says otherwise.
Run build/tests and browser verification if UI changed.
```

## Local LLM Debugging

```text
Debug local generation.
Check Ollama process, installed models, CORS origins, .env.local, and browser console logs.
Do not expose secrets.
Do not silently switch to mock mode.
Show the exact failing layer: env, CORS, Ollama, model, JSON parse, app state, or UI.
```

## Commit and Push

```text
Review the diff.
Stage only files changed for this task.
Run relevant checks.
Commit with a concise message.
Push the current branch.
Leave unrelated local files untouched.
```

