# SESSION.md
# Webs — Session 01: Migration Foundation
# April 2026

## Goal
Strip out React Flow and Ant Design, establish the new folder structure, and get the token system in place — so every subsequent session builds on a clean foundation.

## Context
The repo contains a working React Flow prototype. We are rebuilding the canvas layer from scratch without React Flow or any other canvas/diagram library. This session does not build any visible features. It creates the conditions for all future sessions to work cleanly.

## In scope

```
package.json                          ← remove react flow + antd, run install
src/
  styles/
    webs-tokens.css                   ← extend with full token set from CLAUDE.md
    index.css                         ← global base styles, font loading
    canvas.css                        ← empty, ready for canvas styles
    fragments.css                     ← empty, ready for fragment styles
    ui.css                            ← empty, ready for UI styles
  api/
    types.ts                          ← all TypeScript interfaces from CLAUDE.md
    generate.ts                       ← port existing AI pipeline, stub if needed
  tokens/
    tokens.ts                         ← JS token constants mirroring CSS vars
  canvas/
    Canvas.tsx                        ← stub: empty div with pan-zoom wiring placeholder
    usePanZoom.ts                     ← stub: hook with transform state, wheel handler
    useCanvas.ts                      ← stub: canvas state (clusters, edges, viewport)
    CanvasBackground.tsx              ← stub: dot grid SVG
  fragments/                          ← create folder structure only, no implementation
    Fragment.tsx
    FragmentHeader.tsx
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
    Cluster.tsx
    ClusterLabel.tsx
  edges/
    Edge.tsx
    EdgeLabel.tsx
    EdgeMidpoint.tsx
  ui/
    Sidebar.tsx
    StatusBar.tsx
    SearchInput.tsx
    ContextMenu.tsx
  App.tsx                             ← strip React Flow and Ant Design wiring
  main.tsx                            ← keep as-is unless it imports removed packages
```

## Off limits

Do not implement any of the following this session. Create the files as stubs only:

- Fragment layouts (no visual implementation)
- Cluster positioning logic
- Edge rendering
- Sidebar visual design
- Status bar visual design
- AI generation prompt changes
- Session persistence
- Any interaction logic

Everything outside the folder structure listed above is off limits.

## Specific goals

1. `@xyflow/react` is fully uninstalled and zero imports remain in the codebase
2. `antd` is fully uninstalled and zero imports remain in the codebase
3. The app still runs (`npm run dev`) without errors after removal — even if it renders nothing
4. `webs-tokens.css` contains the complete token set from CLAUDE.md (spacing, sizes, typography, colors, prominence)
5. `tokens.ts` mirrors the CSS token values as JS constants
6. `types.ts` contains all TypeScript interfaces from CLAUDE.md (FragmentType, LayoutType, Fragment, Cluster, Edge, CanvasState, etc.)
7. All new folders and stub files exist with correct imports/exports — no broken references
8. The existing AI generation logic is extracted into `src/api/generate.ts` and still functions (or is clearly stubbed with a comment explaining what was preserved)
9. `App.tsx` mounts without React Flow or Ant Design — even if it only renders a plain `<div>`
10. `SESSION.md` added to `.gitignore`

## Design intent

None this session. This is infrastructure only. Do not make any visual decisions.

## Reference

Full token values and TypeScript interfaces are in CLAUDE.md. Use those exactly — do not invent values.

## Known constraints

- The existing AI pipeline must be preserved. Extract it cleanly, do not rewrite the prompt or the API call logic.
- Font loading must continue to work. Do not touch font imports in `index.css` or `main.tsx`.
- Netlify config (`netlify.toml` or `_redirects`) must not be touched.
- Vite config must not be touched unless a removed package requires it.

## Definition of done

- `npm run dev` starts without errors
- `npm run build` completes without errors
- Zero imports of `@xyflow/react` anywhere in the codebase (verify with grep)
- Zero imports of `antd` anywhere in the codebase (verify with grep)
- All stub files exist and export valid (even if empty) components or functions
- WIP tracker in CLAUDE.md updated to reflect Session 01 completion
