# WEBS — Claude Code Handoff Brief
# For use with Claude Code Plan Mode
# April 2026

---

## READ THIS FIRST

This document is the single source of truth for building Webs. Read it completely before entering plan mode. Do not make architectural decisions not covered here — ask instead.

Before writing a single line of code:
1. Read this document in full
2. Locate `/skills/` in the repo root. Unzip the skills archive.
3. Read `SKILL.md` and `README.md` inside the skills folder
4. Study the images in `/skills/inspiration/`, `/skills/colors/`, and `/skills/type/`
5. Read `type.css` and all files in `/skills/ui-kit/`
6. Read the existing `CLAUDE.md` in the repo root
7. Only then begin planning

The visual language of this app is entirely defined by the skills folder. Do not invent aesthetic decisions. Do not use generic defaults. Every colour, spacing choice, typographic decision must be traceable to something in the skills folder or this document.

---

## WHAT THIS APP IS

Webs is a personal knowledge canvas for people with associative, non-linear minds. It is a spatial thinking tool — not a productivity app, not a note-taker, not a knowledge base.

The core premise: real thinking does not happen in hierarchies. It happens through wandering, through unexpected adjacencies, through returning to old ideas and seeing them differently. Webs creates a space for that to happen.

The user scatters fragments of interest — a quote, a person, a concept, a source, an event — on an infinite canvas. Fragments cluster by theme. Clusters connect to each other with verb-labelled edges. The AI surfaces connections the user hasn't made yet. Over time, the canvas becomes a visual map of the user's thinking.

**The experience is:** spatial, quiet, absorbing, personal. Like a corkboard that knows things.

---

## WHAT THIS APP IS NOT

Do not build any of the following. If a feature isn't in this document, it doesn't exist yet.

- ❌ A note-taking app (Notion, Obsidian)
- ❌ A task manager
- ❌ A presentation tool
- ❌ A collaborative whiteboard (Miro, Figma)
- ❌ A knowledge graph with forced hierarchies
- ❌ A search-first interface
- ❌ A mobile app
- ❌ A social/sharing platform

---

## MIGRATION STRATEGY

### Current State
The repo contains a working React Flow prototype. It has:
- Working AI generation pipeline (Anthropic API call, cluster/fragment generation)
- Node positioning logic (orbit-based, jitter)
- Session save/load
- Ant Design component library
- Sidebar, status bar, view panel UI components
- `webs-tokens.css` design token file
- Vite + React + TypeScript scaffold
- Font loading (Neue Haas Unica)
- Netlify deploy config

### What to Keep
| Item | Action |
|------|--------|
| Vite + React + TypeScript scaffold | Keep exactly |
| Font loading (Neue Haas Unica) | Keep exactly |
| Netlify config | Keep exactly |
| `CLAUDE.md` | Keep, update after build |
| AI generation pipeline logic | Extract and port — keep the API call, prompt, and response parsing |
| Session save/load state shape | Extract data model, port to new state management |
| Orbit positioning math | Extract the math, port to new canvas system |
| `webs-tokens.css` | Keep, extend with new tokens from this brief |

### What to Remove
| Item | Action |
|------|--------|
| React Flow (`@xyflow/react`) | Remove entirely — uninstall package |
| All React Flow node components | Delete |
| All React Flow edge components | Delete |
| React Flow canvas wrapper | Delete |
| Ant Design (`antd`) | Remove — replace with plain CSS |
| Ant Design ConfigProvider | Delete |
| All Ant Design component usage | Replace with native HTML + CSS |
| Any hardcoded hex values in components | Remove, replace with token variables |

### Migration Order
1. Create new folder structure (see below)
2. Remove React Flow and Ant Design from `package.json`, run install
3. Build custom pan-zoom canvas layer
4. Port AI generation pipeline into new architecture
5. Build Fragment component system
6. Build Cluster positioning system
7. Build edge/connection system
8. Port session save/load
9. Rebuild sidebar, status bar with plain CSS
10. Final token audit — no hardcoded values

---

## TECHNICAL ARCHITECTURE

