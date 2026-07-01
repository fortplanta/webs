# Verification Checklist

Use this before finishing any non-trivial task.

## Code

- [ ] `git status --short --branch` checked.
- [ ] Unrelated local files identified and left alone.
- [ ] Types/build pass with `npm run build`.
- [ ] Tests pass with `npm run test`.
- [ ] Lint run when static/style changes are broad.

## UI

- [ ] Browser verified when UI changed.
- [ ] No obvious text overlap.
- [ ] Controls remain stable during hover/loading.
- [ ] Canvas pan/zoom still works.
- [ ] New UI follows `design.md`.

## LLM

- [ ] Real provider does not fall back to mock silently.
- [ ] Ollama model is installed when local generation is tested.
- [ ] CORS is verified for live/local browser origins when testing live site.
- [ ] JSON response is validated before rendering.
- [ ] Errors are visible and retryable.

## Bridge

- [ ] Source app and destination app are explicit.
- [ ] Format is explicit.
- [ ] Editable vs rendered/lossy status is explicit.
- [ ] Eagle filing is opt-in.
- [ ] Provenance metadata is recorded or planned.

## Final Response

- [ ] Summarize what changed.
- [ ] Mention verification results.
- [ ] Mention anything not run or blocked.
- [ ] Include commit/push status when applicable.

