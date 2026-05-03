import type { Connector } from '../api/types';
import { TETHER_FULL_DISTANCE, TETHER_WEAK_DISTANCE } from '../canvas/useCanvas';
import { getBezierPath, getBezierMidpoint } from './bezier';

interface Props {
  connector: Connector;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  distance: number;
  sourceColor?: string;
  onContextMenu: (e: React.MouseEvent<SVGElement>, id: string) => void;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export default function ConnectorLine({ connector, x1, y1, x2, y2, distance, sourceColor, onContextMenu }: Props) {
  const handleCtx = (e: React.MouseEvent<SVGElement>) => {
    e.stopPropagation();
    onContextMenu(e, connector.id);
  };

  if (connector.type === 'tether') {
    const t = Math.min(Math.max(
      (distance - TETHER_FULL_DISTANCE) / (TETHER_WEAK_DISTANCE - TETHER_FULL_DISTANCE),
      0, 1
    ));
    const opacity = lerp(0.25, 0.08, t);
    const sw = lerp(1.5, 1, t);
    const dashLen = lerp(0, 4, t);
    const gapLen = lerp(0, 8, t);
    return (
      <path
        d={getBezierPath(x1, y1, x2, y2)}
        stroke={`rgba(0,0,0,${opacity.toFixed(3)})`}
        strokeWidth={sw}
        strokeDasharray={t > 0.01 ? `${dashLen.toFixed(2)} ${gapLen.toFixed(2)}` : undefined}
        fill="none"
        style={{ pointerEvents: 'stroke', cursor: 'context-menu' }}
        onContextMenu={handleCtx}
      />
    );
  }

  if (connector.type === 'weak') {
    return (
      <path
        d={getBezierPath(x1, y1, x2, y2)}
        stroke="rgba(0,0,0,0.08)"
        strokeWidth={1}
        strokeDasharray="4 8"
        fill="none"
        style={{ pointerEvents: 'stroke', cursor: 'context-menu' }}
        onContextMenu={handleCtx}
      />
    );
  }

  if (connector.type === 'standard') {
    return (
      <path
        d={getBezierPath(x1, y1, x2, y2)}
        stroke="rgba(0,0,0,0.4)"
        strokeWidth={1.5}
        fill="none"
        style={{ pointerEvents: 'stroke', cursor: 'context-menu' }}
        onContextMenu={handleCtx}
      />
    );
  }

  // strong — 4 stacked paths + pinch dot at bezier midpoint
  // Perf note: CSS blur on SVG paths — monitor paint cost with many strong connectors
  const bezierPath = getBezierPath(x1, y1, x2, y2);
  const { mx, my } = getBezierMidpoint(x1, y1, x2, y2);
  const color = sourceColor ?? 'rgba(0,0,0,0.8)';
  return (
    <>
      <path d={bezierPath} className="connector-strong-outer-glow" style={{ stroke: color }} fill="none" />
      <path d={bezierPath} className="connector-strong-mid-glow"   style={{ stroke: color }} fill="none" />
      <path d={bezierPath} className="connector-strong-inner-glow" style={{ stroke: color }} fill="none" />
      <path
        d={bezierPath}
        className="connector-strong-core"
        style={{ stroke: color, pointerEvents: 'stroke', cursor: 'context-menu' } as React.CSSProperties}
        fill="none"
        onContextMenu={handleCtx}
      />
      <circle cx={mx} cy={my} r={3} style={{ fill: color }} />
    </>
  );
}