### Stack
```
Vite + React + TypeScript
Custom pan-zoom canvas (no canvas library)
Anthropic API (claude-sonnet-4-5 or latest Sonnet)
Plain CSS with custom properties (no CSS-in-JS, no Tailwind)
No Ant Design
No React Flow
No external canvas/diagram libraries
```

### Folder Structure
```
src/
  canvas/
    Canvas.tsx              ← pan-zoom root component
    usePanZoom.ts           ← custom hook: wheel, drag, transform state
    useCanvas.ts            ← canvas state: clusters, fragments, edges
    CanvasBackground.tsx    ← dot grid SVG
  fragments/
    Fragment.tsx            ← master fragment component
    FragmentHeader.tsx      ← colored type label
    slots/
      BodySlot.tsx
      ImageSlot.tsx
      TagsSlot.tsx
      ListSlot.tsx
      DisclaimerSlot.tsx
    layouts/
      VerticalFlow.tsx
      ImageHero.tsx
      QuoteCentered.tsx
      CardSplit.tsx
      Timeline.tsx
      ListProminent.tsx
  clusters/
    Cluster.tsx             ← cluster wrapper + fragment positioning
    ClusterLabel.tsx        ← title shown at macro zoom level
  edges/
    Edge.tsx                ← connection between clusters
    EdgeLabel.tsx           ← verb label on edge
    EdgeMidpoint.tsx        ← midpoint dot, hover bloom menu
  ui/
    Sidebar.tsx
    StatusBar.tsx
    SearchInput.tsx         ← initial query input
    ContextMenu.tsx         ← fragment hover menu
  tokens/
    tokens.ts               ← JS token constants
  styles/
    webs-tokens.css         ← CSS custom properties (source of truth)
    index.css               ← global base styles
    canvas.css
    fragments.css
    ui.css
  api/
    generate.ts             ← Anthropic API call + prompt
    types.ts                ← all TypeScript interfaces
  App.tsx
  main.tsx
```

### TypeScript Interfaces

```typescript
// All core types live in src/api/types.ts

type FragmentType =
  | "person"
  | "concept"
  | "thesis"
  | "source"
  | "event"
  | "era"
  | "domain"
  | "quote";

type LayoutType =
  | "vertical-flow"
  | "image-hero"
  | "quote-centered"
  | "card-split"
  | "timeline"
  | "list-prominent";

interface FragmentSlot {
  type: "body" | "image" | "tags" | "list" | "disclaimer";
  content?: string;        // body, image url, disclaimer
  items?: string[];        // tags, list
}

interface Fragment {
  id: string;
  type: FragmentType;
  layout: LayoutType;      // API decides, rules defined below
  title: string;
  slots: FragmentSlot[];
  createdAtZoom: number;   // zoom level at time of creation
  starred: boolean;
}

interface Cluster {
  id: string;
  x: number;              // canvas position
  y: number;
  title: string;
  isSeed: boolean;
  fragments: Fragment[];
}

interface Edge {
  id: string;
  sourceClusterId: string;
  targetClusterId: string;
  label: string;          // verb: "shaped by", "resulted in", etc.
}

interface CanvasState {
  clusters: Cluster[];
  edges: Edge[];
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
  query: string;
  createdAt: number;
}
```

---

## PAN-ZOOM CANVAS

Build a custom pan-zoom layer. Do not use any library for this.

```typescript
// usePanZoom.ts — core logic

const MIN_ZOOM = 0.05;
const MAX_ZOOM = 4;
const ZOOM_SPEED = 0.006;

// State
const [transform, setTransform] = useState({ x: 0, y: 0, zoom: 0.7 });

// Wheel handler — zoom toward cursor position
const onWheel = (e: WheelEvent) => {
  e.preventDefault();
  const delta = e.deltaY * ZOOM_SPEED * -1;
  const newZoom = clamp(transform.zoom + delta * transform.zoom, MIN_ZOOM, MAX_ZOOM);
  const ratio = newZoom / transform.zoom;
  setTransform({
    x: e.clientX - ratio * (e.clientX - transform.x),
    y: e.clientY - ratio * (e.clientY - transform.y),
    zoom: newZoom,
  });
};

// Pan — mouse drag on canvas background only
// Apply to canvas element:
// style={{ transform: `translate(${x}px, ${y}px) scale(${zoom})` }}
// transform-origin: 0 0
```

