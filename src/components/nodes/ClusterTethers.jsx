import { memo } from 'react';

// Typical satellite dimensions — used to find center from top-left offset
const SAT_AVG_W = 100; // approximate average width across satellite types
const SAT_AVG_H = 80;  // approximate average height across satellite types

const ClusterTethers = memo(({ primaryCenter, satellites }) => {
  return (
    <svg
      className="cluster-tethers"
      style={{
        position:      'absolute',
        top:           0,
        left:          0,
        width:         800,
        height:        800,
        pointerEvents: 'none',
        zIndex:        1,
        overflow:      'visible',
      }}
    >
      {satellites.map(sat => (
        <line
          key={sat.id}
          x1={primaryCenter.x}
          y1={primaryCenter.y}
          x2={sat.renderX + SAT_AVG_W / 2}
          y2={sat.renderY + SAT_AVG_H / 2}
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth="1"
          strokeDasharray="3 5"
        />
      ))}
    </svg>
  );
});

ClusterTethers.displayName = 'ClusterTethers';
export default ClusterTethers;
