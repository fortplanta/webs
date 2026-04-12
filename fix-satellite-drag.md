# Fix: Satellite independent drag
# Read CLAUDE.md first, then action this in full.

## Problem
Satellites cannot be dragged independently. The whole cluster moves
but individual satellites do not respond to drag.

## Root cause
Either: (a) no drag handlers exist on satellites yet, or (b) mousemove/mouseup
listeners are attached to the element instead of window, causing React Flow
to swallow them.

## Fix

In SatelliteCard.tsx (or wherever satellites are rendered), replace
any existing drag logic with this exact pattern:

```tsx
const [localPos, setLocalPos] = useState({ x: props.x, y: props.y });
const dragRef = useRef<{
  startMx: number;
  startMy: number;
  startX: number;
  startY: number;
} | null>(null);

const onMouseDown = (e: React.MouseEvent) => {
  e.stopPropagation(); // prevents React Flow dragging the whole node
  e.preventDefault();

  dragRef.current = {
    startMx: e.clientX,
    startMy: e.clientY,
    startX: localPos.x,
    startY: localPos.y,
  };

  const onMove = (ev: MouseEvent) => {
    if (!dragRef.current) return;
    setLocalPos({
      x: dragRef.current.startX + (ev.clientX - dragRef.current.startMx),
      y: dragRef.current.startY + (ev.clientY - dragRef.current.startMy),
    });
  };

  const onUp = (ev: MouseEvent) => {
    if (!dragRef.current) return;
    const finalX = dragRef.current.startX + (ev.clientX - dragRef.current.startMx);
    const finalY = dragRef.current.startY + (ev.clientY - dragRef.current.startMy);
    props.onDragEnd(props.id, finalX, finalY);
    dragRef.current = null;
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
  };

  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
};
```

Apply `onMouseDown` to the satellite's outermost div.
Use `localPos.x` and `localPos.y` for the satellite's `left`/`top` style.

## Rules
- mousemove and mouseup MUST be on window — not on the element, not on
  the node container. React Flow intercepts anything below window level.
- e.stopPropagation() MUST be on mousedown, not mousemove.
- Do not use React Flow drag. Do not use any drag library.
- Do not touch anything else. One file, one concern.