Canvas element receives `transform: translate(x, y) scale(zoom)` with `transform-origin: 0 0`. All cluster positions are in canvas-space coordinates. Convert to screen space for pointer events.

---

## LEVEL OF DETAIL (LOD)

Three zoom thresholds that determine what is rendered:

```typescript
const LOD_FULL = 0.45;      // > 0.45: full fragment cards with all slots
const LOD_COMPACT = 0.18;   // 0.18–0.45: color bars + cluster title only
const LOD_MACRO = 0.18;     // < 0.18: cluster title + tiny color dots only

function getLOD(zoom: number): "full" | "compact" | "macro" {
  if (zoom > LOD_FULL) return "full";
  if (zoom > LOD_MACRO) return "compact";
  return "macro";
}
```

At LOD `compact`: render cluster title and colored horizontal bars (one bar per fragment, color = fragment type color).
At LOD `macro`: render cluster title only, with tiny 6px color dots.
At LOD `full`: render complete Fragment components with all slots.

Fragments are only interactive (hover, click, drag) at LOD `full`.

---

## FRAGMENT COMPONENT SYSTEM

### The Core Model
One master `<Fragment>` component. It receives a `Fragment` object and renders its slots according to the layout type. The layout is determined by the API based on fragment type (see mapping below). The visual execution of each layout is done with CSS Grid.

The designer (Anton) will iterate on the visual execution of layouts manually. **Do not lock in pixel-perfect layout decisions.** Build the correct structure and make it easy to restyle.

### Fragment Type → Default Layout Mapping
```typescript
const LAYOUT_FOR_TYPE: Record<FragmentType, LayoutType> = {
  person:  "image-hero",
  concept: "vertical-flow",
  thesis:  "vertical-flow",
  quote:   "quote-centered",
  source:  "card-split",
  event:   "timeline",
  era:     "vertical-flow",
  domain:  "vertical-flow",
};
```

### Fragment Type Colors
Defined as CSS custom properties. Read from `webs-tokens.css`. Reference only:
```css
--color-fragment-person-bg:   #00E87B;
--color-fragment-person-text: #0a0a0a;
--color-fragment-concept-bg:  #FF6D00;
--color-fragment-concept-text:#0a0a0a;
--color-fragment-thesis-bg:   #FF3B30;
--color-fragment-thesis-text: #ffffff;
--color-fragment-source-bg:   #00D4FF;
--color-fragment-source-text: #0a0a0a;
--color-fragment-event-bg:    #FF9F0A;
--color-fragment-event-text:  #0a0a0a;
--color-fragment-era-bg:      #BF5AF2;
--color-fragment-era-text:    #ffffff;
--color-fragment-domain-bg:   #1a1a1a;
--color-fragment-domain-text: rgba(255,255,255,0.75);
--color-fragment-quote-bg:    #2563EB;
--color-fragment-quote-text:  #ffffff;
```

### Slot Rules
Each slot has its own background, padding, and border. Slots are flush against each other — no gap between them. Each slot type is a discrete visual block.

```
slot types:     body | image | tags | list | disclaimer
slot bg:        var(--color-slot-bg)         [white]
slot border:    1px solid var(--color-slot-border)
slot padding:   var(--spacing-base) [16px]
image padding:  0
disclaimer bg:  var(--color-disclaimer-bg)
```

### Fragment Header
The colored type label. Sits above the card — not inside it. Floats between canvas and card. Width is `fit-content` — it never stretches to card width.

```css
.fragment__header {
  display: inline-flex;
  align-items: center;
  height: var(--size-header-height);       /* 32px */
  padding: 0 var(--size-header-pad-x);     /* 0 14px */
  width: fit-content;                       /* never stretches */
  font-size: var(--font-size-header);
  font-weight: var(--font-weight-regular);
  letter-spacing: var(--tracking-tight);
  /* background and color set by fragment type */
}
```

### Layout Implementations
Each layout uses CSS Grid. These are starting implementations — the designer will iterate. Build them correctly, not beautifully.

**vertical-flow** (concept, thesis, era, domain):
```css
.fragment--vertical-flow {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0;                          /* slots flush */
  width: 320px;
}
```

