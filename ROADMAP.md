# Webs Roadmap

This roadmap turns the current product direction into implementation phases. Keep it updated as work lands.

## Phase 0 - Local Generation Reliability

- Local Ollama provider works from local dev and approved live origin.
- Real LLM failures show visible retryable errors.
- Mock data is only used in explicit mock mode.
- Generated JSON is validated and repaired once when possible.

Status: in progress.

## Phase 1 - Project Brain

- Per-project notes and metadata.
- Links to source files, Figma frames, Cavalry files, Blender files, and Eagle assets.
- Transfer history/provenance model.
- Project status glance panel.

Status: not started.

## Phase 2 - Bridge Data Model

- Represent source app, destination app, transfer format, editability, timestamp, and asset path.
- Distinguish editable source from rendered comparison artifacts.
- Add local transfer records to the canvas/project state.

Status: not started.

## Phase 3 - Figma to Cavalry First Hop

- Clipboard-based source capture path.
- Paste-time format menu.
- SVG/layer-preserving handoff baseline.
- Clear UI label for editable vs rendered output.

Status: not started.

## Phase 4 - Eagle Provenance Filing

- Connect to Eagle local HTTP API at `localhost:41595`.
- File selected assets on request only.
- Store tags and provenance metadata.
- Link Webs project records to Eagle entries.

Status: not started.

## Phase 5 - Blender and Compression

- Figma to Blender SVG curves baseline.
- Cavalry/Blender rendered sequence baseline.
- Local compression pipeline for large image/video assets.

Status: not started.

