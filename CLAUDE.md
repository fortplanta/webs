# CLAUDE.md
# Webs — AI Knowledge Canvas
# Read this file at the start of EVERY session before touching any code.

---

## What this product is

Webs is a non-linear learning platform. Users enter a topic and get a knowledge
graph — interconnected thematic nodes (Technology, Market Dynamics, Culture etc.)
that expand into contextual narrative on click. It is a thinking space, not a course.

Live URL: https://bulge.netlify.app

---

## Stack

- Vite + React + TypeScript
- React Flow (XYFlow) — canvas, nodes, edges
- Ant Design — component library (being overridden with custom tokens)
- Neue Haas Unica — primary typeface (sole typeface, no exceptions)
- Single compiled CSS bundle via Vite

---

## Design authority

All design decisions are made externally by the designer and handed to you as:
- Precise CSS token values
- Exact class names to target
- Instruction documents (like this one)

**You do not make design decisions.** If something is ambiguous — colour, spacing,
layout — stop and ask rather than guessing. Do not substitute your own aesthetic
judgement. Generic choices (Inter, rounded corners, purple gradients, card shadows
with blur) are wrong by default in this project.

---

## Design direction

Teenage Engineering / Swiss typography / Dieter Rams.

- Single font weight (400) everywhere. No bold in the node/card system.
- Hierarchy via scale and opacity only.
- Dark surface. Near-monochrome. One accent colour.
- Sharp or minimal corner radius. No decorative effects.
- Dense, tight typography. Tracking slightly negative on UI text.
- If in doubt: remove rather than add.

---

## Current design tokens (v1.1 — locked)

These are the source of truth. Do not hardcode values that differ from these.

```css
/* Canvas & surfaces */
--color-bg:           #161614;   /* main canvas */
--color-surface-2:    #1e1d1b;   /* sidebar */
--color-surface-3:    #242424;   /* nodes, cards */

/* Text */
--color-text:         #F0EFE8;
--color-text-dim:     rgba(240, 239, 232, 0.58);
--color-text-dimmer:  rgba(240, 239, 232, 0.28);

/* Accent */
--color-focus:        #3c3c3c;   /* intentionally restrained — do not brighten */
--color-accent-border:#3c3c3c40;

/* Typography */
--font-body:          "Neue Haas Unica", "Helvetica Neue", Arial, sans-serif;
--font-size-sm:       13px;
--font-size-base:     15px;
--line-height-base:   1.50;
--line-height-tight:  1.30;
--letter-spacing-ui:  -0.01em;

/* Category label */
--label-color:        #FFAB2B;
--label-bg:           #161614;
--label-font-size:    13px;
--label-pad-h:        2px;
--label-pad-v:        10px;

/* Node body */
--node-width:         320px;
--node-pad-h:         15px;
--node-pad-v:         18px;
--node-radius:        5px;
--node-border-opacity:0.05;
--node-bg:            #242424;
--gap-title-more:     24px;

/* Expanded card */
--card-width:         321px;
--card-bg:            #242424;
--card-title-size:    15px;
--card-body-size:     15px;
--card-body-lh:       1.50;
--card-body-opacity:  0.58;
```

---

## Node architecture — CRITICAL

Every node (collapsed and expanded) uses this exact DOM structure.
**Do not put the category label inside the card body.**

```
.node-outer                     ← wrapper, position: relative, no bg, no border
  .node-label                   ← position: absolute, top: 0, left: 0
  .anchor-node  OR  .context-node   ← card body, margin-top = label height
    [card contents]
```

