import type { Connector } from '../api/types';
import { getBezierPath, getBezierMidpoint } from './bezier';

interface Props {
  connector: Connector;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  distance: number;
  scope: 'intra' | 'inter';
  sourceColor?: string;
  onContextMenu: (e: React.MouseEvent<SVGElement>, id: string) => void;
}

export default function ConnectorLine({ connector, x1, y1, x2, y2, distance: _distance, scope, sourceColor, onContextMenu }: Props) {
  const handleCtx = (e: React.MouseEvent<SVGElement>) => {
    e.stopPropagation();
    onContextMenu(e, connector.id);
  };

  if (connector.type === 'standard') {
    const opacity = scope === 'intra' ? 0.40 : 0.20;
    return (
      <path
        d={getBezierPath(x1, y1, x2, y2)}
        stroke={`rgba(0,0,0,${opacity})`}
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
