# Feature: Anchored expansion panel + edge label editing
# Read CLAUDE.md first. Then read this in full before writing any code.

---

## Part 1 — Anchored floating expansion panel

### What changes

Currently: clicking a context-node adds class `.revealed` which makes the
node card grow in-place to 300–500px tall.

New behaviour: the context-node card stays at its locked/collapsed size
always. Clicking it opens a separate floating panel anchored to the node,
rendered using React Flow's NodeToolbar component.

### Why NodeToolbar

React Flow ships a <NodeToolbar> component specifically for this use case.
It renders outside the node's bounding box, stays anchored to the node
during pan and zoom, handles viewport clipping automatically, and does not
affect the node's reported dimensions. Import it:

```tsx
import { NodeToolbar, Position } from '@xyflow/react';
// or: import { NodeToolbar, Position } from 'reactflow';
// use whichever import the project already uses for React Flow
```

### Implementation

Inside the ContextNode component, wrap the existing revealed content in
a NodeToolbar instead of rendering it inside the card:

```tsx
// BEFORE (approximate current structure):
<div className={`context-node ${isRevealed ? 'revealed' : 'locked'}`}>
  {isRevealed && (
    <div className="context-node__body">
      {/* title, summary, image etc */}
    </div>
  )}
  <div className="context-node__locked-inner">
    {/* collapsed state */}
  </div>
</div>

// AFTER:
<>
  {/* Collapsed card — never changes size */}
  <div className="context-node locked" onClick={handleClick}>
    <div className="context-node__locked-inner">
      {/* collapsed state unchanged */}
    </div>
  </div>

  {/* Floating expansion panel — outside the node */}
  <NodeToolbar
    isVisible={isRevealed}
    position={panelPosition}  // see smart positioning below
    offset={12}
  >
    <div className="expansion-panel">
      {/* all revealed content moves here */}
    </div>
  </NodeToolbar>
</>
```

### Smart positioning

Default: panel opens to the RIGHT of the node.
Flip to LEFT if the node is in the right 40% of the viewport.
Flip to BOTTOM if the node is in the top 20% of the viewport.

```tsx
const [panelPosition, setPanelPosition] = useState<Position>(Position.Right);

useEffect(() => {
  if (!isRevealed) return;
  // Get node position in viewport coords using React Flow's useStore
  // or by reading the node's DOM position
  const el = document.querySelector(`[data-id="${id}"]`) as HTMLElement;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  if (rect.right > vw * 0.6) {
    setPanelPosition(Position.Left);
  } else if (rect.top < vh * 0.2) {
    setPanelPosition(Position.Bottom);
  } else {
    setPanelPosition(Position.Right);
  }
}, [isRevealed, id]);
```

### Expansion panel CSS

```css
.expansion-panel {
  width: 340px;
  background: #242424;
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 5px;
  box-shadow: 0 16px 40px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.3);
  overflow: hidden;
  /* Entrance animation */
  animation: panelReveal 0.18s ease-out;
}

@keyframes panelReveal {
  from {
    opacity: 0;
    transform: scale(0.97) translateY(4px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* Image area at top — only if node has image */
.expansion-panel__image {
  width: 100%;
  height: 180px;
  object-fit: cover;
  display: block;
  border-bottom: 1px solid rgba(255,255,255,0.07);
}

/* Content body */
.expansion-panel__body {
  padding: 16px 15px 14px;
}

.expansion-panel__title {
  font-size: 15px;
  line-height: 1.30;
  letter-spacing: -0.01em;
  color: rgba(240, 239, 232, 1.0);
  font-weight: 400;
  margin-bottom: 10px;
}

.expansion-panel__summary {
  font-size: 13px;
  line-height: 1.55;
  letter-spacing: 0.005em;
  color: rgba(240, 239, 232, 0.58);
  font-weight: 400;
}

/* Footer */
.expansion-panel__footer {
  border-top: 1px solid rgba(255,255,255,0.06);
  padding: 7px 15px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.expansion-panel__source {
  font-size: 9px;
  letter-spacing: 0.05em;
  color: rgba(240, 239, 232, 0.22);
}

.expansion-panel__close {
  font-size: 9px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(240, 239, 232, 0.28);
  cursor: pointer;
  background: none;
  border: none;
  font-family: var(--font-body);
  transition: color 0.1s;
}
.expansion-panel__close:hover {
  color: rgba(240, 239, 232, 0.7);
}
```

