# PROGRESS.md
# Webs — Session history and feature tracker

Updated at the end of every session. Tracks what is built, what is in progress, and decisions made per session.

---

## Session log

| Session | Date | Focus | Outcome |
|---------|------|-------|---------|
| 01 | Apr 2026 | Foundation | React Flow + Ant Design removed; token system bootstrapped |
| 02 | Apr 2026 | Pan-zoom canvas | usePanZoom.ts + Canvas.tsx + dot grid background |
| 03 | Apr 2026 | LOD system | getLOD() with macro/compact/full thresholds |
| 04 | Apr 2026 | Data model + connectors | Cluster data model overhauled; ConnectorLayer + connector drag creation |
| 05 | Apr 2026 | Fragment system | All 6 layouts + slot components + contextual menu + header chip |
| 06 | Apr 2026 | Session persistence + tabs | localStorage save/load; multi-tab; TabStrip; copy/paste |
| 07 | Apr 2026 | Initial state | Blank canvas → SearchInput → LoadingCanvas → Canvas flow; mock data |
| 08 | Apr 2026 | Status bar + pivot | StatusBar; generatePivot() with full mock; addPivotCluster() |
| 09 | Apr 2026 | Sidebar + Library | Sidebar (collapsible); LibraryView + LibraryCard; openProject() |
| 10 | Apr 2026 | Bezier connectors | getBezierPath(); horizontal-bias control points; spawn point label polish |
| 11 | Apr 2026 | Connector visuals | Tether lerp (opacity/weight/dash); strong glow (4 stacked paths + pulse); editable labels; AI MAX_TOKENS 8000 |
| 12 | Apr 2026 | Canvas polish | SVG visibility fix (width:0→1); cluster container + hover dimming + collapse; NotePanel; Scratchpad; Spark nodes stub |
| 13 | May 2026 | nd/ design system | nd/ atoms (Button, Spinner, Icon) wired into Sidebar, LoadingCanvas, Fragment; hook warning diagnosed (non-blocking) |
| 14 | May 2026 | Doc restructure | PROGRESS.md + CHANGELOG.md created; CLAUDE.md stripped of dead Migration Strategy + WIP tracker; README rewritten; 5 dead files deleted; v0.3.0 tagged |
| 15 | May 2026 | Remove tethers + fix connectors | Tether system fully removed (types, generation, mock data, localStorage filter); standard connectors confirmed rendering; scope opacity intra 0.4 / inter 0.2 |
| 14 | May 2026 | Connector overhaul | Visual validation of tether / standard / strong at real zoom levels |
| 16 | May 2026 | Prompt sidebar + slot history | PromptSidebar (⌘P / toggle button); 6 draggable prompt cards; runPromptOnSlot API; slot history (back/forward nav); empty slot placeholders; command menu on double-tap; FragmentActionsContext; mock fallback for all prompts |
| 17 | May 2026 | Nav rail + startup flow + timeline | NavRail (48px icon strip); NavPanel (280px collapsible); ExplorationPanel, PromptsPanel, LibraryPanel; ExplorationModal (⌘N / + button); TimelineBanner (chronological fragments with historicalEra); Canvas always mounted; SearchInput removed; PromptSidebar removed |

---

