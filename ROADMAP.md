# Webs Milestones

This roadmap turns the bridge brief into implementation milestones. Keep each milestone small enough that Codex can plan, implement, verify, and commit it in a focused session.

## Milestone 1 - Local LLM Stability

Goal: make exploration generation reliable enough that Webs can be used daily without surprise mock data, blank canvases, or hidden provider failures.

Deliverables:

- Local Ollama provider works in local dev and from the approved live origin.
- `.env.example` and README explain local Ollama setup, model selection, and live-site CORS.
- Real LLM mode never silently falls back to mock data.
- Generation errors are visible, retryable, and specific enough to diagnose.
- Generated JSON is validated before rendering.
- One repair/regeneration pass attempts to recover malformed local model JSON.
- Mock mode remains available for demos and layout coverage only.

Acceptance checks:

- `npm run build` passes.
- `npm run test` passes.
- Creating a new exploration on local dev uses Ollama content, not mock data.
- Creating a new exploration on `https://bulge.netlify.app` works when Ollama is running with allowed origins.
- Stopping Ollama produces a clear retryable error, not mock content.

Likely files:

- `src/api/llm.ts`
- `src/api/generate.ts`
- `src/api/prompt.ts`
- `src/ui/LoadingCanvas.tsx`
- `.env.example`
- `README.md`

Status: in progress.

## Milestone 2 - Project Brain Layer

Goal: make Webs hold the living record around a creative project: notes, linked source files, transfer history, and status at a glance.

Deliverables:

- Project metadata model for notes, linked files, linked apps, and status.
- Project-level notes panel that is distinct from fragment scratchpad notes.
- Links for Figma frames/files, Cavalry files, Blender files, Eagle entries, and local assets.
- Transfer history list showing what moved, when, from where, to where, and in what format.
- Project status summary visible without leaving the canvas.
- Persistence through existing local storage or a deliberately chosen local project store.

Acceptance checks:

- A project can store and reload notes.
- A project can store source links for at least Figma, Cavalry, Blender, and Eagle.
- A transfer/provenance record can be created manually or through a stub action.
- Existing fragment/canvas interactions still work.

Likely files:

- `src/api/types.ts`
- `src/storage/storage.ts`
- `src/ui/panels/ExplorationPanel.tsx`
- `src/ui/NavPanel.tsx`
- `src/App.tsx`
- new project-brain components under `src/project/` or `src/ui/`

Status: not started.

## Milestone 3 - Clipboard/Paste Broker Concept

Goal: define the bridge interaction and data model before integrating deeply with native apps.

Deliverables:

- Transfer model with source app, destination app, source object, chosen format, editability, asset path/blob reference, timestamp, and provenance metadata.
- Paste-time format menu UI that can be triggered from the canvas.
- Format capability matrix for Figma, Cavalry, Blender, and Eagle.
- Honest format labels: editable, rendered preview, comparison artifact, image sequence, filed asset.
- Stub broker flow that simulates copy/paste without touching external apps yet.
- UI states for success, lossy handoff warning, failure, and optional Eagle filing.

Acceptance checks:

- User can open a paste/format menu from the canvas.
- User can select a source app, destination app, and valid format.
- Invalid or lossy hops are labeled honestly.
- A simulated transfer record appears in project history.
- The existing canvas remains the primary surface.

Likely files:

- `src/api/types.ts`
- `src/canvas/CanvasRF.tsx`
- `src/ui/ContextMenu.tsx`
- `src/components/` or new `src/bridge/`
- `src/styles/`

Status: not started.

## Milestone 4 - Figma-Cavalry First Hop

Goal: make the first real app-to-app bridge path work without manual filesystem ceremony.

Deliverables:

- Figma-to-Cavalry path begins with copied/selected Figma work.
- Webs offers SVG/layer-preserving output where possible.
- Paste-time menu chooses between available Figma-to-Cavalry formats.
- Resulting handoff is recorded as a transfer with source, destination, format, and editability.
- UI makes it clear when the handoff is editable source vs rendered artifact.
- Basic reverse path is defined, even if Cavalry-to-Figma starts as rendered MP4/GIF/PNG preview.

Acceptance checks:

- A user can complete a stubbed or real Figma-to-Cavalry transfer without manually naming/finding files.
- Transfer history records the hop.
- Format chosen is visible in the UI.
- Existing Webs canvas movement and generation still work.

Likely files:

- `src/bridge/`
- `src/project/`
- `src/ui/`
- `src/storage/storage.ts`
- local helper scripts or broker process if introduced

Status: not started.

## Milestone 5 - Eagle Provenance Filing

Goal: let users opt into filing transferred assets into Eagle with useful provenance metadata.

Deliverables:

- Eagle API client targeting `localhost:41595`.
- "File to Eagle" action on transfer records/assets.
- Tags and provenance metadata: source app, source object, destination app, format, timestamp, project id, Webs transfer id.
- Link stored Eagle entry back into the Webs project brain.
- Error states for Eagle not running, API failure, duplicate asset, or missing file/blob.
- Filing remains opt-in; no automatic cataloging of every transfer.

Acceptance checks:

- Webs can detect whether Eagle API is reachable.
- User can file a selected transfer asset into Eagle on request.
- Webs stores the returned Eagle reference.
- Project history shows that the asset was filed.
- If Eagle is unavailable, the UI shows a clear retryable error.

Likely files:

- new `src/api/eagle.ts`
- `src/api/types.ts`
- `src/project/` or transfer-history UI
- `src/storage/storage.ts`
- `src/ui/`

Status: not started.

## Later Milestones

Blender and compression should wait until the Figma-Cavalry and Eagle loops are credible.

Future targets:

- Figma-to-Blender SVG curves.
- Cavalry-to-Blender and Blender-to-Cavalry rendered image/EXR sequences.
- Local compression pipeline for video and large images.
- More robust local broker process if browser-only APIs become too constrained.

