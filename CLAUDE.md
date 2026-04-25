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

- Font weight 400 everywhere in node/card content. Weight 500 only for meta chrome (eyebrows, wordmark).
- Hierarchy via scale, weight (400 vs 500), and opacity.
- **Light canvas. White cards on light gray.** Color is semantic, not decorative.
- No rounded corners. Sharp edges throughout. No decorative effects.
- Dense, tight typography. Negative letter-spacing is non-negotiable.
- Voice: lowercase, noun-phrases, no exclamation marks, no emoji.
- If in doubt: remove rather than add.

---

## Current design tokens (v2.0 — Neurodive system, locked)

These are the source of truth. Do not hardcode values that differ from these.
Source: `.claude/skills/Neurodive Design System.zip` → `colors_and_type.css`

```css
/* Canvas & surfaces */
--canvas:        #F8F8F8;   /* main canvas — light gray */
--canvas-dot:    #CBCBCB;   /* dot grid */
--surface:       #FFFFFF;   /* cards / nodes */
--surface-alt:   #EDEDED;   /* starting fragments, image placeholders */
--surface-mute:  #F7F7F7;   /* dropdown body */
--hairline:      rgb(229,231,235);
--hairline-2:    rgb(243,244,246);

/* Text — black on light */
--fg:            #000000;
--fg-strong:     #0F172A;
--fg-2:          #475569;
--fg-3:          #6B7280;
--fg-4:          #ACACAC;
--fg-invert:     #FFFFFF;
--fg-mute:       #696969;

/* Category colors — semantic, never decorative */
--cat-event:     #FF5500;   /* on-event:   white */
--cat-works:     #FF007B;   /* on-works:   white */
--cat-policy:    #E8FF4F;   /* on-policy:  black */
--cat-concept:   #FFCC00;   /* on-concept: black */
--cat-people:    #00FF88;   /* on-people:  black */
--cat-media:     #53E8FF;   /* on-media:   black */
--cat-source:    #F600FF;   /* on-source:  white */
--cat-misc:      #22D3EE;   /* on-misc:    black */

/* System signals */
--signal-quote:     #0126DC;   /* cobalt — quote backdrop */
--signal-highlight: #001EFF;   /* electric blue — highlight */
--signal-danger:    #FF0207;   /* red — destructive */

/* Typography */
--font-sans:     "Neue Haas Unica", "Inter", ui-sans-serif, sans-serif;
--font-display:  "Neue Haas Unica", "Inter", sans-serif;
--font-meta:     "Inter", "Neue Haas Unica", sans-serif;  /* buttons, eyebrows */
--font-mono:     "Menlo", "SF Mono", ui-monospace, monospace;

/* Type scale (negative letter-spacing is non-negotiable) */
--fs-display: 80px;  --ls-display: -0.045em;  --lh-display: 0.95;
--fs-h1:      48px;  --ls-h1:      -0.052em;  --lh-h1:      1;
--fs-h2:      30px;  --ls-h2:      -0.050em;  --lh-h2:      1.2;
--fs-h3:      24px;  --ls-h3:      -0.050em;  --lh-h3:      1.333;
--fs-h4:      20px;  --ls-h4:      -0.035em;  --lh-h4:      1.2;
--fs-body:    16px;  --ls-body:    -0.031em;  --lh-body:    1.25;
--fs-label:   20px;  --ls-label:   -0.035em;  --lh-label:   1.2;
--fs-small:   14px;  --ls-small:   -0.028em;  --lh-small:   1;
--fs-tag:     15px;  --ls-tag:     -0.050em;  --lh-tag:     1;
--fs-code:    11px;  --ls-code:    0;          --lh-code:    1.4;

/* Spacing — 4px base, 8px is the card-padding beat */
--s-1:  4px;   --s-2:  8px;   --s-3: 12px;   --s-4: 16px;
--s-5: 20px;   --s-6: 24px;   --s-8: 32px;   --s-10: 40px;
--s-12: 48px;  --s-16: 64px;  --s-20: 80px;

/* Grid */
--grid-dot:  16px;    /* dot grid spacing */
--grid-col:  320px;   /* fragment / node column width */

/* Borders & radii */
--radius:       0;    /* NO rounded corners — this is the rule */
--radius-soft:  4px;  /* ONLY for toolbar toggle buttons */
--stroke:       1px solid var(--hairline);
--stroke-soft:  1px solid var(--hairline-2);

/* Shadows — hard, physical, short */
--shadow-card:    2px 2px 14px 0 rgba(0,0,0,0.07);
--shadow-toolbar: 0 4px 6px -2px rgba(0,0,0,0.05), 0 10px 15px -3px rgba(0,0,0,0.10);
--shadow-lift:    0 1px 2px 0 rgba(0,0,0,0.05);

/* Motion — essentially none */
--ease:      cubic-bezier(0.2, 0, 0.2, 1);
--dur-fast:  80ms;
--dur:       140ms;
--dur-slow:  200ms;
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

The label background (`var(--canvas)` = `#F8F8F8`) matches the canvas background. This creates the
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

