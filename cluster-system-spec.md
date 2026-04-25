# Node Cluster System — Implementation Spec
# Webs · Claude Code Instructions
# Read CLAUDE.md first, then this document in full before writing any code.

---

## What we are building

When a user expands a context-node, a cluster of "satellite" cards blooms around
the primary card. Satellites float freely in space, loosely tethered to the primary
card by a dashed line. Users can drag satellites anywhere. User notes dragged close
to a cluster get absorbed into it.

---

## CRITICAL ARCHITECTURE DECISION — read before touching any file

Do NOT make satellites into separate React Flow nodes.

The naive approach (satellite = its own RF node, connected by a special edge) seems
logical but creates compounding problems: you can't drag the cluster as a unit,
React Flow selection breaks, edges render through other nodes, minimap is wrong,
and the group logic becomes its own system to maintain.

### The correct approach: expanded bounding box with internal absolute positioning

A cluster is ONE React Flow node. When expanded:

1. The node reports a large bounding box to React Flow (e.g. 640×560px)
2. The primary card renders at top-left inside this box, at its normal size
3. Satellites are absolutely positioned children of the node container,
   offset from the node's origin using x/y values stored in node data
4. The tether lines are an SVG element inside the node, rendering connectors
   from primary card center to each satellite center
5. Satellite positions are stored in the node's data object, not in React Flow state

This means:
- The whole cluster drags as one unit (React Flow handles it)
- Selection, minimap, and edge connections work normally
- Satellite dragging is handled with onMouseDown/onMouseMove within the node DOM
  (NOT React Flow drag — use e.stopPropagation() to prevent RF interference)

---

## Data model

Extend the existing node data shape. Add these fields to context-node data:

```typescript
interface SatelliteItem {
  id: string;           // unique, e.g. "sat_abc123"
  type: SatelliteType;
  x: number;            // offset from node origin (px)
  y: number;            // offset from node origin (px)
  content: SatelliteContent;
}

type SatelliteType =
  | 'image'
  | 'quote'
  | 'stat'
  | 'source'
  | 'video'
  | 'concept'
  | 'datapoint'
  | 'note';           // user-generated

type SatelliteContent =
  | { type: 'image';     src: string; caption?: string }
  | { type: 'quote';     text: string; attribution: string }
  | { type: 'stat';      value: string; label: string }
  | { type: 'source';    name: string; domain: string }
  | { type: 'video';     title: string; thumbnailSrc?: string; duration?: string }
  | { type: 'concept';   label: string; description?: string }
  | { type: 'datapoint'; value: string; unit: string; context: string }
  | { type: 'note';      text: string; addedAt: string };

// Add to existing context-node data:
interface ContextNodeData {
  // ... existing fields ...
  satellites?: SatelliteItem[];
  clusterExpanded?: boolean;
  // Bounding box when cluster is active:
  clusterWidth?: number;   // default: 640
  clusterHeight?: number;  // default: 560
}
```

---

## Satellite initial positioning

When a node expands and satellites are first created, scatter them using
polar coordinates within a radius band. This avoids clustering them all
at the same angle:

```typescript
function scatterSatellites(count: number): { x: number; y: number }[] {
  const PRIMARY_CARD_W = 221; // primary card width
  const PRIMARY_CARD_H = 160; // approximate primary card height
  const CARD_CENTER_X = PRIMARY_CARD_W / 2;
  const CARD_CENTER_Y = PRIMARY_CARD_H / 2 + 34; // + label height

  const MIN_RADIUS = 180;
  const MAX_RADIUS = 260;
  const positions = [];

  for (let i = 0; i < count; i++) {
    // Distribute angles evenly with jitter to avoid perfect symmetry
    const baseAngle = (i / count) * Math.PI * 2;
    const jitter = (Math.random() - 0.5) * (Math.PI / count);
    const angle = baseAngle + jitter;
    const radius = MIN_RADIUS + Math.random() * (MAX_RADIUS - MIN_RADIUS);

    positions.push({
      x: CARD_CENTER_X + Math.cos(angle) * radius - 44, // -44 = half satellite width
      y: CARD_CENTER_Y + Math.sin(angle) * radius - 30, // -30 = half satellite height
    });
  }
  return positions;
}
```

Assign these x/y values to each SatelliteItem when the cluster first expands.
Store them in node data so positions persist across re-renders.

---

## Component structure

### 1. Update ContextNode component

File: wherever ContextNode / context-node is defined (check src/components/nodes/)

```
ContextNode (React Flow custom node)
  .node-outer                          ← existing wrapper
    .node-label                        ← floating category label (existing)
    .context-node-card                 ← primary card (renamed from .context-node)
      [existing card contents]
      .source-strip                    ← NEW: source + fact-check row at bottom
    .cluster-layer                     ← NEW: only renders when clusterExpanded = true
      svg.cluster-tethers              ← NEW: dashed SVG lines from center to satellites
      .satellite[data-id]              ← NEW: one per satellite, absolutely positioned
```

