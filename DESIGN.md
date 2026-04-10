# Design — Webs

## How this works

All visual values live in `src/styles/tokens.css` — single source of truth.
Components must not contain hardcoded colours, sizes, or type scales.
When a value changes, it changes once in tokens.

To request design changes: describe the tweak in plain language and drop it into **Backlog** below.
We batch-implement per session and move items through the columns.

---

## Backlog

*(Paste tweaks here. One per bullet.)*

---

## In Progress

---

## Done

- Dark palette applied — canvas `#161614`, sidebar `#1e1d1b`, cards `#242424`
- Floating category label above card (`.node-outer > .node-label`)
- `font-weight: 400` throughout — no bold anywhere in the node system
- Edges: smoothstep, 1px, rgba white at variable opacity
- View panel: square corners, 9px uppercase labels, inverted active state
- Status bar: 9px uppercase
- Ant Design `darkAlgorithm` via `ConfigProvider`
- Node image moved outside card body — floats between label and card, card connects flush below
- Tooltip portalled to `document.body` — anchors to hovered word, not canvas viewport
- Wikipedia image fetching: two-step (direct lookup → search fallback) for AI-generated titles
- Image pre-fetched at expansion time, cached before reveal
- Media node CSS (border, caption, remove button)
- Sticky note node (`stickyNode`) — freeform text annotation, no connectors, double-click to edit
- Proximity lines — dashed SVG overlay between media nodes and nearest neighbour
- Canvas tool strip — pointer and text (sticky) tool modes
- Generative lens rewritten — focuses on WHY, underlying mechanisms, non-obvious connections, conversational tone
- Category prompts rewritten to ask causality questions, not description prompts
