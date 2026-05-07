# SESSION.md
# Webs — Session 14: Connector Overhaul
# May 2026

## Goal
Make connectors clearly visible and visually distinct by type. Tether lines should read as delicate proximity indicators. Standard connectors should read as meaningful relationships. Strong connectors should read as primary structure.

## Context
The SVG rendering bug (width:0) was fixed in Session 13 — connectors now technically render. But they have never been visually validated. Tether opacity is currently 12% (nearly invisible). Labels may not sit correctly on the path. The visual language distinguishing tether / standard / strong has not been tested at real zoom levels with real canvas content. This session validates and fixes the visual execution. Do not touch anything else.

## In scope

src/
  edges/
    ConnectorLayer.tsx
    Connector.tsx
    ConnectorLabel.tsx
    bezier.ts
  styles/
    connectors.css

## Off limits

Everything not listed above. Specifically:
- Fragment components and layouts
- Cluster system
- Canvas pan-zoom or transform
- Sidebar, StatusBar, SearchInput, NotePanel
- AI generation pipeline
- Session persistence / localStorage
- nd/ design system components
- App.tsx, useCanvas.ts, usePanZoom.ts

## Specific goals

1. Tether connectors are visible at default zoom (0.7) — opacity and stroke weight are legible without being heavy
2. Standard connectors are clearly distinguishable from tethers — different stroke style, weight, or opacity rhythm
3. Strong connectors are clearly distinguishable from standard — glow or weight or both
4. Connector labels sit on the bezier midpoint and don't overlap the line
5. All three types look correct at zoom 0.3 (macro) and zoom 1.2 (detail)

## Design intent

Tethers: thin, dashed, low opacity — they imply proximity not connection. They should barely be there.
Standard: solid, mid-weight, clearly intentional — a real relationship.
Strong: heavier, glowing, dominant — the primary structure of the map.

## Known constraints

- SVG is width:1 height:1 overflow:visible — do not change this
- Tether opacity currently lerps 0.55→0.12 over 200–600px distance
- Strong connector uses 4 stacked paths (outer-glow / mid-glow / inner-glow / core)
- Labels use labelOffsetX/Y for independent drag — do not break this

## Definition of done

Open the app with a canvas that has tether, standard, and strong connectors all visible. At zoom 0.7 all three types are immediately legible as distinct. No connector is invisible. Labels sit cleanly on their lines.