**image-hero** (person):
```css
.fragment--image-hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  width: 480px;
}
/* header spans both columns */
/* image takes left column, spans multiple rows */
/* body/tags on right */
```

**quote-centered** (quote):
```css
.fragment--quote-centered {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0;
  width: 320px;
}
/* quote slot: larger font, italic, centered */
```

**card-split** (source):
```css
.fragment--card-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  width: 480px;
}
/* header spans both */
/* image left, body right */
/* tags span both */
```

**timeline** (event):
```css
.fragment--timeline {
  display: grid;
  grid-template-columns: 64px 1fr;
  gap: 0;
  width: 400px;
}
/* era label anchors left column */
/* title/body/tags flow right column */
```

**list-prominent** (list):
```css
.fragment--list-prominent {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  width: 480px;
}
/* list takes left, body takes right */
/* tags span both */
```

### Fragment Contextual Menu
Appears on hover. Positioned below the fragment card. Uses `position: absolute`, `z-index: 1000`. Does not affect layout of surrounding elements.

Four icon buttons only. No labels:
- 🔍 Fact check (calls API, returns verification)
- 🔀 Pivot (calls API, generates related fragments)
- ⭐ Star (toggles `starred` on fragment)
- 🗑️ Delete (removes fragment from cluster)

---

## CLUSTER SYSTEM

Clusters are groups of semantically related fragments arranged in proximity on the canvas. They have no visual border — the grouping is implied by spatial proximity.

### Cluster Positioning (from seed)
On initial generation, clusters orbit the seed fragment:
```typescript
function positionClusters(clusters: Cluster[]): Cluster[] {
  const SEED_INDEX = clusters.findIndex(c => c.isSeed);
  const BASE_RADIUS = 700;
  const JITTER = 100;
  const angleStep = (Math.PI * 2) / (clusters.length - 1);

  return clusters.map((cluster, i) => {
    if (cluster.isSeed) return { ...cluster, x: 0, y: 0 };
    const angle = angleStep * (i - 1);
    const r = BASE_RADIUS + (Math.random() - 0.5) * JITTER;
    return {
      ...cluster,
      x: Math.cos(angle) * r,
      y: Math.sin(angle) * r,
    };
  });
}
```

### Fragments Within a Cluster
Fragments within a cluster are arranged in a loose grid — not perfectly aligned. Small random offsets (±8px x, ±8px y) applied at mount time. Fragments are draggable independently within the canvas space.

### Seed Fragment
Special cluster. Visually distinct:
- Background color: `#D2F34C` (lime green)
- Small "exploring" micro-label above title
- Title = user's original query (lowercase)
- Body = 2-3 sentences of AI-generated context
- No contextual menu
- Positioned at canvas center; viewport centers on it at zoom 0.7

### Cluster Label
Visible at LOD `compact` and `macro`. Simple text label, positioned above the cluster's bounding area. No background, no border.

---

## EDGE SYSTEM

Connections between clusters (not fragments). Thin SVG lines drawn between cluster center points.

```typescript
// Edge rendering: SVG overlay, positioned absolute over canvas
// One <svg> element covering entire canvas space
// Each edge is a <line> or <path> element
// Midpoint: render a small dot (6px circle) at midpoint of each edge
```

### Edge Midpoint Interaction
On hover of midpoint dot: bloom menu appears. Two options:
- Edit label (inline text input replaces label)
- Delete edge

### Edge Labels
Short verb phrases. Rendered as text centered on the edge midpoint. Examples: "shaped by", "resulted in", "challenged by", "enabled", "inspired".

### Creating Edges
User drags from one cluster to another. On release, inline text input prompts for a verb label. Press Enter to confirm. Press Escape to cancel.

---

## AI GENERATION

### API Call
```typescript
// src/api/generate.ts
const response = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "claude-sonnet-4-5",
    max_tokens: 4000,
    messages: [{
      role: "user",
      content: buildPrompt(query)
    }]
  })
});
```

### Prompt Structure
The prompt must instruct Claude to return a JSON object with:
```typescript
{
  context: string,          // 2-3 sentence grounding paragraph for seed
  clusters: Array<{
    title: string,
    fragments: Array<{
      type: FragmentType,
      title: string,
      slots: FragmentSlot[],
    }>
  }>,
  edges: Array<{
    source: string,         // cluster title
    target: string,
    label: string,          // verb phrase
  }>
}
```

