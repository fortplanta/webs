# WEBS — Claude Code Architecture Brief
# May 2026

---

## READ THIS FIRST

This document is the architecture and constraints reference for Webs. Read it completely before writing code. Do not make architectural decisions not covered here — ask instead.

**Three documents to read at session start:**
1. `CLAUDE.md` (this file) — architecture, component specs, token system, quality gates
2. `PROGRESS.md` — feature tracker and session history; check what is done and what isn't
3. `SESSION.md` — current session scope, goals, files in/out of scope

**Session start protocol:**
1. Read all three documents above
2. Identify files listed as in-scope in SESSION.md
3. Confirm you will not touch files listed as off-limits
4. State your understanding of today's goal in one sentence
5. Only then begin

Design decisions are made in Claude Chat before a session begins. The output of that design conversation becomes SESSION.md. Claude Code executes. It does not design. If you encounter an ambiguity about visual design or interaction behaviour, stop and surface it rather than deciding.

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

## TECHNICAL ARCHITECTURE

### Stack
```
Vite + React + TypeScript
React Flow (@xyflow/react) — canvas, pan/zoom, nodes, edges
Local/open-source LLM via Ollama by default; OpenAI-compatible endpoints supported
Plain CSS with custom properties (no CSS-in-JS, no Tailwind)
No Ant Design
No Three.js, no WebGL, no custom transform math
```

### Folder Structure
```
src/
  canvas/
    CanvasRF.tsx            ← React Flow canvas, nodes, edges, pan/zoom
    useCanvas.ts            ← canvas state: clusters, fragments, edges
    connections.ts          ← connection state helpers
    crossLinks.ts           ← cross-exploration links
  fragments/
    Fragment.tsx            ← master fragment component
    FragmentCard.tsx        ← card shell and layout switcher
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
    Cluster.tsx             ← legacy cluster display helper
    ClusterLabel.tsx        ← cluster title display helper
  edges/
    Edge.tsx                ← legacy/custom edge helpers
    EdgeLabel.tsx           ← edge label helper
    EdgeMidpoint.tsx        ← edge midpoint helper
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
  main.jsx
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
  | "quote"
  | "spark"
  | "text-note";

type LayoutType =
  | "vertical-flow"
  | "image-hero"
  | "quote-centered"
  | "card-split"
  | "timeline"
  | "list-prominent"
  | "text-note";

interface FragmentSlot {
  type: "body" | "image" | "tags" | "list" | "disclaimer";
  content?: string;        // body, image url, disclaimer
  items?: string[];        // tags, list
}

interface Fragment {
  id: string;
  clusterId: string;
  x: number;
  y: number;
  initialX?: number;
  initialY?: number;
  type: FragmentType;
  layout: LayoutType;      // API decides, rules defined below
  title: string;
  slots: FragmentSlot[];
  createdAtZoom: number;   // zoom level at time of creation
  starred: boolean;
  pinned?: boolean;
  anchored?: boolean;
  width?: number;
  note?: string;
  sources?: FragmentSource[];
  accordions?: AccordionSlot[];
  sparkMediaUrl?: string;
  sparkMediaType?: "image" | "text";
  sparkStatus?: "idle" | "processing" | "done";
  emptySlots?: SlotType[];
  historicalEra?: string;
}

interface Cluster {
  id: string;
  x: number;              // canvas position
  y: number;
  initialX?: number;
  initialY?: number;
  label: string;
  isSeed: boolean;
  note?: string;
  collapsed?: boolean;
}

interface Connector {
  id: string;
  sourceId: string;       // React Flow node id (usually a fragment id)
  targetId: string;       // React Flow node id (usually a fragment id)
  type: "standard" | "strong";
  renderType?: "bezier" | "straight" | "step" | "smoothstep";
  label: string;          // verb: "shaped by", "resulted in", etc.
}

interface CanvasState {
  clusters: Cluster[];
  fragments: Fragment[];
  connectors: Connector[];
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

Pan and zoom are handled by React Flow (`@xyflow/react`). Do not implement custom transform math or a custom pan-zoom hook. Use React Flow's built-in `<ReactFlow>` component with `minZoom`/`maxZoom` props and the `useReactFlow` hook for imperative viewport control (e.g. `fitView`, `setCenter`).

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
// src/api/llm.ts
await callLlm({
  system: SYSTEM_PROMPT,
  user: buildUserMessage(query),
  maxTokens: 8000,
  json: true,
});
```

### Prompt Structure
The prompt must instruct the configured LLM to return a JSON object with:
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
Default local config in `.env.local`:
```
VITE_LLM_PROVIDER=ollama
VITE_LLM_BASE_URL=http://localhost:11434
VITE_LLM_MODEL=qwen3:8b
```
Set `VITE_LLM_PROVIDER=mock` to force mock data. Set `VITE_LLM_PROVIDER=openai-compatible` plus `VITE_LLM_BASE_URL`, `VITE_LLM_MODEL`, and optional `VITE_LLM_API_KEY` to use a hosted or self-hosted OpenAI-compatible endpoint.

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

1. **No Ant Design imports anywhere** in the codebase (React Flow is allowed — it is the canvas layer)
2. **No hardcoded hex values** in component files — only CSS variable references
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

### Three-document system

**`CLAUDE.md`** — architecture, component specs, token system, quality gates, constraints. Does not change session to session except for the architecture sections themselves.

**`PROGRESS.md`** — feature tracker and session log. Updated at the end of every session. This is where Claude Code records what was done, what is in progress, and any decisions that affect future sessions.

**`SESSION.md`** — created fresh before each session, gitignored. Defines scope of the current session only: files in/out of scope, specific goals, design intent. Takes priority over CLAUDE.md for scope. CLAUDE.md takes priority for architecture and constraints.

### Session end protocol (Claude Code must follow this every time)

```
1. Update the feature tracker in PROGRESS.md with current status of all touched features
2. Add a row to the session log table in PROGRESS.md
3. Note any architectural decisions made during the session in CLAUDE.md if they affect future sessions
4. Note any open questions that arose
5. Do not leave PROGRESS.md stale
```

### Design decision pipeline

Design decisions are made in Claude Chat before a session begins. The output of that conversation becomes SESSION.md. Claude Code executes. It does not design.

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

## FEATURE TRACKER

See `PROGRESS.md`. Updated at the end of every session.
