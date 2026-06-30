# Webs Bridge Brief

Webs is evolving into the connective layer between Figma, Cavalry, Blender, and Eagle. It should remain a live canvas and project brain, while adding a local transfer broker that removes manual export/name/find/import loops.

## Product Role

- Figma stays the design home base.
- Webs becomes the in-between surface: canvas, project record, and transfer broker.
- Eagle remains the asset library; Webs files assets there only when the user asks.
- Cavalry is the 2D motion design app, and Blender is the 3D tool.

## Core Loop

1. Copy or select work in the source app.
2. Paste through Webs into a destination app.
3. Choose the best available format at paste time.
4. Preserve editability where the hop allows it.
5. Label lossy returns honestly as previews or renders.
6. Optionally catalog the transferred asset in Eagle with provenance.

## Format Reality

- Figma to Cavalry: SVG with separated layers where possible.
- Cavalry to Figma: MP4, GIF, PNG, or another rendered preview.
- Figma to Blender: SVG imported as editable curves.
- Cavalry to Blender or Blender to Cavalry: image or EXR sequences are the realistic baseline.
- Any asset to Eagle: asset file plus metadata for source app, source object, timestamp, format, and transfer history.

## Phase-One Target

- Start with the Figma-Cavalry bridge.
- Use one clipboard-based paste-and-choose interaction pattern across hops.
- Keep Webs' existing free canvas movement intact.
- Add provenance and project notes as part of the project-brain layer.
- Do not chase a universal lossless round trip; choose the best honest format for each hop.