### 2. Create SatelliteCard component

File: src/components/nodes/SatelliteCard.tsx (create new)

Renders the correct satellite variant based on `type`.
Accepts `x`, `y`, `onDragEnd: (id, x, y) => void` props.
Handles its own internal drag with stopPropagation.

### 3. Create ClusterTethers component

File: src/components/nodes/ClusterTethers.tsx (create new)

Renders an SVG with dashed lines from primary card center to each satellite center.
Re-renders when satellite positions change.

---

## Satellite card visual specs

All satellites follow the Neurodive token system (v2.0). No bold. Single weight (400).
Background: var(--surface) [white]. Border: var(--stroke) [1px solid hairline]. Border-radius: var(--radius) [0].
Shadow: var(--shadow-card). Padding: 8px (var(--s-2)).
Type label: var(--fs-small), lowercase, letter-spacing 0.08em, color: var(--fg-3).

### image  (width: 96px)
```
[type label: "image"]
[image area: 96×60px, bg var(--surface-alt) #EDEDED, centered placeholder text if no src]
```

### quote  (width: 140px, padding: 8px)
```
[large " mark: 22px, color var(--signal-quote) #0126DC, opacity 0.6]
[quote text: var(--fs-small), line-height 1.4, color var(--fg-2), italic]
[attribution: var(--fs-small), color var(--fg-3), margin-top 5px]
```

### stat  (width: 80px, centered)
```
[type label: "stat"]
[value: 22px, letter-spacing -0.03em, color var(--fg-strong)]
[label: var(--fs-small), lowercase, color var(--fg-3)]
```

### source  (width: 72px, centered)
```
[type label: "source"]
[logo box: 32×32px, bg var(--surface-alt) #EDEDED, border-radius: var(--radius) 0, domain initial]
[domain name: var(--fs-small), color var(--fg-3)]
```

### video  (width: 120px)
```
[type label: "video"]
[thumbnail: 120×68px, bg var(--surface-alt) #EDEDED]
[play icon: centered 16×16px triangle in rgba(0,0,0,0.35)]
[title: var(--fs-small), padding 5px 8px, color var(--fg-2)]
[duration badge: bottom-right of thumbnail, var(--fs-small), bg rgba(0,0,0,0.45), color white]
```

### concept  (width: 100px, padding: 8px)
```
[type label: "concept"]
[label: var(--fs-body), color var(--fg), margin-top 4px]
[description: var(--fs-small), color var(--fg-3), margin-top 3px, optional]
```

### datapoint  (width: 100px, padding: 8px)
```
[type label: "data"]
[value + unit: var(--fs-h4), letter-spacing var(--ls-h4), color var(--fg-strong)]
[context: var(--fs-small), color var(--fg-3), margin-top 3px]
```

### note  (width: 120px, padding: 8px)
```
[type label: "note" — color var(--cat-concept) #FFCC00 on var(--surface)]
[text: var(--fs-small), line-height 1.45, color var(--fg-2)]
[timestamp: var(--fs-small), color var(--fg-4), margin-top 6px]
```

---

## Tether line specs

```css
/* SVG lines from primary card center to each satellite center */
stroke: rgba(0, 0, 0, 0.10);
stroke-width: 1;
stroke-dasharray: 3 5;
/* No arrowheads. Pure dashed line. */
```

The SVG must be position: absolute, top: 0, left: 0, width: 100%, height: 100%,
pointer-events: none, z-index: 1. Satellites and primary card are z-index: 2+.

---

## Satellite dragging

Satellites must be draggable WITHOUT triggering React Flow node drag.

```typescript
// On satellite mousedown:
const handleSatMouseDown = (e: React.MouseEvent, satId: string) => {
  e.stopPropagation(); // CRITICAL: prevents React Flow from starting node drag
  // ... track mouse position, update satellite x/y in node data on mouseup
};
```

Use React state local to the node for in-progress drag position (smooth).
Commit final position to node data (via updateNodeData or your existing
state management pattern) on mouseup.

---

## Source strip + fact check (on primary card)

Add a source strip at the bottom of the primary card body:

```typescript
// Visual spec:
// .source-strip — border-top: 1px solid rgba(255,255,255,0.05), padding: 5px 13px
//   left: source domain + year — 9px, rgba(240,239,232,0.22)
//   right: [fact check] button — 8px uppercase, border: 1px solid rgba(255,255,255,0.10)

// Fact check button behavior:
// Opens a small floating panel INSIDE the cluster layer (not a modal, not a tooltip)
// Position: right edge of the node bounding box, vertically centered
// The panel shows: claim text, verification status dot + label, source list
// Dismiss: click outside or press Escape
```

The fact check panel is rendered as a child of the cluster layer div, positioned
with absolute CSS. It is NOT a React portal. It is NOT a global modal.

---

## Note proximity absorption

In the parent component that manages the React Flow canvas (likely App.tsx or
a canvas wrapper component), add an `onNodeDragStop` handler:

