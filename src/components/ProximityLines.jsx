import { useNodes, useViewport, Panel } from '@xyflow/react';
import { memo, useMemo } from 'react';

const THRESHOLD = 350;

function ProximityLines() {
  const nodes = useNodes();
  const { x: vpX, y: vpY, zoom } = useViewport();

  const lines = useMemo(() => {
    const mediaNodes = nodes.filter((n) => n.type === 'mediaNode' && !n.hidden);
    const candidateNodes = nodes.filter(
      (n) => n.type !== 'mediaNode' && n.type !== 'groupFrame' && !n.hidden
    );

    const result = [];

    for (const media of mediaNodes) {
      const mCx =
        media.position.x + (media.measured?.width ?? 320) / 2;
      const mCy =
        media.position.y + (media.measured?.height ?? 200) / 2;

      let closest = null;
      let closestDist = Infinity;

      for (const candidate of candidateNodes) {
        const cCx =
          candidate.position.x + (candidate.measured?.width ?? 320) / 2;
        const cCy =
          candidate.position.y + (candidate.measured?.height ?? 200) / 2;

        const dx = mCx - cCx;
        const dy = mCy - cCy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < THRESHOLD && dist < closestDist) {
          closestDist = dist;
          closest = { node: candidate, cx: cCx, cy: cCy };
        }
      }

      if (closest) {
        const opacity = 0.06 + (1 - closestDist / THRESHOLD) * 0.16;

        const x1 = mCx * zoom + vpX;
        const y1 = mCy * zoom + vpY;
        const x2 = closest.cx * zoom + vpX;
        const y2 = closest.cy * zoom + vpY;

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
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={`rgba(255,255,255,${opacity})`}
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
