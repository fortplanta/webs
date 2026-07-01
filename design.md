# Webs Design System

This file captures the visual and interaction intent for Webs. Attach or reference it in design-heavy Codex prompts.

## Product Feel

Webs should feel like a serious creative thinking instrument: quiet, spatial, tactile, and personal. It is closer to a dark studio wall, corkboard, or map table than a SaaS dashboard.

Avoid:

- Marketing hero sections.
- Purple/blue gradient sameness.
- Oversized cards and decorative blobs.
- Generic productivity-app chrome.
- Explaining the interface with visible tutorial copy.

Prefer:

- Low-noise surfaces.
- Clear hierarchy at multiple zoom levels.
- Tool controls that disappear when not needed.
- Dense but calm panels.
- Spatial relationships over lists.

## Layout Principles

- The canvas is the primary surface.
- Navigation and panels should support the canvas, not dominate it.
- Fragment cards can be expressive, but page-level containers should stay unframed.
- Use stable dimensions for toolbars, controls, counters, and cards to prevent layout shift.
- Text must never overlap or spill outside interactive controls.

## Color

Keep the palette dark, neutral, and quietly dimensional.

- Background: near-black charcoal with subtle grid texture.
- Surfaces: layered charcoal, graphite, and muted ink.
- Text: soft white, cool gray, dim gray for secondary metadata.
- Accents: restrained, purposeful, and varied by semantic role.
- Avoid a one-note purple, beige, brown, or dark-blue theme.

## Typography

- Use compact, readable type.
- Reserve large display type for true exploration titles only.
- Fragment headings should scan quickly at canvas distance.
- Metadata should be small but readable.
- Letter spacing should stay at `0` unless an existing component requires otherwise.

## Components

- Fragment cards: max 8px radius unless existing styles require otherwise.
- Modals: functional, focused, not decorative.
- Buttons: icon-first for tools; text only for explicit commands.
- Menus: compact, grouped by action.
- Panels: dense, scannable, and quiet.
- Empty states: minimal and direct.

## Motion

Motion should feel like navigation through a thinking space.

- Use short, purposeful transitions.
- Avoid bouncy or playful motion on core tool controls.
- Preserve orientation during pan, zoom, and generation transitions.
- Loading states should indicate progress without feeling theatrical.

## Bridge-Specific UI

The bridge workflow should feel like a natural canvas action:

1. Copy/select in source app.
2. Paste through Webs.
3. Choose destination and format at cursor.
4. See whether the handoff is editable or rendered.
5. Optionally file to Eagle with provenance.

Format labels must be honest:

- "Editable SVG layers"
- "Rendered MP4 preview"
- "PNG comparison artifact"
- "EXR/image sequence"
- "Filed to Eagle with provenance"