```typescript
const ABSORPTION_RADIUS = 150; // px

const onNodeDragStop = useCallback(
  (event: MouseEvent, draggedNode: Node) => {
    if (draggedNode.type !== 'noteNode') return; // only absorb note nodes

    const notePos = draggedNode.position;

    nodes.forEach(node => {
      if (!node.data?.satellites) return; // only cluster nodes
      const clusterPos = node.position;
      const dx = notePos.x - clusterPos.x;
      const dy = notePos.y - clusterPos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < ABSORPTION_RADIUS) {
        // 1. Convert the note to a satellite item
        const newSat: SatelliteItem = {
          id: `sat_${Date.now()}`,
          type: 'note',
          x: notePos.x - clusterPos.x,
          y: notePos.y - clusterPos.y,
          content: {
            type: 'note',
            text: draggedNode.data.text,
            addedAt: new Date().toISOString(),
          },
        };
        // 2. Add satellite to cluster node data
        updateNodeData(node.id, {
          satellites: [...(node.data.satellites || []), newSat],
        });
        // 3. Remove the note node from React Flow nodes
        deleteNode(draggedNode.id);
      }
    });
  },
  [nodes, updateNodeData, deleteNode]
);
```

Use whatever state management pattern already exists in the codebase —
do not introduce a new one. Do not use Zustand, Redux, or Context if
the project doesn't already use them.

---

## Cluster expanded bounding box

When clusterExpanded becomes true, the React Flow node must report
larger dimensions so RF handles selection and edges correctly.

If the existing node uses `width`/`height` in node data to set dimensions,
update those values when expanding. If the node uses CSS width only, add
an explicit style to the node wrapper div:

```typescript
const nodeStyle = clusterExpanded
  ? { width: '640px', height: '560px' }
  : undefined;
```

The node-outer wrapper must be position: relative with these expanded dimensions.
The primary card stays at its normal width (220px) at top-left inside this area.

---

## What the AI generation pipeline must return

This is a note for the backend/AI prompt — not a CSS task.

For the cluster system to work, the AI generation response for a context-node
must include a `satellites` array. Each item should match the SatelliteItem
content shape above.

Example (add to your existing AI response schema):
```json
{
  "title": "Financialization of everything...",
  "summary": "Large language models rewrote...",
  "source": { "domain": "reuters.com", "year": "2024" },
  "satellites": [
    { "type": "quote", "text": "...", "attribution": "..." },
    { "type": "stat", "value": "73%", "label": "of creative roles affected" },
    { "type": "concept", "label": "Attention economy", "description": "..." }
  ]
}
```

If the AI pipeline is not ready to return satellites yet, stub it:
hardcode 2–3 placeholder satellites on the Technology and Market Dynamics
nodes so the visual system can be tested without backend changes.

---

## Implementation phases — do in this order

### Phase 1: Satellite rendering (no drag)
- Add SatelliteItem type to codebase
- Stub satellite data on 2 nodes (hardcoded for now)
- Expand node bounding box when clusterExpanded = true
- Render satellites at their initial scattered positions (no drag yet)
- Render ClusterTethers SVG
- Verify: expanding a node shows floating satellites with dashed tethers

### Phase 2: Satellite dragging
- Add mousedown/mousemove/mouseup handlers to SatelliteCard
- stopPropagation on mousedown
- Persist final position to node data on mouseup
- Verify: individual satellites drag freely, cluster drags as unit

### Phase 3: Source strip + fact check panel
- Add source strip to primary card
- Add fact check button + floating panel
- Verify: panel opens/closes, does not break node drag

### Phase 4: Note proximity absorption
- Add onNodeDragStop proximity check
- Test with an existing note node dragged near a cluster

### Phase 5: AI pipeline integration
- Update AI prompt to return satellites array
- Remove hardcoded stub data
- Test with live generation

---

## Quality gates (in addition to CLAUDE.md gates)

- Satellites never render inside the primary card body
- Satellite drag does NOT move the whole node (stopPropagation working)
- Cluster drags as a single unit
- No satellite type uses font-weight above 400
- Tether lines do not render on top of card content
- Fact check panel renders inside the node DOM, not as a body-level portal
- Expanding a node does not cause layout shift in adjacent nodes

---

## Files likely to be touched

```
src/components/nodes/ContextNode.tsx     ← main changes
src/components/nodes/SatelliteCard.tsx   ← create new
src/components/nodes/ClusterTethers.tsx  ← create new
src/types/nodes.ts (or equivalent)       ← extend data types
src/App.tsx (or canvas wrapper)          ← onNodeDragStop for absorption
src/styles/webs-tokens.css               ← satellite CSS vars if needed
```

## Files NOT to touch

- AnchorNode.tsx (collapsed node — separate component, separate task)
- Any AI generation / API call logic (Phase 5 only, and only the prompt)
- React Flow configuration (edges, background, viewport)
- Session save/load logic
- Sidebar component
