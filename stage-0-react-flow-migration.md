# Stage 0 — Migrate the canvas from React Three Fiber to React Flow
# Webs — single-session, scoped migration brief for Claude Code
# Read CLAUDE.md first. Then read this entire document before writing any code.

---

## Context you need before touching anything

The CLAUDE.md in this repo describes the stack as "React Flow." **That is currently
fiction.** React Flow was removed earlier and the canvas was rebuilt as a custom 3D
engine using React Three Fiber (R3F) + Three.js, driving an OrthographicCamera for
pan/zoom. The CLAUDE.md was not updated. Do not trust it on the rendering layer.

This migration reverses that decision. We are deleting the 3D engine and returning the
canvas to React Flow. The goal of THIS session is bounded and specific (see Definition
of Done). Do not attempt the whole product. Do not improve things that are not in scope.

### Why we are doing this (so you make aligned micro-decisions)
The 3D engine produces a zoom bug: HTML cards rendered over the WebGL scene drift out of
sync with the camera as zoom moves away from 1.0, causing cards to overlap and ghost
(double-exposure). This is structural — two coordinate systems (DOM tracking + camera
projection) cannot stay synced across zoom. React Flow uses ONE transform matrix on a
single viewport element, so all nodes share one coordinate space and drift is impossible.
We are not fixing the bug. We are deleting the architecture that causes it.

---

## Files in play (verified via grep — do not assume others)

**The engine (will be replaced, then deleted):**
- `src/canvas/Canvas.tsx`
- `src/canvas/CanvasBackground.tsx`
- `src/canvas/usePanZoom.ts`

**Content that must be TRANSLATED to React Flow (not deleted):**
- `src/fragments/SeedFragment.tsx` → becomes a React Flow custom node
- `src/edges/Connector.tsx`, `src/edges/ConnectorLayer.tsx`, `src/edges/bezier.ts`
  → see EDGES decision below

**WebGL effects — DELETE, do not port, do not preserve:**
- `src/effects/ColorBleed.tsx`
- `src/effects/DepthFog.tsx`
- `src/effects/DiscoveryParticles.tsx`
- `src/effects/SemanticEcho.tsx`
These depend on 3D depth that will no longer exist. They cannot survive a flat canvas.
Do not attempt to recreate them. Their replacement (flat, DOM-based "aliveness") is a
LATER stage and explicitly out of scope here.

**Dependencies to remove from package.json at the END (not before):**
`three`, `@types/three`, `@react-three/fiber`, `@react-three/drei`, `@react-spring/three`

---

## EDGES decision — CONFIRMED

The existing custom beziers do nothing special — they hold a label, nothing more.
**Therefore: delete `bezier.ts`, `Connector.tsx`, `ConnectorLayer.tsx` and use React
Flow's native bezier edges + edge labels.** Do not port custom bezier math the library
ships for free.

### Future edge-life intent — OUT OF SCOPE for Stage 0, captured so it isn't lost
In a LATER stage (not this one), edges will be styled to feel "alive" based on two
signals:
- **Link strength → stroke weight / opacity.** A data field on the edge drives a single
  CSS variable (hairline + ghosted for weak links, more present for strong). Literal,
  monochrome-safe encoding. No new colours.
- **Connection context → interaction response, NOT a colour legend.** Edge life comes
  from hover-spotlight behaviour (brighten on endpoint hover, recede when unfocused,
  optional slow directional pulse), folded into the later hover (B) and living-edge (C)
  stages — not from encoding edge type as hue. Do NOT turn the canvas into a coloured
  transit map.

For STAGE 0: render edges plain. Native bezier, label, default styling. Zero decoration,
zero animation, zero strength encoding. Boring on purpose. The life is a later stage on
a foundation that already works.

---

## Scope — do this, in this order, with a checkpoint

### Part 1 — Stand up React Flow (prove the ghost is dead)
1. Install React Flow: `npm install @xyflow/react`
2. Create a new canvas component that mounts `<ReactFlow>` with native pan/zoom.
   Wrap the app (or the canvas route) in `<ReactFlowProvider>` once.