The label background (#161614) matches the canvas background. This creates the
visual effect of the label sitting between the canvas and the card — floating,
not contained. This is intentional. Do not change it.

### Label offset calculation
Label height ≈ font-size (13px) + pad-top (10px) + pad-bottom (10px) = ~34px.
Use a useRef to measure dynamically:

```tsx
const labelRef = useRef<HTMLDivElement>(null);
const [labelHeight, setLabelHeight] = useState(34);
useEffect(() => {
  if (labelRef.current) setLabelHeight(labelRef.current.offsetHeight);
}, []);
// Apply: <div className="anchor-node" style={{ marginTop: labelHeight }}>
```

---

## Known class names (from live DOM — do not rename)

```
App shell:
  .app, .main-area, .canvas-wrapper

Sidebar:
  .sidebar, .sidebar-header, .sidebar-logo, .sidebar-logo-sub
  .sidebar-section, .sidebar-label, .sidebar-modes
  .mode-option, .mode-option.active, .mode-option__icon, .mode-option__hint
  .sidebar-cta, .sidebar-item, .sidebar-item__icon, .sidebar-item__shortcut
  .sidebar-footer, .danger

Nodes:
  .anchor-node, .anchor-node__bar, .anchor-node__body
  .anchor-node__label, .anchor-node__title
  .anchor-node__footer, .anchor-node__expand, .anchor-node__connections
  .node-star

  .context-node, .context-node__bar, .context-node__body
  .context-node__category, .context-node__ai-badge
  .context-node__title, .context-node__summary
  .context-node__locked-inner, .context-node__locked-icon
  .context-node__locked-category, .context-node__locked-hint
  .smart-term

Canvas groups:
  .group-frame, .group-frame__label, .group-frame__collapse-btn

View panel:
  .view-panel, .view-panel__header, .view-panel__row, .view-panel__label
  .view-panel__buttons, .view-panel__btn, .view-panel__btn.active
  .view-panel__divider, .view-panel__toggles, .view-panel__toggle

Status bar:
  .status-bar, .status-bar__item, .status-bar__dot
```

---

## Ant Design configuration

The project uses Ant Design. Override it via ConfigProvider dark algorithm in App.tsx:

```tsx
import { ConfigProvider, theme } from 'antd';

<ConfigProvider theme={{
  algorithm: theme.darkAlgorithm,
  token: {
    colorBgBase:        '#161614',
    colorBgContainer:   '#242424',
    colorBgElevated:    '#2A2927',
    colorBorder:        'rgba(255,255,255,0.08)',
    colorText:          '#F0EFE8',
    colorTextSecondary: 'rgba(240,239,232,0.58)',
    colorPrimary:       '#3c3c3c',
    borderRadius:       5,
    fontFamily:         '"Neue Haas Unica", "Helvetica Neue", Arial, sans-serif',
    fontSize:           13,
  },
}}>
```

---

## React Flow configuration

```tsx
// Edge style — step connectors, low opacity white
const defaultEdgeOptions = {
  type: 'smoothstep',
  style: {
    stroke: 'rgba(255, 255, 255, 0.10)',
    strokeWidth: 1,
  },
};

// Background — dot grid
<Background
  variant={BackgroundVariant.Dots}
  gap={24}
  size={1}
  color="rgba(255, 255, 255, 0.07)"
/>
```

---

## Quality gates — check before every commit

Run through this list. If anything fails, fix it before considering a task done.

1. **No hardcoded hex values** outside the token file or :root block
2. **No font-weight above 400** in the node/card system
3. **No bold text** in .anchor-node, .context-node, .sidebar-item, .view-panel
4. **Label outside card body** — .node-label must be a sibling of the card, not a child
5. **Dark surfaces only** — no white or near-white backgrounds on canvas elements
6. **No raw Ant Design defaults visible** — if it looks like a grey web form, it's wrong
7. **Node width = 320px** exactly
8. **Border radius = 5px** on nodes and cards
9. **No blur, gradient, or shadow blur** — box-shadow max is `0 16px 40px rgba(0,0,0,0.55)`
10. **Neue Haas Unica** loads correctly — check Network tab if text looks wrong

---

## What you must NOT change

- TypeScript/JavaScript logic, state management, or data flow
- Prop interfaces or component APIs  
- React Flow node position or connection logic
- Save/load session functionality
- AI generation pipeline
- Any file not directly related to the task in the current instruction

---

## Work in progress tracker

Update this section at the end of each session.

| Task | Status | Notes |
|------|--------|-------|
| Dark mode base (canvas, body) | TODO | webs-tokens.css ready to import |
| Sidebar dark surface | TODO | Tokens defined, CSS in webs-tokens.css |
| Node floating label architecture | TODO | DOM restructure required — see above |
| Expanded card floating label | TODO | Same architecture as collapsed node |
| View panel reskin | TODO | Replace Ant Design defaults |
| Status bar dark | TODO | Simple CSS override |
| Ant Design ConfigProvider dark | TODO | See config block above |
| React Flow edge style | TODO | smoothstep, rgba white 10% |
| Cluster / satellite system — Phase 1 (rendering) | TODO | See cluster-system-spec.md |
| Cluster / satellite system — Phase 2 (drag) | TODO | See cluster-system-spec.md |
| Cluster / satellite system — Phase 3 (source + fact check) | TODO | See cluster-system-spec.md |
| Cluster / satellite system — Phase 4 (note absorption) | TODO | See cluster-system-spec.md |
| Pivot edges | NOT STARTED | Amber dashed, directional — spec TBD |
| Train of thought toggle | NOT STARTED | Path highlight + summary panel — spec TBD |
| Loading state | NOT STARTED | No design yet |
| Empty canvas state | NOT STARTED | No design yet |
| Remember/flashcard mode | NOT STARTED | Not audited |

---

## Cluster system architecture (DO NOT DEVIATE)

Satellites are NOT separate React Flow nodes. They are absolutely positioned
children of an expanded context-node bounding box. See cluster-system-spec.md
for full architecture, data model, and phased implementation plan.

Key rule: satellite mousedown must call e.stopPropagation() or the whole
node drags instead of just the satellite.

---

## How to receive a task

Instructions arrive as one of:
1. A markdown instruction document (like claude-code-instructions.md)
2. A CSS file to import (like webs-tokens.css)
3. A JSON token export (apply values to :root and relevant components)
4. A direct message describing a specific, bounded change

For (1): read the full document before starting. Do tasks in order.
For (2): import the file as specified, do not modify its contents.
For (3): update tokens only — do not restructure components unless told to.
For (4): scope the change tightly. Do not refactor adjacent code.

When a task is complete: summarise exactly what files were changed and what was not touched.

---

## Session start checklist

Before writing a single line of code:

1. Read this file (CLAUDE.md) — you are doing this now
2. Check the work in progress tracker above
3. Read any instruction document provided in this session
4. Identify which files you will need to touch
5. Confirm your plan in one sentence before executing

---

## File locations (update if structure changes)

```
src/
  styles/
    webs-tokens.css     ← design token overrides, import last
    index.css           ← global base styles
  components/
    nodes/              ← AnchorNode, ContextNode etc.
    sidebar/            ← Sidebar component
    canvas/             ← Canvas wrapper, React Flow config
  App.tsx               ← ConfigProvider, top-level layout
  main.tsx              ← entry point
```

---

## Contact

Design decisions → back-channel with designer (not your call)
Logic/architecture questions → ask before assuming
Anything affecting more than 3 files → confirm scope before starting

---
*Last updated: April 2026 — v1.1 tokens locked, dark mode in progress*