### Closing the panel

Close on:
- Clicking the close button in the panel footer
- Clicking outside (clicking the canvas pane — React Flow's onPaneClick)
- Pressing Escape
- Clicking the same node again (toggle)

Do NOT close when:
- User clicks inside the panel
- User scrolls/pans the canvas

### What stays the same

The `.context-node.locked` collapsed card keeps its exact current appearance.
The node-outer / node-label floating label architecture is unchanged.
The React Flow node's reported dimensions stay at the locked card size — never grow.

### Remove in-place expansion

Once the NodeToolbar panel is working:
- Remove the `.revealed` class grow behaviour from `.context-node` CSS
- Remove any height transitions on `.context-node`
- The card should be a fixed size regardless of state

---

## Part 2 — Edge label editing

### Current state

Edges have no midpoint interaction. The edge is a plain line.

### New behaviour

Three states:

**Resting:** Plain edge line. A small dot (4px, rgba(255,255,255,0.25))
sits at the midpoint. Not visible until hover.

**Hover:** Cursor approaches within ~20px of the midpoint dot.
The dot blooms — 5 dots appear in a tight cluster around the center point:
one center dot + four cardinal dots at 6px offset. All dots are 4px,
rgba(255,255,255,0.5). Animation: fade in over 0.1s.

**Clicked:** An inline label input appears at the midpoint, floating above
the edge. The dot cluster disappears.

### Implementation — Custom edge component

Create a new file: `src/components/edges/LabelEdge.tsx`

```tsx
import { EdgeProps, EdgeLabelRenderer, BaseEdge, getStraightPath, getBezierPath } from '@xyflow/react';

export function LabelEdge({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  data, style, markerEnd,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  const [hovered, setHovered] = useState(false);
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(data?.label || '');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDotClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditing(true);
    setHovered(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleSubmit = () => {
    setEditing(false);
    // persist label to edge data via your existing updateEdge pattern
  };

  return (
    <>
      <BaseEdge path={edgePath} style={style} markerEnd={markerEnd} />

      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="edge-label-root"
        >
          {!editing && (
            <div
              className={`edge-midpoint ${hovered ? 'hovered' : ''}`}
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
              onClick={handleDotClick}
            >
              {/* Center dot always present */}
              <div className="edge-dot edge-dot--center" />
              {/* Bloom dots — only on hover */}
              {hovered && (
                <>
                  <div className="edge-dot edge-dot--n" />
                  <div className="edge-dot edge-dot--s" />
                  <div className="edge-dot edge-dot--e" />
                  <div className="edge-dot edge-dot--w" />
                </>
              )}
              {/* Existing label if set */}
              {label && !hovered && (
                <div className="edge-label-text">{label}</div>
              )}
            </div>
          )}

          {editing && (
            <div className="edge-label-input-wrap">
              <input
                ref={inputRef}
                className="edge-label-input"
                value={label}
                onChange={e => setLabel(e.target.value)}
                onBlur={handleSubmit}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSubmit();
                  if (e.key === 'Escape') {
                    setEditing(false);
                  }
                }}
                placeholder="Label edge…"
              />
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
```

### Edge label CSS

```css
.edge-label-root {
  /* EdgeLabelRenderer requires nodrag nopan classes */
  pointer-events: all;
}

.edge-midpoint {
  position: relative;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

/* Invisible hit area — larger than visual */
.edge-midpoint::before {
  content: '';
  position: absolute;
  width: 32px;
  height: 32px;
  border-radius: 50%;
}

.edge-dot {
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transition: opacity 0.1s, background 0.1s;
}
.edge-midpoint:hover .edge-dot {
  background: rgba(255, 255, 255, 0.6);
}

.edge-dot--center { top: 50%; left: 50%; transform: translate(-50%,-50%); }
.edge-dot--n { top: calc(50% - 8px); left: 50%; transform: translateX(-50%);
  animation: dotBloom 0.1s ease-out; }
.edge-dot--s { top: calc(50% + 4px); left: 50%; transform: translateX(-50%);
  animation: dotBloom 0.1s ease-out 0.02s both; }
.edge-dot--e { top: 50%; left: calc(50% + 8px); transform: translateY(-50%);
  animation: dotBloom 0.1s ease-out 0.01s both; }
.edge-dot--w { top: 50%; left: calc(50% - 8px); transform: translateY(-50%);
  animation: dotBloom 0.1s ease-out 0.03s both; }

@keyframes dotBloom {
  from { opacity: 0; transform: translate(-50%,-50%) scale(0.4); }
  to   { opacity: 1; transform: translate(-50%,-50%) scale(1); }
}
/* Fix transforms per direction */
.edge-dot--n { transform: translate(-50%, 0); }
.edge-dot--s { transform: translate(-50%, 0); }
.edge-dot--e { transform: translate(0, -50%); }
.edge-dot--w { transform: translate(0, -50%); }

/* Existing label text (when set and not hovering) */
.edge-label-text {
  position: absolute;
  left: 50%;
  top: -18px;
  transform: translateX(-50%);
  font-size: 9px;
  letter-spacing: 0.06em;
  color: rgba(240, 239, 232, 0.28);
  white-space: nowrap;
  pointer-events: none;
  font-family: var(--font-body);
}

/* Input */
.edge-label-input-wrap {
  background: #1E1D1B;
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 3px;
  padding: 2px 4px;
  min-width: 100px;
}

.edge-label-input {
  background: transparent;
  border: none;
  outline: none;
  font-size: 11px;
  letter-spacing: -0.01em;
  color: rgba(240, 239, 232, 0.85);
  font-family: var(--font-body);
  font-weight: 400;
  width: 100%;
  text-align: center;
}

.edge-label-input::placeholder {
  color: rgba(240, 239, 232, 0.22);
}
```

### Register the custom edge

In the React Flow configuration (wherever `edgeTypes` is defined,
likely App.tsx or a canvas config file):

```tsx
import { LabelEdge } from './components/edges/LabelEdge';

const edgeTypes = {
  // keep any existing custom edge types
  default: LabelEdge,
  smoothstep: LabelEdge,
  // or whatever edge type the project uses
};

<ReactFlow
  edgeTypes={edgeTypes}
  // ... rest of config
/>
```

---

## Implementation order

1. Part 2 first — custom edge with midpoint dot (resting state only, no bloom yet)
   Verify the dot appears on all edges.

2. Part 2 — add hover bloom animation
   Verify dots animate in on hover.

3. Part 2 — add click-to-edit input
   Verify input opens, accepts text, closes on Enter/blur.

4. Part 1 — NodeToolbar expansion panel (render only, no animation)
   Verify panel appears to the right of the node on click.

5. Part 1 — add smart position flip logic
   Verify panel flips left when node is near right edge.

6. Part 1 — add entrance animation
   Verify panelReveal keyframe plays on open.

7. Part 1 — remove in-place expansion
   Remove .revealed grow behaviour. Verify collapsed card stays fixed size.

---

## Do not touch
- Satellite drag logic
- Cluster scatter/tether logic
- Context menu tool panel (separate task)
- Session management
- Sidebar
- AnchorNode component
- Any AI/API logic