Rules for AI output:
- 5 clusters minimum, 8 maximum
- 3-5 fragments per cluster
- Each fragment must have at least a `body` slot
- Image slots should be omitted from API response (images fetched separately or left empty)
- Layout is assigned by the client based on `LAYOUT_FOR_TYPE` mapping, not by the API

### API Key
`VITE_ANTHROPIC_API_KEY` in `.env.local`. Never committed. If key is absent, use mock data (a hardcoded example `CanvasState` that covers all fragment types and layouts).

### Pivot Action
When user clicks 🔀 on a fragment:
- Call API with the fragment's title and body as context
- Generate 3-5 new fragments related to this one
- Create a new cluster near the source fragment
- Connect it to the source cluster with an edge labelled "explored via"

---

## TOKEN SYSTEM

All design values live in `src/styles/webs-tokens.css` as CSS custom properties. All values in components reference these variables. No hardcoded hex values, pixel sizes, or font names in component files.

### Token Categories

**Spacing** (px):
```css
--spacing-none: 0px;
--spacing-xxs:  2px;
--spacing-xs:   4px;
--spacing-sm:   8px;
--spacing-base: 16px;
--spacing-md:   24px;
--spacing-lg:   32px;
--spacing-xl:   48px;
--spacing-xxl:  64px;
```

**Sizes**:
```css
--size-header-height:       32px;
--size-header-pad-x:        14px;
--size-tag-height:          22px;
--size-tag-pad-x:           8px;
--size-image-height:        240px;
--size-image-height-small:  200px;
```

**Typography**:
```css
--font-primary:             "Neue Haas Unica", "Helvetica Neue", Arial, sans-serif;
--font-size-header:         20px;
--font-size-body:           16px;
--font-size-tag:            12px;
--font-size-disclaimer:     11px;
--font-size-meta:           10px;
--font-weight-regular:      400;
--line-height-tight:        1;
--line-height-normal:       1.3;
--line-height-relaxed:      1.5;
--tracking-tight:           -0.05em;
--tracking-normal:          -0.01em;
--tracking-wide:            0.05em;
```

**Color Prominence** (opacity multipliers, applied in code):
```css
--prominence-full:          1;
--prominence-secondary:     0.75;
--prominence-tertiary:      0.58;
--prominence-quaternary:    0.28;
--prominence-disabled:      0.1;
```

The visual design values for colors, surfaces, and UI chrome must be derived from the skills folder (`/skills/type.css`, `/skills/colors/`, `/skills/ui-kit/`). Do not invent these values.

---

## UI SHELL

### Sidebar
Left-side panel. Contains:
- App logo/wordmark ("webs")
- Query input (start new exploration)
- Session history (list of past explorations by date/title)
- Fragment count, cluster count stats

Plain HTML + CSS. No Ant Design. No component library. Derive visual style from skills folder.

### Status Bar
Bottom of canvas. Shows:
- Current zoom level (e.g., "0.7×")
- Fragment count
- Cluster count
- Connection indicator (online/offline)

Single line, minimal. Plain CSS.

### Initial State
On first load with no session: centered query input on blank canvas. Simple. No sidebar visible until a session exists.

---

## SESSION PERSISTENCE

Save and load `CanvasState` to `localStorage`.

```typescript
// Save on any state change (debounced 1000ms)
localStorage.setItem("webs-session", JSON.stringify(canvasState));

// Load on mount
const saved = localStorage.getItem("webs-session");
if (saved) setCanvasState(JSON.parse(saved));
```

Store multiple sessions:
```typescript
localStorage.setItem("webs-sessions", JSON.stringify(allSessions));
// each session: { id, title, createdAt, state: CanvasState }
```

---

## QUALITY GATES

Before considering any task complete, verify:

