# PROGRESS.md
# Webs — Session history and feature tracker

Updated at the end of every session. Tracks what is built, what is in progress, and decisions made per session.

---

## Session log

| Session | Date | Focus | Outcome |
|---------|------|-------|---------|
| 27 | May 2026 | Depth score UI + progress dashboard | ExplorationPanel stats section replaced: large depthScore number, 3px progress bar (400ms transition, lime flash at 300), CONNECTIONS n/max + CLUSTERS LIT n/total + FRAGMENTS rows; milestones section (First Cluster 100pts / Half Web 200pts / Full Chemistry 300pts) with 6px dot indicators + Web Animations API scale-pulse on first crossing; milestonesReached[] added to ExplorationConnectionState + persisted to localStorage; webs-connections-changed CustomEvent dispatched from saveExplorationState; App.tsx listens reactively and recomputes depthScore/clustersLit/milestonesReached; clustersLit = clusters where all fragments have connectionCount > 0; scratchpad moved below milestones |
| 23 | May 2026 | Data layer: connection state + depth score | UserConnection/ExplorationConnectionState types; calculateConnectionStrength; depthScoreFromConnections; addUserConnection; removeUserConnection; initExplorationState wired in App.tsx; fragment IDs changed to clusterSlug_index format; 10 unit tests via Vitest; no UI changes |
| 24 | May 2026 | Connection drawing UX | .fragment-connect-handle (right-edge black dot, opacity 0→1 on hover); connectHandleRef + connectPreview + connectDropTargetId state in Canvas.tsx; window mousemove/mouseup handlers for drag; fragment--drop-target outline on hover; userConnections rendered as SVG lines in ConnectorLayer; connectPreview dashed black line; userConnections loaded from localStorage on mount + tab switch |
| 26 | May 2026 | AI connection validation + label | validateConnectionLabel() in generate.ts; updateUserConnectionAI() in connections.ts; addUserConnection returns connection ID + strength; marching-dashes animation on SVG line while AI pending; label fades out (150ms) → updates → fades in (150ms); delta score badge if AI returns higher strength; initial +N score badge on draw; rationale stored on connection; connection.rationale field added to UserConnection type |
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
| 20 | May 2026 | Multi-select + group drag | Box select selects fragments + cluster spawns (height 480, 16px spawn bbox); group drag moves all selected elements atomically; Escape/Cmd+A/Delete with confirmation; moveGroupElements + removeCluster added to useCanvas |
| 16 | May 2026 | Prompt sidebar + slot history | PromptSidebar (⌘P / toggle button); 6 draggable prompt cards; runPromptOnSlot API; slot history (back/forward nav); empty slot placeholders; command menu on double-tap; FragmentActionsContext; mock fallback for all prompts |
| 17 | May 2026 | Nav rail + startup flow + timeline | NavRail (48px icon strip); NavPanel (280px collapsible); ExplorationPanel, PromptsPanel, LibraryPanel; ExplorationModal (⌘N / + button); TimelineBanner (chronological fragments with historicalEra); Canvas always mounted; SearchInput removed; PromptSidebar removed |
| 18 | May 2026 | Connector visual overhaul + fragment redesign | Standard opacity intra 0.55 / inter 0.45; strokeWidth 2 + strokeLinecap round; strong glow boosted; hit-targets; two-section card (FragmentCard + FragmentAccordions); ··· menu; source attribution; connector dot drag; accordion slots; canvas command menu |
| 19 | May 2026 | Visual overhaul + Gantt timeline | SeedFragment hero card (lime green, 32px query, context paragraph); cluster spawn → circle marker + hover-only label; fragment max-height 480px; accordion modal; skeleton loading + cycling helper text + timer; StartingCard (Claude-style input with voice/file stubs); new tab auto-opens StartingCard; Gantt timeline view (pannable/zoomable time axis, type rows, colored pills/bars); timeline banner click → Gantt; Gantt icon in nav rail; tab name truncated to 32 chars |

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
| Multi-select box selection | DONE | Drag on empty canvas in select tool draws blue rect; intersects fragments (width×480) and cluster spawns (16×16 bbox); all 4 drag directions correct | Session 20 |
| Group drag | DONE | Mousedown on selected element when >1 selected starts group drag; moveGroupElements batches all position updates in one setState; visual feedback via [data-group-dragging] .fragment--selected | Session 20 |
| Keyboard: Escape / Cmd+A / Delete | DONE | Escape deselects + cancels box select; Cmd+A selects all fragments + clusters; Delete with window.confirm when >3 elements; clusters removed via removeCluster | Session 20 |
| Cluster labels (compact/macro) | DONE | ClusterLabel.tsx unchanged; cluster spawn points use .cluster-spawn__label styling | Session 04 |
| Seed fragment | DONE | Seed spawn point uses --color-seed-bg lime green label | Session 04 |
| Connector system (SVG layer) | DONE | ConnectorLayer.tsx + Connector.tsx; tether/weak/standard/strong types; overflow:visible SVG at canvas origin; SVG width:1 height:1 (width:0 collapsed coordinate system — was root cause of connectors never rendering until Session 12) | Session 04 |
| Connector bezier curves | DONE | bezier.ts: getBezierPath() + getBezierMidpoint(); all 4 connector types use cubic bezier paths (no straight lines); horizontal-bias control points | Session 10 |
| Connector tether proximity | DONE | Continuous lerp: opacity 0.55→0.12, strokeWidth 1.5→1, dasharray 0→4 8 over 200–600px distance; opacity raised from 0.25 (was invisible on light canvas) | Session 11 |
| Connector strong visual | DONE | 4 stacked CSS-classed paths: outer-glow (28px blur 10px op:0.20), mid-glow (14px blur 5px op:0.35), inner-glow (6px blur 1.5px op:0.60), core (3px op:1); pulse 2.5s; all strokeLinecap round; invisible 16px hit-target | Session 18 |
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
| Standard connector scope opacity | DONE | inter: 0.45, intra: 0.55; strokeWidth 2; strokeLinecap round; 12px transparent hit-area path | Session 18 |
| Strong connector glow | DONE | Glow layer opacities raised: outer 0.20, mid 0.35, inner 0.60; core strokeWidth 3; pulse animation unchanged | Session 18 |
| Connector label pill | DONE | Solid bg #f5f5f5, 1px border rgba(0,0,0,0.10), box-shadow 0 1px 3px; font-size 12px | Session 18 |
| Fragment card redesign | DONE | Two-section layout: FragmentCard (chip+title+··· header, type label+bold title+body+tags+source attribution) + FragmentAccordions (accordion stack + drop target) | Session 18 |
| Fragment ··· menu | DONE | FragmentMenu.tsx: Duplicate, Move to cluster (submenu), Pin (toggle), Delete (inline confirm); closes on Escape/outside click | Session 18 |
| Source attribution | DONE | SourceAttribution.tsx: favicon + label pill, +N other count, hover tooltip listing all sources; fallback letter avatar on image error | Session 18 |
| Accordion slots | DONE | AccordionSlot.tsx + FragmentAccordions.tsx: max 3 visible, history accordion for overflow, drop target for prompt cards; local open/close state | Session 18 |
| Connector dot | DONE | ConnectorDot.tsx: right-edge dot, hover opacity, drag initiates live preview connector (blue dashed) in ConnectorLayer; mouseup on fragment creates connector, mouseup on empty canvas opens CanvasCommandMenu | Session 18 |
| Canvas command menu | DONE | CanvasCommandMenu.tsx: positioned in canvas-space at drop coords; Create fragment here (type picker submenu), Create text note, Pivot, Create cluster here | Session 18 |
| Prompt cards (sidebar) | DONE | PROMPTS in prompts.ts (6 prompts with emoji icons + PromptDefinition with allowedOutputSlots); draggable cards; drag sets text/prompt-id on dataTransfer | Session 18 |
| ConnectorLayer preview | DONE | Optional preview prop: renders dashed blue path from source fragment to current cursor position during connector dot drag | Session 18 |
| Prompt drop on fragment | DONE | Fragment.tsx adds dragOver/drop handlers; fragment-wrapper--drag-over class; Canvas.tsx handles runPromptOnSlot; per-fragment promptingFragmentIds set; loading overlay while running | Session 16 |
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
| Timeline banner | DONE | TimelineBanner.tsx: absolute-positioned strip at top of canvas area; shows fragments with historicalEra sorted chronologically; colored dot + era + title per event; hidden when no events; timeline.css | Session 17 |
| Timeline viewport navigation | DONE | Clicking timeline event pans to fragment center; zooms to 0.8 if below 0.4; 400ms CSS transition; 600ms pulse highlight via fragment-wrapper--timeline-highlight | Session 17 |
| historicalEra on Fragment | DONE | historicalEra?: string added to Fragment interface; prompt.ts instructs AI to include for all fragment types; parseApiResponse maps it; mock.ts seeded with 6 era values | Session 17 |
| Canvas always mounted | DONE | App.tsx no longer conditionally renders Canvas vs SearchInput; Canvas always mounted with EMPTY_CANVAS_STATE on blank tab | Session 17 |
| SearchInput removal | DONE | SearchInput.tsx deleted; replaced by ExplorationModal flow | Session 17 |
| Toolbar + button | DONE | Toolbar.tsx: + button separated by divider; onNewExploration? prop; opens ExplorationModal via Canvas→App callback | Session 17 |
| Seed fragment hero card | DONE | SeedFragment.tsx: lime green 480px card, "exploring" eyebrow, 32px query, context paragraph; replaces dark spawn label; rendered in Canvas.tsx for isSeed clusters; seed regular fragment card hidden from canvas | Session 19 |
| Cluster spawn redesign | DONE | Cluster.tsx: 10px circle marker + hover-only uppercase label (opacity 0 → 1 on hover); at compact/macro LOD label shown at 0.5 opacity; seed cluster renders SeedFragment instead | Session 19 |
| Fragment max-height | DONE | fragment-card.css: max-height 480px + overflow hidden on .fragment-wrapper | Session 19 |
| Accordion modal | DONE | AccordionModal.tsx: fixed overlay, 560px card, header (icon + label + close), scrollable content; AccordionSlot headers open modal instead of inline expand; AccordionModal.tsx + accordion-modal.css | Session 19 |
| Skeleton loading | DONE | SkeletonFragment.tsx: shimmer header + 5 body lines at 5 approximate cluster positions; skeleton.css with @keyframes skeleton-shimmer | Session 19 |
| Loading helper text + timer | DONE | LoadingCanvas.tsx: cycling LOADING_MESSAGES every 2.5s, elapsed seconds counter, spinner strip; replaces old loading strip | Session 19 |
| StartingCard | DONE | StartingCard.tsx: Claude-style overlay card; "what do you want to explore?" label; 120px min-height textarea; voice + file stub icon buttons with "coming soon" tooltip; disabled submit until content; Enter to submit, Escape to close; replaces ExplorationModal | Session 19 |
| New tab auto-opens StartingCard | DONE | App.tsx handleAddTab: addTab() then setStartingCardOpen(true); wired to TabStrip onAdd | Session 19 |
| Gantt timeline view | DONE | GanttView.tsx: full-screen overlay; separate pan/zoom state (scale + offsetX); wheel zoom toward cursor; drag to pan; auto-scaled time axis with tick generation; type rows (ERA→EVENT→PERSON→CONCEPT→THESIS→SOURCE→DOMAIN→QUOTE); colored pills (point) and bars (range); era parsing handles BCE/range/decade/century/approximation; hover tooltip; click item → back to canvas + navigate; gantt.css | Session 19 |
| Gantt view toggle | DONE | ganttOpen state in App.tsx; passed to Canvas.tsx as prop; TimelineBanner click → onGanttOpen; GanttView back button → onGanttClose; NavRail 4th icon (timeline bars) toggles gantt; Escape closes gantt | Session 19 |
| Tab name on generation | DONE | App.tsx handleQuery: name = query.slice(0, 32) + ellipsis if longer; renameTab called after generation | Session 19 |

