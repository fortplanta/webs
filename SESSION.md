# SESSION.md
# Webs — Session 20: Multi-Select + Group Drag
# May 2026

## Goal
Implement box selection (drag on empty canvas to draw a selection rectangle) and multi-element drag (move all selected fragments, cluster spawn points, and connectors together).

## Context
Session 15 introduced the selection system with single-select and Shift+click. Box selection and group drag were specified but not implemented. This session completes that.

## Before starting

```
1. Read CLAUDE.md in full
2. Read SESSION.md in full
3. Read src/canvas/useSelection.ts — understand current selection state
4. Read src/canvas/Canvas.tsx — understand current mousedown/mousemove/mouseup handlers
5. Only then begin planning
```

## In scope

```
src/
  canvas/
    useSelection.ts     ← add box selection rect, multi-drag logic
    Canvas.tsx          ← wire box select draw, group drag
  styles/
    selection.css       ← selection rect already exists — verify it's correct
```

## Off limits

Everything else. Do not touch fragments, edges, UI, API, storage, tokens, Gantt, timeline.

---

## Box selection

Triggered by mousedown on empty canvas background in select tool mode — NOT on a fragment, cluster spawn, or connector.

```typescript
// State to add to useSelection.ts
const [boxSelect, setBoxSelect] = useState<{
  active: boolean;
  startX: number;   // canvas-space coords
  startY: number;
  currentX: number;
  currentY: number;
} | null>(null);
```

On canvas background mousedown (select tool):
1. Record start position in canvas space: `(e.clientX - transform.x) / transform.zoom`
2. Set `boxSelect` state, begin tracking

On mousemove (window-level, only when boxSelect active):
1. Update `currentX`, `currentY`
2. Render selection rectangle

On mouseup:
1. Compute bounding box of the drawn rectangle
2. Find all fragments and cluster spawn points whose bounding boxes intersect the selection rect
3. Add all to `selectedIds`
4. Clear `boxSelect` state

### Selection rectangle rendering

```css
.selection-rect {
  position: absolute;
  border: 1px solid #0D99FF;
  background: rgba(13, 153, 255, 0.05);
  pointer-events: none;
  z-index: 50;
}
```

Position and size derived from boxSelect state — handle all four drag directions (top-left, top-right, bottom-left, bottom-right origin):

```typescript
const rect = {
  left:   Math.min(boxSelect.startX, boxSelect.currentX),
  top:    Math.min(boxSelect.startY, boxSelect.currentY),
  width:  Math.abs(boxSelect.currentX - boxSelect.startX),
  height: Math.abs(boxSelect.currentY - boxSelect.startY),
};
```

Rendered inside the canvas transform div so it scales with zoom correctly.

### Intersection test

```typescript
function intersects(
  rect: { left: number; top: number; width: number; height: number },
  element: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    rect.left < element.x + element.width &&
    rect.left + rect.width > element.x &&
    rect.top < element.y + element.height &&
    rect.top + rect.height > element.y
  );
}
```

Fragment bounding box: `{ x: fragment.x, y: fragment.y, width: fragment.width ?? 320, height: 480 }`
Cluster spawn bounding box: `{ x: cluster.x - 8, y: cluster.y - 8, width: 16, height: 16 }`

---

## Group drag

When multiple elements are selected and the user mousedowns on any one of them, all selected elements move together.

```typescript
// State to add
const [groupDrag, setGroupDrag] = useState<{
  active: boolean;
  startMouseX: number;   // screen coords
  startMouseY: number;
  startPositions: Map<string, { x: number; y: number }>;  // id → original canvas position
} | null>(null);
```

On mousedown on a selected fragment or cluster spawn (when selectedIds.length > 1):
1. Record current mouse position in screen coords
2. Record current canvas position of ALL selected elements
3. Set `groupDrag` active
4. Prevent individual fragment drag from triggering — check `groupDrag` state in individual drag handlers

On window mousemove (when groupDrag active):
1. Compute delta in canvas space: `dx = (e.clientX - startMouseX) / transform.zoom`
2. Apply delta to ALL selected elements simultaneously:
   - Fragments: `fragment.x = startPositions.get(id).x + dx`
   - Cluster spawns: `cluster.x = startPositions.get(id).x + dx`
3. Single state update per mousemove — update all positions atomically

On window mouseup:
1. Commit final positions to canvas state
2. Trigger debounced save (existing mechanism)
3. Clear `groupDrag`

### Connector behaviour during group drag

Connectors between selected elements: both endpoints move → connector follows automatically (it reads from fragment/cluster positions).

Connectors between a selected and unselected element: one endpoint moves, the other stays → connector stretches. This is correct behaviour.

No special handling needed — connectors derive their endpoints from element positions at render time.

---

## Visual feedback during group drag

All selected elements show a subtle drag state:

```css
.fragment--group-dragging {
  opacity: 0.85;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
}

.cluster-spawn--group-dragging .cluster-spawn__marker {
  background: rgba(0,0,0,0.4);
}
```

Add `.fragment--group-dragging` class to all selected fragments during drag. Remove on mouseup.

---

## Keyboard interactions

| Key | Action |
|-----|--------|
| Escape | Deselect all, cancel box select if active |
| Delete / Backspace | Delete all selected fragments and cluster spawns (with confirmation if >3 elements) |
| Cmd+A / Ctrl+A | Select all fragments and cluster spawns on canvas |

Cmd+A implementation:
```typescript
if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
  e.preventDefault();
  const allIds = [
    ...fragments.map(f => f.id),
    ...clusters.map(c => c.id),
  ];
  setSelectedIds(allIds);
}
```

---

## Known constraints

- Box select mousedown must only trigger on the canvas background — check `e.target === canvasBackgroundRef.current` before starting box select
- Group drag delta must be divided by zoom — mouse movement is in screen pixels, positions are in canvas space
- Atomic position update: do not call setState once per element — batch all position updates in a single state update to avoid intermediate renders
- Box select and canvas pan must be mutually exclusive — both trigger on canvas background mousedown. Distinguish by tool: select tool = box select, always pan when tool is something else (or when middle mouse button is held)
- Do not start group drag if the mousedown target is a resize handle or connector dot

## Definition of done

- In select tool mode, drag on empty canvas. Blue selection rectangle draws. Release — all fragments and cluster spawns inside the rect are selected with blue outlines.
- Drag from bottom-right to top-left (reverse direction). Rectangle still draws correctly.
- With multiple elements selected, mousedown on any selected element and drag. All selected elements move together. Connectors between them follow. Connectors to unselected elements stretch.
- Press Cmd+A. All elements selected.
- Press Delete with multiple selected. Confirmation appears if >3. Elements removed.
- Press Escape. Selection clears.
- Box select does not trigger canvas pan. Canvas pan does not trigger box select.
- No console errors. Build passes. WIP tracker updated.