1. **No React Flow imports anywhere** in the codebase
2. **No Ant Design imports anywhere** in the codebase
3. **No hardcoded hex values** in component files — only CSS variable references
4. **No hardcoded pixel values** in component files — only CSS variable references
5. **No font-weight above 400** anywhere in the codebase
6. **Fragment header is `fit-content` width** — never stretches to card width
7. **Slot gaps are 0** — slots are flush against each other
8. **Canvas pan-zoom works** at zoom range 0.05–4 without jank
9. **LOD transitions are smooth** — no flicker between zoom levels
10. **Seed fragment is visually distinct** from all other fragments
11. **Contextual menu does not push layout** — absolute positioned, z-indexed
12. **All token values reference CSS variables** — run grep for hardcoded values before marking complete
13. **Mock data covers all 8 fragment types and all 6 layout types** — visible without an API key
14. **Session saves and restores correctly** — reload page, state persists

---

## WHAT CLAUDE CODE MUST NOT DO

- Do not make visual design decisions. Derive all aesthetics from the skills folder.
- Do not install any canvas library, diagram library, or graph library.
- Do not install Ant Design or any other component library.
- Do not install Tailwind CSS.
- Do not use CSS-in-JS.
- Do not use inline styles for design values — use CSS classes and custom properties.
- Do not add features not described in this document.
- Do not auto-format or prettify token values — preserve them exactly.
- Do not rename CSS custom properties already defined in `webs-tokens.css`.
- Do not modify the Vite config, Netlify config, or font loading unless a bug requires it.
- Do not add TypeScript `any` types — define all interfaces properly.

---

## OPEN QUESTIONS (do not resolve without asking)

The following are intentionally left open. Claude Code must surface these to the designer before implementing:

1. **Fragment layout visual execution** — The grid structure is defined, but exact slot proportions, widths, image heights, and visual treatment within each layout are for the designer to specify. Build the structure, leave visual iteration for the designer.
2. **Sidebar design** — Overall structure is defined. Visual execution must be derived from the skills folder, but the designer may want to review before finalising.
3. **Tag component design** — Tags are defined as slots. Their exact visual treatment (background, border, shape) must match the skills folder aesthetic. Check with designer.

---

## HOW THIS PROJECT IS WORKED ON

This project is built in targeted sessions. Each session focuses on one specific part of the app — not the whole thing. This is intentional. Do not scope-creep into adjacent systems.

### Two-Document System

There are always two documents in play:

**`CLAUDE.md`** (repo root, permanent) — the full architecture, token system, quality gates, what not to touch. This document. It is the source of truth for the entire project. It does not change session to session — it accumulates. At the end of each session, Claude Code updates the WIP tracker table in this file to reflect what was completed, what is in progress, and what hasn't been started.

**`SESSION.md`** (repo root, gitignored) — created fresh before each session. Defines the scope of the current session only. Files in scope, files off-limits, specific goals, design intent, reference images if any. Claude Code reads both documents on every session start. SESSION.md takes priority for scope. CLAUDE.md takes priority for architecture and constraints.

### Session Start Protocol (Claude Code must follow this every time)

```
1. Read CLAUDE.md in full
2. Read SESSION.md in full
3. Check the WIP tracker — understand what is done and what isn't
4. Identify all files listed as in-scope in SESSION.md
5. Confirm you will not touch files listed as off-limits
6. State your understanding of today's goal in one sentence
7. Only then begin
```

### Session End Protocol (Claude Code must follow this every time)

```
1. Update the WIP tracker in CLAUDE.md with current status of all touched features
2. Note any decisions made during the session that affect architecture
3. Note any open questions that arose
4. Do not leave the WIP tracker stale
```

### Design Decision Pipeline

Design decisions are made in a separate Claude chat (claude.ai) before a session begins — not during a Claude Code session. The output of that design chat becomes the content of SESSION.md. Claude Code executes. It does not design.

If Claude Code encounters an ambiguity about visual design or interaction behaviour during a session, it must stop and surface it as a question rather than making a decision.

---

## SESSION.md TEMPLATE

Copy this to `SESSION.md` in the repo root before each session. Fill it in. Add SESSION.md to `.gitignore`.

