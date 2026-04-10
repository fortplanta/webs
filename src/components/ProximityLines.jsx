import { useNodes, useViewport, Panel } from '@xyflow/react';
import { memo, useMemo } from 'react';

const THRESHOLD = 500; // flow units — edge-to-edge distance

/** Minimum distance between two axis-aligned rectangles (returns 0 if overlapping) */
function rectEdgeDist(ax, ay, aw, ah, bx, by, bw, bh) {
  const dx = Math.max(0, Math.max(ax, bx) - Math.min(ax + aw, bx + bw));
  const dy = Math.max(0, Math.max(ay, by) - Math.min(ay + ah, by + bh));
  return Math.sqrt(dx * dx + dy * dy);
}

function ProximityLines() {
  const nodes = useNodes();
  const { x: vpX, y: vpY, zoom } = useViewport();

  const lines = useMemo(() => {
    const mediaNodes = nodes.filter((n) => n.type === 'mediaNode' && !n.hidden);
    const candidates = nodes.filter(
      (n) => n.type !== 'mediaNode' && n.type !== 'groupFrame' && !n.hidden
    );

    const result = [];

    for (const media of mediaNodes) {
      const mw = media.measured?.width  ?? 320;
      const mh = media.measured?.height ?? 200;
      const mx = media.position.x;
      const my = media.position.y;

      let closest     = null;
      let closestDist = THRESHOLD;

      for (const candidate of candidates) {
        const cw = candidate.measured?.width  ?? 320;
        const ch = candidate.measured?.height ?? 200;
        const cx = candidate.position.x;
        const cy = candidate.position.y;

        const dist = rectEdgeDist(mx, my, mw, mh, cx, cy, cw, ch);

        if (dist < closestDist) {
          closestDist = dist;
          closest = { node: candidate, cx, cy, cw, ch };
        }
      }

      if (closest) {
        const opacity = 0.07 + (1 - closestDist / THRESHOLD) * 0.18;

        // Connect center-of-media to center-of-closest (visually cleaner than edge-to-edge for the line itself)
        const x1 = (mx + mw / 2) * zoom + vpX;
        const y1 = (my + mh / 2) * zoom + vpY;
        const x2 = (closest.cx + closest.cw / 2) * zoom + vpX;
        const y2 = (closest.cy + closest.ch / 2) * zoom + vpY;

        result.push({ key: `${media.id}-${closest.node.id}`, x1, y1, x2, y2, opacity });
      }
    }

    return result;
  }, [nodes, vpX, vpY, zoom]);

  if (lines.length === 0) return null;

  return (
    <Panel
      position="top-left"
      style={{ pointerEvents: 'none', width: '100%', height: '100%' }}
    >
      <svg
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          overflow: 'visible',
        }}
      >
        {lines.map(({ key, x1, y1, x2, y2, opacity }) => (
          <line
            key={key}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={`rgba(255,255,255,${opacity.toFixed(3)})`}
            strokeWidth={1}
            strokeDasharray="3 8"
            strokeLinecap="round"
          />
        ))}
      </svg>
    </Panel>
  );
}

ProximityLines.displayName = 'ProximityLines';
export default memo(ProximityLines);
