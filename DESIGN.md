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

- Floating category label above card (`.node-outer > .node-label`)
- `font-weight: 400` throughout node system (500 only for meta chrome)
- Ant Design `ConfigProvider` wired up (now using light algorithm + Neurodive tokens)
- Node image moved outside card body — floats between label and card
- Tooltip portalled to `document.body` — anchors to hovered word
- Wikipedia image fetching: two-step (direct lookup → search fallback)
- Image pre-fetched at expansion time, cached before reveal
- Media node CSS (border, caption, remove button)
- Sticky note node (`stickyNode`) — freeform text annotation, double-click to edit
- Proximity lines — dashed SVG overlay between media nodes and nearest neighbour
- Canvas tool strip — pointer and text (sticky) tool modes
- Generative lens: focuses on WHY, mechanisms, non-obvious connections
- Category prompts: causality questions, not description prompts

## Reset / superseded

- ~~Dark palette (canvas `#161614`, sidebar `#1e1d1b`, cards `#242424`)~~ — replaced by Neurodive v2.0 light system
- ~~Edges: rgba white~~ — replaced by rgba black on light canvas
- ~~View panel: 9px uppercase~~ — pending reskin to Neurodive tokens
- ~~Status bar: 9px uppercase~~ — pending reskin to Neurodive tokens
- ~~Ant Design `darkAlgorithm`~~ — replaced with `defaultAlgorithm` + Neurodive tokens