```markdown
# SESSION.md
# Webs — current session scope
# [date]

## Goal
[One sentence. What will be different at the end of this session that isn't true now.]

## Context
[Optional. 2-3 sentences of background if needed. What decisions led to this session.]

## In scope
[List specific files and components that may be touched this session.]

src/
  [file or folder]
  [file or folder]

## Off limits
[List everything Claude Code must not touch. Be explicit.]

Everything not listed above is off limits, specifically:
- [file or folder]
- [file or folder]

## Specific goals
[Numbered list. Each item is a discrete thing that must be true at the end of the session.]

1.
2.
3.

## Design intent
[Describe the intended behaviour, look, or feel. Be specific. Reference images if you have them.]

## Reference
[Optional. Link to Figma, attach images, paste a description from the design chat.]

## Known constraints
[Anything Claude Code should know going in. Edge cases, things that broke last time, dependencies.]

## Definition of done
[How will we know this session is complete? What is the test?]
```

---

## WORK IN PROGRESS TRACKER

Claude Code updates this table at the end of every session.

| Feature | Status | Notes | Last touched |
|---------|--------|-------|--------------|
| React Flow removal | DONE | @xyflow/react uninstalled; all node/edge components deleted; zero imports in src/ | Session 01 |
| Ant Design removal | DONE | antd + antd-style uninstalled; ConfigProvider stripped from main.jsx; zero imports in src/ | Session 01 |
| Custom pan-zoom canvas | DONE | Full implementation: usePanZoom.ts (zoom-toward-cursor, pan), Canvas.tsx (passive wheel via addEventListener), canvas.css (fixed viewport, transform-origin 0 0) | Session 02 |
| Dot grid background | DONE | SVG pattern in screen space; spacing = 24 * zoom; offset = x mod spacing; fill = --color-canvas-dot | Session 02 |
| LOD system (macro/compact/full) | DONE | getLOD() exported from useCanvas.ts; thresholds from tokens; lod prop computed once in Canvas.tsx and passed down | Session 03 |
| Fragment component (structure) | DONE | Fragment.tsx: master component with LOD branching (compact bar / macro dot / full card), layout routing, menubar | Session 05 |
| Fragment layouts — vertical-flow | DONE | VerticalFlow.tsx: body → tags → list → disclaimer; 320px wide | Session 05 |
| Fragment layouts — image-hero | DONE | ImageHero.tsx: image placeholder + body + tags; 200px wide, sm chip | Session 05 |
| Fragment layouts — quote-centered | DONE | QuoteCentered.tsx: full blue card, no chip, 28px text, 380px wide | Session 05 |
| Fragment layouts — card-split | DONE | CardSplit.tsx: body + tags + disclaimer; 320px wide | Session 05 |
| Fragment layouts — timeline | DONE | Timeline.tsx: body + list + tags; 320px wide | Session 05 |
| Fragment layouts — list-prominent | DONE | ListProminent.tsx: list + body + tags; 320px wide | Session 05 |
| Fragment contextual menu | DONE | Inline menubar in Fragment.tsx; absolutely positioned below card; opacity:0→1 on hover; delete/pivot/fact/star | Session 05 |
| Fragment header (floating label) | DONE | FragmentHeader.tsx: LabelChip with md/sm sizes; inline CSS var for bg/color; width: fit-content; -1px overlap with card | Session 05 |
| Slot system | DONE | All 5 slot components implemented: BodySlot, TagsSlot, ListSlot, DisclaimerSlot, ImageSlot; image placeholder uses grey bg | Session 05 |
| Cluster system | DONE | Cluster.tsx is now a spawn-point marker (dark label box); fragments are independent entities with own x,y; data model overhauled Session 04 | Session 04 |
| Cluster positioning (orbit) | IN PROGRESS | MOCK_CLUSTERS + MOCK_FRAGMENTS hardcoded in useCanvas.ts; positionClusters() orbit math in generate.ts for API wiring later | Session 04 |
| Cluster labels (compact/macro) | DONE | ClusterLabel.tsx unchanged; cluster spawn points use .cluster-spawn__label styling | Session 04 |
| Seed fragment | DONE | Seed spawn point uses --color-seed-bg lime green label | Session 04 |
| Connector system (SVG layer) | DONE | ConnectorLayer.tsx + Connector.tsx; tether/weak/standard/strong types; overflow:visible SVG at canvas origin | Session 04 |
| Connector tether proximity | DONE | Continuous lerp: opacity 0.2→0.08, dasharray 0→4 6 over 200–600px distance | Session 04 |
| Connector labels (editable) | DONE | ConnectorLabel.tsx — pill on standard/strong; double-click to edit; Enter/Escape confirm/cancel | Session 04 |
| Connector context menu | DONE | Right-click on line or label: Make strong / Make standard / Delete per type; dismissed on window click | Session 04 |
| Connector creation (drag) | DONE | Drag fragment onto another fragment → standard connector created; position reverted | Session 04 |
| Fragment drag (independent) | DONE | Window-level mousemove/mouseup; zoom-corrected delta; stopPropagation prevents canvas pan | Session 04 |
| Session persistence (localStorage) | DONE | useCanvas.ts: debounced 1000ms auto-save to webs-canvas-${projectId}; viewport synced via updateViewport; restored on mount from initialState prop | Session 06 |
| Multi-tab canvas | DONE | useTabs.ts manages AppState (tabs[], activeTabId) + persists to webs-app-state; Canvas keyed by activeTabId for clean remount on switch; max 20 tabs | Session 06 |
| Tab strip UI | DONE | TabStrip.tsx: 40px Figma-style strip; active tab has 2px bottom indicator; double-click to rename inline; × close with confirm; + add button | Session 06 |
| Fragment copy/paste (keyboard) | DONE | Cmd/Ctrl+C copies hovered fragment; Cmd/Ctrl+V pastes clone into active tab at (0,0) with clusterId='imported'; cross-tab via App.tsx copiedFragment state | Session 06 |
| Projects index (library foundation) | DONE | webs-projects-index in localStorage maintained via updateProjectMeta(); no UI yet — data model ready for future library view | Session 06 |
| Canvas layout (flex) | DONE | canvas.css: position:fixed→position:relative+flex:1+min-height:0 to sit below tab strip in App.tsx flex column | Session 06 |
| AI generation pipeline | DONE | generateCanvas() in generate.ts; system prompt + user message in prompt.ts; schema fix (Cluster.label, flat fragments); buildSlots() converts flat API fields to FragmentSlot[]; safe JSON parse with mock fallback; positionClusters() + fragmentPositions() for layout | Session 07 |
| Pivot action | DONE | generatePivot() fully implemented; new signature takes Fragment + sourceClusterId; buildPivotPrompt() + getMockPivotResult() added; addPivotCluster() atomic action in useCanvas; loading overlay + error state in Fragment.tsx; smooth 400ms viewport pan after spawn; chain pivoting verified | Session 08 |
| Sidebar | NOT STARTED | Stub at src/ui/Sidebar.tsx | Session 01 |
| Status bar | DONE | StatusBar.tsx: 32px strip, absolute bottom of canvas-wrapper; zoom level (live), fragment count, cluster count, online/offline dot; derives state from Canvas.tsx directly | Session 08 |
| Initial state (blank canvas + input) | DONE | App.tsx: conditional render — empty tab shows SearchInput on dot-grid; isGenerating shows LoadingCanvas (pink/cobalt strip + query text); non-empty shows Canvas; error state shows LoadingCanvas with retry; new tabs default to EMPTY_CANVAS_STATE | Session 07 |
| Token system (CSS variables) | DONE | src/styles/webs-tokens.css created with full token set; src/tokens/tokens.ts mirrors as JS constants | Session 01 |
| Mock data (all 8 types + 6 layouts) | DONE | Moved to src/api/mock.ts; getMockCanvasState(query) overrides seed title with query; correct schema (Cluster.label, flat fragments with clusterId); useTabs seeded with EMPTY_CANVAS_STATE (not mock) so first load shows SearchInput | Session 07 |

Status values: `NOT STARTED` / `IN PROGRESS` / `DONE` / `NEEDS REVIEW` / `BLOCKED`

---

## PLAN MODE INSTRUCTION

Enter plan mode. Read the full brief above, including the workflow section. Then:

1. Audit the existing repo — list every file that will be deleted, kept, or modified
2. List every new file that will be created
3. Describe the build sequence (what gets built in what order and why)
4. Check the WIP tracker — note current state of all features
5. Identify any ambiguities or missing information before starting
6. Propose the plan for designer approval before writing any code

Do not write code in plan mode. Surface the plan only.