| Depth score dashboard | DONE | ExplorationPanel stats replaced with depthScore number + progress bar + CONNECTIONS/CLUSTERS LIT/FRAGMENTS rows; live via webs-connections-changed event | Session 27 |
| Progress bar (depth score) | DONE | 3px track + fill, 400ms ease transition, lime-green flash via Web Animations API when score ≥ 300 | Session 27 |
| Milestones section | DONE | Three rows (100/200/300 pts), 6px dot hollow→filled, scale-pulse animation fires once on first crossing; milestonesReached[] persisted in ExplorationConnectionState | Session 27 |
| webs-connections-changed event | DONE | Dispatched from saveExplorationState in connections.ts; App.tsx listens per activeTabId and reloads explorationState | Session 27 |
| milestonesReached on ExplorationConnectionState | DONE | Added to type + buildInitialState; updateMilestones() called after every depthScore recalculation in addUserConnection/updateUserConnectionAI/removeUserConnection | Session 27 |
| Connection draw handle | DONE | .fragment-connect-handle on each fragment-wrapper (except seed/text-note); opacity 0→1 on hover; cursor crosshair; 10px black circle right edge | Session 24 |
| Connect drag preview line | DONE | connectHandleRef + connectPreview state; dashed black line x1/y1=fragment right edge → cursor; rendered in ConnectorLayer SVG | Session 24 |
| Drop target highlight | DONE | connectDropTargetId state; fragment--drop-target CSS class (outline 1.5px solid #000) applied during drag; cleared on mouseup | Session 24 |
| User connections SVG rendering | DONE | userConnectionsList loaded from webs_exploration_[id]; rendered as solid rgba(0,0,0,0.35) lines in ConnectorLayer; source right edge → target left edge; label rendered if non-empty | Session 24 |
| AI connection validation | DONE | validateConnectionLabel() calls Anthropic API with fragment A/B type+title+body; returns label (2–4 word verb phrase), strength (1–3), rationale; mock fallback when no API key | Session 26 |
| Connection label (AI-generated) | DONE | After draw, background API call generates label; fades out current text (150ms), updates, fades in; stored on connection.label; rendered in ConnectorLayer foreignObject | Session 26 |
| Connection pending animation | DONE | pendingConnectionIds Set in Canvas.tsx; ConnectorLayer applies strokeDasharray="6 4" + dash-march 0.8s animation to pending lines; cleared on AI response | Session 26 |
| Connection rationale | DONE | connection.rationale field added to UserConnection interface; stored after AI response; not yet displayed | Session 26 |
| Score badge on connection draw | DONE | +N badge (lime green chip) floats up from drop position and fades; shows heuristic score on draw, delta if AI returns higher strength; @keyframes score-badge-float + .score-badge in connectors.css | Session 26 |
| Fragment IDs (deterministic format) | DONE | Format: clusterSlug_fragmentIndex (e.g. "engineering_0"); seed fragment uses "seed_0"; pivot fragments still use uuidv4 | Session 23 |
| ExplorationConnectionState model | DONE | userConnections[], depthScore, fragmentStates map; persisted to webs_exploration_[id] in localStorage | Session 23 |
| calculateConnectionStrength | DONE | Pure function, returns 1–3; same cluster→1, diff cluster same type→2, diff cluster diff type→3; AI edge cap at 2; thesis +1 capped at 3 | Session 23 |
| depthScoreFromConnections | DONE | Pure function: sum of connection.strength * 10 | Session 23 |
| addUserConnection | DONE | Loads canvas+exploration state from localStorage; computes strength; appends connection; updates fragmentStates; recalculates depthScore; persists | Session 23 |
| removeUserConnection | DONE | Removes by connectionId; recomputes fragmentStates from scratch; recalculates depthScore; persists | Session 23 |
| initExplorationState | DONE | Called in App.tsx after generateCanvas resolves; populates fragmentStates for all fragments; wired before renameTab | Session 23 |
| Unit tests (calculateConnectionStrength) | DONE | 10 tests via Vitest covering all 5 rule branches; all pass | Session 23 |

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