3. Use this baseline configuration (adjust only if it breaks):
   ```tsx
   import { ReactFlow, Background, Controls, ReactFlowProvider,
            useNodesState, useEdgesState } from '@xyflow/react';
   import '@xyflow/react/dist/style.css';

   <ReactFlow
     nodes={nodes} edges={edges}
     onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
     nodeTypes={nodeTypes} edgeTypes={edgeTypes}
     colorMode="dark"
     panOnDrag panOnScroll zoomOnPinch
     minZoom={0.2} maxZoom={4}
     fitView
   >
     <Background /> <Controls />
   </ReactFlow>
   ```
   - `nodeTypes` / `edgeTypes` MUST be defined outside the component or via `useMemo`,
     else React Flow warns and over-renders.
   - All event handlers via `useCallback`.
4. Render TWO OR THREE DUMMY NODES (hardcoded placeholder data) and one edge between
   them. Not real content yet. Just enough to test pan/zoom.

### CHECKPOINT — stop and verify before continuing
- Pan by dragging the background: smooth, no jank.
- Zoom from minZoom to maxZoom and back: **the dummy nodes must NOT drift, overlap,
  or ghost at any zoom level.** This is the entire point. If they do, stop and report —
  something is still applying a second transform.
- Only proceed to Part 2 once this passes.

### Part 2 — Migrate real content
5. Rewrite `SeedFragment.tsx` as a React Flow custom node:
   - Keep the existing visual design, DOM structure, class names, and tokens EXACTLY
     (see CLAUDE.md node architecture — floating label OUTSIDE the card body, etc.).
   - The node is now a React Flow custom node component registered in `nodeTypes`.
   - Node positions come from `node.position` (author-placed, preserved from existing
     data). React Flow renders the position; do NOT compute screen coordinates by hand.
6. Wire real nodes + edges from the existing data source into `nodes` / `edges` state.
   Connections render as native React Flow edges with their labels.
7. Replace the old `<Canvas>` mount point with the new React Flow canvas.

### Part 3 — Delete the engine
8. Once real content renders correctly on React Flow, delete:
   `Canvas.tsx`, `CanvasBackground.tsx`, `usePanZoom.ts`, and all four `effects/*` files,
   plus the now-dead edge files if the EDGES decision was "native."
9. Remove the five R3F/Three dependencies from package.json. Run the app, confirm no
   import errors.

---

## Coordinate math — the one rule that prevents the bug returning
If ANY code needs to convert a screen/mouse position to canvas position (e.g. drag-drop,
click-to-place), use React Flow's `screenToFlowPosition()` from `useReactFlow()`.
NEVER write manual `mouseX * zoom + panX` math. Manual coordinate math re-introduces the
exact second-coordinate-system bug we are deleting.

---

## Definition of Done
- React Flow is the canvas. R3F/Three is fully removed from code and package.json.
- Real fragments render as React Flow custom nodes, visually matching the prior design
  (tokens, floating labels, structure per CLAUDE.md).
- Connections render as React Flow edges with labels.
- **Zoom min→max produces zero card drift, overlap, or ghosting.** (Primary acceptance test.)
- App runs with no console errors and no dead imports.

## Out of scope — DO NOT TOUCH
- The AI generation pipeline, save/load/session functionality, sidebar, status bar,
  view panel, scratchpad, milestones — none of it. If it does not render the canvas or
  a node/edge, leave it alone.
- Idle drift, hover-spotlight, living-edge animation, drag-spring — ALL later stages.
  Do not add any animation or "aliveness" in this session. Flat and static is correct
  for now.
- Recreating any WebGL effect (fog, particles, color bleed, echo). They are deleted on
  purpose.
- Any refactor of TypeScript logic, state management, prop interfaces, or data flow
  beyond what is strictly required to move nodes/edges into React Flow.

## On completion
Report exactly:
- Which files were created, rewritten, and deleted.
- Which dependencies were removed.
- Confirmation that the zoom test passes.
- Anything you had to touch that was not anticipated above, and why.
- Then STOP. Do not proceed to animation or any later stage.

---
*Stage 0 of the Webs flat-and-alive migration. Later stages: node aliveness
(idle drift, hover spotlight, living edges, drag spring) — see the research report,
which applies once this React Flow foundation is in place.*