## Feature tracker

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
| Connector system (SVG layer) | DONE | ConnectorLayer.tsx + Connector.tsx; tether/weak/standard/strong types; overflow:visible SVG at canvas origin; SVG width:1 height:1 (width:0 collapsed coordinate system — was root cause of connectors never rendering until Session 12) | Session 04 |
| Connector bezier curves | DONE | bezier.ts: getBezierPath() + getBezierMidpoint(); all 4 connector types use cubic bezier paths (no straight lines); horizontal-bias control points | Session 10 |
| Connector tether proximity | DONE | Continuous lerp: opacity 0.55→0.12, strokeWidth 1.5→1, dasharray 0→4 8 over 200–600px distance; opacity raised from 0.25 (was invisible on light canvas) | Session 11 |
| Connector strong visual | DONE | 4 stacked CSS-classed paths: outer-glow (20px blur 8px), mid-glow (10px blur 4px), inner-glow (4px blur 1px), core (2.5px); pulse animation 2.5s; pinch dot at bezier midpoint; glow opacity raised 3× | Session 11 |
| Connector labels (editable) | DONE | ConnectorLabel.tsx — pill on standard/strong; double-click to edit; Enter/Escape confirm/cancel; positioned at bezier midpoint; independently draggable via window mousemove/mouseup + zoom-corrected delta + labelOffsetX/Y on Connector type | Session 11 |
| Connector context menu | DONE | Right-click on line or label: Make strong / Make standard / Delete per type; dismissed on window click | Session 04 |
| Connector creation (drag) | DONE | Drag fragment onto another fragment → standard connector created; position reverted | Session 04 |
| Connector SVG visibility bug | DONE | SVG width:0 height:0 collapsed coordinate system to zero (scale factor 0 → all paths map to a single point); fix: width:1 height:1 restores 1:1 user-unit-to-px mapping; connectors had never rendered since Session 04 | Session 12 |
| Connector z-index stacking | DONE | SVG lowered from z-index:2 to z-index:0; lines now render below fragment cards (z-index:1) and cluster labels (z-index:1); connector label divs are separate siblings at z-index:2 and still float above cards | Session 12 |
| Spawn point label padding | DONE | .cluster-spawn__label: padding 10px 20px, font-size 16px, letter-spacing -0.035em | Session 10 |
| Fragment drag (independent) | DONE | Window-level mousemove/mouseup; zoom-corrected delta; stopPropagation prevents canvas pan | Session 04 |
| Session persistence (localStorage) | DONE | useCanvas.ts: debounced 1000ms auto-save to webs-canvas-${projectId}; viewport synced via updateViewport; restored on mount from initialState prop | Session 06 |
| Multi-tab canvas | DONE | useTabs.ts manages AppState (tabs[], activeTabId) + persists to webs-app-state; Canvas keyed by activeTabId for clean remount on switch; max 20 tabs | Session 06 |
| Tab strip UI | DONE | TabStrip.tsx: 40px Figma-style strip; active tab has 2px bottom indicator; double-click to rename inline; × close with confirm; + add button | Session 06 |
| Fragment copy/paste (keyboard) | DONE | Cmd/Ctrl+C copies hovered fragment; Cmd/Ctrl+V pastes clone into active tab at (0,0) with clusterId='imported'; cross-tab via App.tsx copiedFragment state | Session 06 |
| Projects index (library foundation) | DONE | webs-projects-index in localStorage maintained via updateProjectMeta(); no UI yet — data model ready for future library view | Session 06 |
| Canvas layout (flex) | DONE | canvas.css: position:fixed→position:relative+flex:1+min-height:0 to sit below tab strip in App.tsx flex column | Session 06 |
| AI generation pipeline | DONE | generateCanvas() in generate.ts; system prompt + user message in prompt.ts; schema fix (Cluster.label, flat fragments); buildSlots() converts flat API fields to FragmentSlot[]; safe JSON parse with mock fallback; positionClusters() + fragmentPositions() for layout. MAX_TOKENS raised to 8000 (4000 caused truncated JSON → mock fallback for large topics) | Session 11 |
| Pivot action | DONE | generatePivot() fully implemented; new signature takes Fragment + sourceClusterId; buildPivotPrompt() + getMockPivotResult() added; addPivotCluster() atomic action in useCanvas; loading overlay + error state in Fragment.tsx; smooth 400ms viewport pan after spawn; chain pivoting verified | Session 08 |
| Sidebar | DONE | Sidebar.tsx: 240px, 3 sections (identity / stats / actions); collapsible with 200ms CSS transition; toggle button at edge stays visible when collapsed; stats from App.tsx tabState (fragment/cluster/connector count + created/modified); "open library" + "new exploration" + disabled export stub | Session 09 |
| Library view | DONE | LibraryView.tsx + LibraryCard.tsx: full-screen overlay over canvas area; grid of ProjectMeta cards with thumbnail placeholder, title, relative date, fragment+cluster stats; empty state; ⌘L toggle + Escape to close; "open library" in sidebar; clicking card calls openProject() and closes view | Session 09 |
| Library — open project from card | DONE | openProject() added to useTabs.ts: switches to existing tab if already open, otherwise adds new tab with the project's id; App.tsx wires card click to openProject + setLibraryOpen(false) | Session 09 |
| ProjectMeta stats fields | DONE | fragmentCount/clusterCount added as optional fields to ProjectMeta in types.ts; App.tsx handleQuery writes them via updateProjectMeta after generation | Session 09 |
| Status bar | DONE | StatusBar.tsx: 32px strip, absolute bottom of canvas-wrapper; zoom level (live), fragment count, cluster count, online/offline dot; derives state from Canvas.tsx directly | Session 08 |
| Initial state (blank canvas + input) | DONE | App.tsx: conditional render — empty tab shows SearchInput on dot-grid; isGenerating shows LoadingCanvas (pink/cobalt strip + query text); non-empty shows Canvas; error state shows LoadingCanvas with retry; new tabs default to EMPTY_CANVAS_STATE | Session 07 |
| Token system (CSS variables) | DONE | src/styles/webs-tokens.css created with full token set; src/tokens/tokens.ts mirrors as JS constants | Session 01 |
| Mock data (all 8 types + 6 layouts) | DONE | Moved to src/api/mock.ts; getMockCanvasState(query) overrides seed title with query; correct schema (Cluster.label, flat fragments with clusterId); useTabs seeded with EMPTY_CANVAS_STATE (not mock) so first load shows SearchInput | Session 07 |
| Cluster group container visual | DONE | Cluster.tsx computes bounding box from fragment positions + per-layout size approximations (FRAG_SIZE record); renders .cluster-container div (rgba(0,0,0,0.025) bg, 1px border) absolutely positioned behind fragments; pointer-events:none | Session 12 |
| Cluster hover emphasis | DONE | Canvas.tsx tracks hoveredClusterId state; non-hovered clusters get dimmed=true prop; .cluster-container--dimmed (opacity 0.4) + fragment .fragment--dimmed (opacity 0.25, 150ms transition) applied when another cluster is hovered | Session 12 |
| Cluster collapse (pill) | DONE | collapseCluster action in useCanvas; Cluster.tsx renders .cluster-pill (label + count + expand chevron) when cluster.collapsed=true; cluster-container shows − collapse button on hover; collapsed cluster's fragments filtered out of Canvas render | Session 12 |
| Note panel | DONE | NotePanel.tsx: position:fixed right panel 320px wide; debounced onChange 500ms; Escape closes; onMouseDown stops propagation; updateFragmentNote/updateClusterNote actions in useCanvas; note button in Fragment menubar toggles noteTarget in Canvas.tsx | Session 12 |
| Scratchpad | DONE | Sidebar Section 3: .scratchpad__textarea in panels.css; App.tsx manages scratchpad state initialized from localStorage; handleScratchpadChange saves directly via saveCanvasState; tab switch effect resets scratchpad state | Session 12 |
| Spark nodes (stub) | DONE | "spark" FragmentType added to types.ts; sparkMediaUrl/sparkMediaType/sparkStatus fields on Fragment; SparkSlot.tsx renders image thumbnail + action buttons; addSparkFragment atomic action in useCanvas; Canvas.tsx handles drag-and-drop (dragover/drop), converts screen coords to canvas-space; generateSparkExplode() in generate.ts returns mock 3-fragment cluster (TODO: real OCR/image API) | Session 12 |
| nd/ design system integration | DONE | src/nd/ atoms/molecules/organisms ported from Neurodive; webs-tokens.css extended with nd/ token aliases (--surface, --fg, --hairline, --s-1, --font-meta, --ls-small, --shadow-lift, --signal-danger, --ease, --dur-fast, --stroke, --radius-soft, --shadow-toolbar); Button used in Sidebar + LoadingCanvas; Spinner used in LoadingCanvas + Fragment pivot overlay; Icon (lucide-react) used in Fragment menubar (Trash2, Shuffle, Star); FloatingToolbar available but not used directly (token deps met, kept webs menubar CSS) | Session 13 |
| Connector SVG visibility (re-confirmed) | DONE | Plan file confirmed fix: width:0→1, zIndex:2→0 applied to ConnectorLayer.tsx; 3 bezier tether paths confirmed rendering via DOM inspection; previously marked DONE in Session 12 tracker but fix not yet applied to working tree | Session 13 |
| Dev-mode hook warnings | NOTES | 8x "Invalid hook call" console errors are a pre-existing Vite 8 + React 19 + @vitejs/plugin-react 6 dev-mode artifact; confirmed present on HEAD with zero nd/ changes; production build is clean (zero errors); not caused by nd/ integration; no fix found — accepted as non-blocking dev noise | Session 13 |
| Tether system removal | DONE | ConnectorType narrowed to standard\|strong; tether generation removed from generate.ts, addFragment, addPivotCluster, mock.ts; legacy tethers filtered from localStorage on load | Session 15 |
| Standard connector scope opacity | DONE | intra-cluster: 0.40 opacity, inter-cluster: 0.20 opacity; scope computed in ConnectorLayer from fragment.clusterId | Session 15 |
| Prompt sidebar | DONE | PromptSidebar.tsx: 280px right panel; toggle button in canvas top-right; ⌘P shortcut; shows when canvas non-empty | Session 16 |
| Prompt cards (draggable) | DONE | PromptCard.tsx: 6 cards (explain simply / visual learning / fact check / find similarities / steelman / challenge); HTML5 drag API with promptid dataTransfer key | Session 16 |
| Prompt drop on fragment | DONE | Fragment.tsx adds dragOver/drop handlers; fragment--drag-over outline class; Canvas.tsx handles runPromptOnSlot; per-fragment promptingFragmentIds set; loading overlay while running | Session 16 |
| runPromptOnSlot API | DONE | generate.ts: builds API call via PROMPT_SYSTEM_PROMPT + buildPromptOnSlotMessage(); getMockPromptResult() per prompt id; falls back to mock when no API key | Session 16 |
| Slot history system | DONE | SlotVersion interface; history/historyIndex on FragmentSlot; updateFragmentSlot action pushes old content to history (cap 10); navigateSlotHistory action changes historyIndex and restores version content | Session 16 |
| Slot history nav UI | DONE | SlotHistory.tsx: back/forward chevrons + count label; shown on slot hover via CSS; reads/writes via FragmentActionsContext; added to BodySlot + ListSlot | Session 16 |
| Empty slot placeholders | DONE | EmptySlot.tsx: dashed placeholder with uppercase type label; double-click opens command menu; emptySlots field on Fragment; added in parseApiResponse (image slot for non-quote) and getMockCanvasState | Session 16 |
| Command menu | DONE | CommandMenu.tsx: fixed overlay at cursor position; lists prompts filtered by allowedOutputSlots; click runs prompt on specific slot; Escape/click-outside to close; wired via FragmentActionsContext → Canvas.tsx | Session 16 |
| FragmentActionsContext | DONE | React context providing navigateSlotHistory + openCommandMenu callbacks scoped to a fragment; Fragment.tsx sets up provider; slot components consume without prop drilling | Session 16 |
| Nav rail | DONE | NavRail.tsx: 48px far-left strip; 3 icon buttons (Compass/explore, Sparkle/prompts, Clock/library); toggle logic (click active collapses panel); nav-rail.css | Session 17 |
| Nav panel | DONE | NavPanel.tsx: 280px collapsible panel (width:0 when null); CSS width transition 0.2s; EXPLORATION/PROMPTS/LIBRARY header; body scrollable; nav-panel.css | Session 17 |
| Exploration panel | DONE | ExplorationPanel.tsx: wordmark, exploration name, stats, scratchpad, new exploration + open library buttons; replaces old Sidebar.tsx in left rail | Session 17 |
| Prompts panel | DONE | PromptsPanel.tsx: "Analysis" category label + 6 PromptCard components; replaces PromptSidebar.tsx (deleted) | Session 17 |
| Library panel | DONE | LibraryPanel.tsx: condensed list of past explorations; "view all →" link opens full LibraryView; item = name + fragment count + relative time | Session 17 |
| Exploration modal | DONE | ExplorationModal.tsx: fixed overlay; "what do you want to explore?" label; large underline-only input; "explore →" submit; Escape/overlay-click to close; focus trap; triggered by ⌘N and + toolbar button | Session 17 |
| Timeline banner | DONE | TimelineBanner.tsx: absolute-positioned strip at top of canvas area; shows fragments with historicalEra sorted chronologically (parseEraYear handles plain years, ranges, BCE, decades); colored dot + era + title per event; hidden when no events; timeline.css | Session 17 |
| Timeline viewport navigation | DONE | Clicking timeline event calls handleNavigateToFragment in Canvas.tsx; pans to fragment center (w/2 - fx*zoom, h/2 - fy*zoom); zooms to 0.8 if below 0.4; 400ms CSS transition; 600ms pulse highlight via fragment--timeline-highlight CSS animation | Session 17 |
| historicalEra on Fragment | DONE | historicalEra?: string added to Fragment interface and GenerateApiResponse fragment shape; prompt.ts instructs AI to include for all fragment types; parseApiResponse maps it; mock.ts seeded with 6 era values | Session 17 |
| Canvas always mounted | DONE | App.tsx no longer conditionally renders Canvas vs SearchInput; Canvas always mounted with EMPTY_CANVAS_STATE on blank tab; generationCount key bumped on generation to force remount and pick up new state | Session 17 |
| SearchInput removal | DONE | SearchInput.tsx deleted; replaced by ExplorationModal flow | Session 17 |
| Toolbar + button | DONE | Toolbar.tsx: + button as first item separated from tool buttons by .toolbar__divider (1px vertical line); onNewExploration? prop; opens ExplorationModal via Canvas→App callback | Session 17 |

Status values: `NOT STARTED` / `IN PROGRESS` / `DONE` / `NEEDS REVIEW` / `BLOCKED`

---

## Known technical debt

| Item | Notes |
|------|-------|
| Spark nodes (OCR/image) | generateSparkExplode() returns mock data; real image analysis API not wired |
| Cluster positioning (orbit) | positionClusters() implemented but mock data still hardcoded in useCanvas.ts |
| Dev-mode hook warnings | HMR-only — hook count changes during an editing session show "Invalid hook call" in dev console; count is stable across the editing session (not growing during interactions); production build clean; non-blocking |
| Image slots | Images not fetched; placeholder grey bg only |
| Export | Button present in sidebar but disabled; no implementation |
| Fact check | Icon in fragment menubar but not wired to API |
