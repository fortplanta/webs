import type { Connector } from '../api/types';
import { TETHER_FULL_DISTANCE, TETHER_WEAK_DISTANCE } from '../canvas/useCanvas';

interface Props {
  connector: Connector;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  distance: number;
  onContextMenu: (e: React.MouseEvent<SVGLineElement>, id: string) => void;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export default function ConnectorLine({ connector, x1, y1, x2, y2, distance, onContextMenu }: Props) {
  const handleCtx = (e: React.MouseEvent<SVGLineElement>) => {
    e.stopPropagation();
    onContextMenu(e, connector.id);
  };

  if (connector.type === 'tether') {
    const t = Math.min(Math.max(
      (distance - TETHER_FULL_DISTANCE) / (TETHER_WEAK_DISTANCE - TETHER_FULL_DISTANCE),
      0, 1
    ));
    const opacity = lerp(0.2, 0.08, t);
    const dashLen = lerp(0, 4, t);
    const gapLen = lerp(0, 6, t);
    return (
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={`rgba(0,0,0,${opacity.toFixed(3)})`}
        strokeWidth={1}
        strokeDasharray={t > 0.01 ? `${dashLen.toFixed(2)} ${gapLen.toFixed(2)}` : undefined}
        style={{ pointerEvents: 'stroke', cursor: 'context-menu' }}
        onContextMenu={handleCtx}
      />
    );
  }

  if (connector.type === 'weak') {
    return (
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke="rgba(0,0,0,0.08)"
        strokeWidth={1}
        strokeDasharray="4 6"
        style={{ pointerEvents: 'stroke', cursor: 'context-menu' }}
        onContextMenu={handleCtx}
      />
    );
  }

  if (connector.type === 'standard') {
    return (
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        className="connector-standard"
        style={{ pointerEvents: 'stroke', cursor: 'context-menu' }}
        onContextMenu={handleCtx}
      />
    );
  }

  // strong — glow duplicate behind + animated main line
  return (
    <>
      {/* Glow — blurred duplicate. May have perf implications at scale. */}
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        className="connector-strong-glow"
      />
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        className="connector-strong"
        style={{ pointerEvents: 'stroke', cursor: 'context-menu' }}
        onContextMenu={handleCtx}
      />
    </>
  );
}