The project uses Ant Design. Override it via ConfigProvider in App.tsx (light algorithm):

```tsx
import { ConfigProvider, theme } from 'antd';

<ConfigProvider theme={{
  algorithm: theme.defaultAlgorithm,
  token: {
    colorBgBase:        '#F8F8F8',
    colorBgContainer:   '#FFFFFF',
    colorBgElevated:    '#FFFFFF',
    colorBorder:        'rgb(229,231,235)',
    colorText:          '#000000',
    colorTextSecondary: '#6B7280',
    colorPrimary:       '#0126DC',
    borderRadius:       0,
    fontFamily:         '"Neue Haas Unica", "Inter", ui-sans-serif, sans-serif',
    fontSize:           16,
  },
}}>
```

---

## React Flow configuration

```tsx
// Edge style — smoothstep, low opacity dark on light canvas
const defaultEdgeOptions = {
  type: 'smoothstep',
  style: {
    stroke: 'rgba(0, 0, 0, 0.12)',
    strokeWidth: 1,
  },
};

// Background — dot grid, 16px spacing, CBCBCB dots on F8F8F8
<Background
  variant={BackgroundVariant.Dots}
  gap={16}
  size={1}
  color="#CBCBCB"
/>
```

---

## Quality gates — check before every commit

Run through this list. If anything fails, fix it before considering a task done.

1. **No hardcoded hex values** outside the token file or :root block
2. **Font weight 400 in node/card content. 500 only for meta chrome** (eyebrows, wordmark)
3. **No bold text** in .anchor-node, .context-node, .sidebar-item, .view-panel
4. **Label outside card body** — .node-label must be a sibling of the card, not a child
5. **Light surfaces only** — white cards (`var(--surface)`) on light gray canvas (`var(--canvas)`). No dark backgrounds on canvas elements.
6. **No raw Ant Design defaults visible** — if it looks like a default light-gray form, it's wrong
7. **Node width = 320px** exactly (`var(--grid-col)`)
8. **Border radius = 0** on all cards and nodes. `var(--radius-soft)` = 4px only on toolbar toggles
9. **No blur, gradient, or decorative shadows** — only `var(--shadow-card)`, `var(--shadow-toolbar)`, `var(--shadow-lift)`
10. **Neue Haas Unica** loads correctly — check Network tab if text looks wrong
11. **Category colors are semantic** — `--cat-event`, `--cat-works`, etc. Use only for their designated category, never decoratively
12. **Voice is lowercase** — labels, headings, and buttons are lowercase; capitalize only proper nouns in body copy

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
| Apply Neurodive tokens to :root / index.css | TODO | Source: .claude/skills/Neurodive Design System.zip → colors_and_type.css |
| Canvas: light gray bg + dot grid (CBCBCB on F8F8F8, 16px) | TODO | Replace old dark canvas |
| Ant Design ConfigProvider → light algorithm + Neurodive tokens | TODO | See config block above |
| React Flow edge style → dark on light (rgba 0,0,0,0.12) | TODO | See config block above |
| Node cards → white surface, 0px radius, shadow-card | TODO | Replace #242424 cards |
| Category labels → semantic color chips per --cat-* tokens | TODO | Orange=event, pink=works, yellow=policy, etc. |
| Sidebar reskin → light surface | TODO | Remove old dark sidebar CSS |
| Node floating label architecture | TODO | DOM restructure — see above. Label bg = var(--canvas) |
| Expanded card / expansion panel | TODO | See feature-expansion-panel-edge-labels.md |
| View panel reskin | TODO | Light surface, 0px radius |
| Status bar reskin | TODO | Light surface |
| Cluster / satellite system — Phase 1 (rendering) | TODO | See cluster-system-spec.md (visual specs updated to light theme) |
| Cluster / satellite system — Phase 2 (drag) | TODO | See cluster-system-spec.md |
| Cluster / satellite system — Phase 3 (source + fact check) | TODO | See cluster-system-spec.md |
| Cluster / satellite system — Phase 4 (note absorption) | TODO | See cluster-system-spec.md |
| Pivot edges | NOT STARTED | Spec TBD |
| Train of thought toggle | NOT STARTED | Spec TBD |
| Loading state | NOT STARTED | Blue+pink progress band per Neurodive spec |
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
*Last updated: April 2026 — v2.0 Neurodive design system. Light theme. Dark theme removed.*
