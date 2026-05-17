import type { ConnectorRenderType } from '../api/types';

export function getPath(
  x1: number, y1: number,
  x2: number, y2: number,
  type: ConnectorRenderType = 'bezier',
): string {
  switch (type) {
    case 'straight':
      return `M ${x1} ${y1} L ${x2} ${y2}`;

    case 'step': {
      const mx = (x1 + x2) / 2;
      return `M ${x1} ${y1} H ${mx} V ${y2} H ${x2}`;
    }

    case 'smoothstep': {
      const mx = (x1 + x2) / 2;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const r = Math.min(Math.abs(dx) / 4, Math.abs(dy) / 2, 12);
      if (r < 0.5) return `M ${x1} ${y1} H ${mx} V ${y2} H ${x2}`;
      const sx = dx >= 0 ? 1 : -1;
      const sy = dy >= 0 ? 1 : -1;
      return [
        `M ${x1} ${y1}`,
        `H ${mx - r * sx}`,
        `Q ${mx} ${y1} ${mx} ${y1 + r * sy}`,
        `V ${y2 - r * sy}`,
        `Q ${mx} ${y2} ${mx + r * sx} ${y2}`,
        `H ${x2}`,
      ].join(' ');
    }

    case 'bezier':
    default: {
      const dx = Math.abs(x2 - x1) * 0.5;
      return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
    }
  }
}

// Midpoint is always the geometric center regardless of render type.
// For bezier: B(0.5) = (x1+x2)/2, (y1+y2)/2 (symmetric horizontal-bias curve).
// For step: walking half the path length also lands at ((x1+x2)/2, (y1+y2)/2).
// For straight/smoothstep: trivially the same.
export function getMidpoint(x1: number, y1: number, x2: number, y2: number) {
  return { mx: (x1 + x2) / 2, my: (y1 + y2) / 2 };
}

// Backward-compatible aliases
export const getBezierPath = (x1: number, y1: number, x2: number, y2: number) =>
  getPath(x1, y1, x2, y2, 'bezier');

export const getBezierMidpoint = (x1: number, y1: number, x2: number, y2: number) =>
  getMidpoint(x1, y1, x2, y2);

// ─── Three.js bezier points (for R3F Line component) ─────────────────────────
// Returns sampled points along a cubic bezier curve, y-flipped for Three.js
// (canvas y-down → Three.js y-up). Z is always 0; callers set z via group position.
export function getBezierPoints3D(
  x1: number, y1: number,
  x2: number, y2: number,
  scope: 'intra' | 'inter',
  segments: number = 32,
): [number, number, number][] {
  const dx = Math.abs(x2 - x1) * (scope === 'inter' ? 0.6 : 0.3);
  // Control points: horizontal-bias cubic bezier
  const cx1 = x1 + dx; const cy1 = y1;
  const cx2 = x2 - dx; const cy2 = y2;
  const pts: [number, number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const mt = 1 - t;
    const bx = mt*mt*mt*x1 + 3*mt*mt*t*cx1 + 3*mt*t*t*cx2 + t*t*t*x2;
    const by = mt*mt*mt*y1 + 3*mt*mt*t*cy1 + 3*mt*t*t*cy2 + t*t*t*y2;
    pts.push([bx, -by, 0]); // y-flip: canvas y → Three.js -y
  }
  return pts;
}
