# Codex Workflow for Webs

Use this as the standard operating loop for high-quality Codex sessions.

## Small Fix Loop

Use for narrow bugs or copy changes.

Prompt shape:

```text
Fix [specific issue]. Keep the change scoped. Run the relevant checks. Commit only the files you changed.
```

Expected Codex behavior:

1. Inspect the relevant files.
2. Patch the smallest safe change.
3. Run build/test or narrower checks.
4. Summarize files changed and verification.

## Feature Loop

Use for product behavior.

Prompt shape:

```text
Read AGENTS.md, WEBs_BRIDGE_BRIEF.md, design.md, and the relevant source files.
Plan the implementation for [feature].
Call out risks and unknowns before coding.
Then implement, verify, and commit.
```

Expected Codex behavior:

1. Read project docs.
2. Map affected state/types/components.
3. Give a short plan.
4. Implement in scoped slices.
5. Verify with tests and browser when relevant.

## Design Loop

Use for UI, canvas, motion, or visual polish.

Inputs:

- Screenshot of current state.
- Screenshot/reference of target state when available.
- `design.md`.
- 1-2 paragraphs of taste/context.

Prompt shape:

```text
Use this screenshot and design.md. Preserve the canvas interaction model.
Make [specific UI area] feel [specific direction].
Avoid [specific anti-patterns].
Verify in browser with screenshots.
```

Expected Codex behavior:

1. Compare current UI to desired state.
2. Modify existing components/styles.
3. Avoid landing-page or decorative patterns.
4. Verify visually.

## Review Loop

Use before accepting larger changes.

Prompt shape:

```text
Review the current diff like a senior engineer/designer.
Find bugs, regressions, missing tests, and design drift.
Then fix the actionable issues.
```

Expected Codex behavior:

1. Lead with findings.
2. Fix high-confidence issues.
3. Re-run checks.

## Parallel Agent Loop

Use when work can split cleanly.

Example split:

- Agent A: map current architecture and affected files.
- Agent B: prototype data model.
- Agent C: explore UI interaction and paste menu.
- Agent D: review risks and test strategy.

Keep parallel work in separate branches/worktrees and merge intentionally.

