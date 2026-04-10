import { getStraightPath } from '@xyflow/react';
import { memo } from 'react';

/**
 * Soft dashed line rendered in the SVG edges layer (always behind nodes).
 * Style (stroke color/opacity) is passed via the edge's `style` prop.
 */
function ProximityEdge({ sourceX, sourceY, targetX, targetY, style }) {
  const [path] = getStraightPath({ sourceX, sourceY, targetX, targetY });
  return (
    <path
      d={path}
      fill="none"
      stroke={style?.stroke ?? 'rgba(255,255,255,0.12)'}
      strokeWidth={1}
      strokeDasharray="3 8"
      strokeLinecap="round"
    />
  );
}

ProximityEdge.displayName = 'ProximityEdge';
export default memo(ProximityEdge);
