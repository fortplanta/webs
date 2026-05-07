# CHANGELOG.md
# Webs

Versioning follows **v0.MINOR.PATCH** until the app ships publicly.
- MINOR = a meaningful new capability (new system, new feature set)
- PATCH = fixes, visual polish, refactors within an existing system

Git tags track milestones. Use `git tag vX.Y.Z` at the end of a session when a milestone is reached.

---

## v0.4.0 — Connector overhaul (Session 14, May 2026)

**Goal:** Make connectors clearly visible and visually distinct by type.

- [ ] Tether: thin, dashed, low opacity — visible at zoom 0.7
- [ ] Standard: solid, mid-weight — clearly distinguishable from tether
- [ ] Strong: heavier, glowing — dominant visual structure
- [ ] Labels sit on bezier midpoint without overlapping the line
- [ ] All three types correct at zoom 0.3 and 1.2

---

## v0.3.0 — nd/ design system integration (Session 13, May 2026)

- Ported `src/nd/` atoms from Neurodive: Button, Spinner, Icon (Lucide)
- `webs-tokens.css` extended with nd/ token aliases (`--surface`, `--fg`, `--hairline`, `--radius-soft`, `--ease`, `--dur-fast`, `--stroke`, `--shadow-toolbar`, etc.)
- Button used in Sidebar (open library, new exploration, export stub) and LoadingCanvas (retry)
- Spinner used in LoadingCanvas (loading state) and Fragment (pivot overlay)
- Icon (Lucide) used in Fragment menubar (Trash2, Shuffle, Star)
- FloatingToolbar available but not wired into Fragment (webs menubar CSS retained)
- Confirmed: SVG width:0→1 fix present in ConnectorLayer.tsx (zIndex 2→0)
- Diagnosed dev-mode hook warnings as Vite 8 + React 19 artifact (non-blocking)

---

## v0.2.0 — Connector system (Sessions 10–12, Apr 2026)

**Sessions 10–11:** Bezier connectors, tether proximity lerp, strong glow, editable labels

- `bezier.ts`: `getBezierPath()` + `getBezierMidpoint()` with horizontal-bias control points
- Tether: continuous lerp opacity 0.55→0.12, strokeWidth 1.5→1, dasharray 0→`4 8` over 200–600px
- Standard: solid mid-weight bezier
- Strong: 4 stacked paths (outer-glow 20px, mid-glow 10px, inner-glow 4px, core 2.5px) with pulse animation 2.5s
- `ConnectorLabel.tsx`: pill label, double-click to edit, independently draggable, zoom-corrected delta

**Session 12:** Canvas polish and SVG visibility fix

- SVG visibility root cause: `width:0 height:0` collapsed SVG coordinate system; fix: `width:1 height:1`
- zIndex: SVG 2→0 (lines beneath fragments); connector label divs at z-index:2 (above cards)
- Cluster group container: bounding box computed from fragment positions, translucent background, 1px border
- Cluster hover: non-hovered clusters dimmed (opacity 0.4 container, 0.25 fragments)
- Cluster collapse: pill view with label + count + expand chevron
- NotePanel: position:fixed right panel, debounced save, per-fragment and per-cluster
- Scratchpad: sidebar section 3, localStorage persistence per-tab
- Spark nodes: stub implementation — drag image onto canvas, mock explode into cluster

---

## v0.1.0 — Canvas foundation (Sessions 01–09, Apr 2026)

**Sessions 01–03:** Foundation

- React Flow (`@xyflow/react`) removed; Ant Design removed
- Token system: `src/styles/webs-tokens.css` + `src/tokens/tokens.ts`
- Custom pan-zoom: `usePanZoom.ts` (zoom-toward-cursor, pan), `Canvas.tsx`, `canvas.css`
- Dot grid background: SVG pattern in screen space
- LOD system: `getLOD()` with macro / compact / full thresholds

**Sessions 04–05:** Data model + fragments

- Cluster data model overhauled: spawn-point markers, fragments as independent entities with own x,y
- All 6 fragment layouts: vertical-flow, image-hero, quote-centered, card-split, timeline, list-prominent
- All 5 slot components: BodySlot, TagsSlot, ListSlot, DisclaimerSlot, ImageSlot
- Fragment contextual menu: delete, pivot, star, fact-check
- Fragment header chip: `fit-content` width, type color

**Sessions 06–07:** Session persistence + tabs + initial state

- localStorage save/load with 1000ms debounce
- Multi-tab canvas: `useTabs.ts`, `TabStrip.tsx`, max 20 tabs
- Fragment copy/paste: Cmd/Ctrl+C/V, cross-tab
- Blank canvas → SearchInput → LoadingCanvas → Canvas render flow
- Mock data: all 8 fragment types, all 6 layouts

**Sessions 08–09:** Status bar, pivot, sidebar, library

- `StatusBar.tsx`: zoom level, fragment/cluster count, online/offline
- `generatePivot()`: new cluster from fragment context; smooth viewport pan
- `Sidebar.tsx`: 240px, collapsible, 3 sections, nd/ Button stubs
- `LibraryView.tsx` + `LibraryCard.tsx`: full-screen overlay, project grid
