import type { Transform } from './usePanZoom';

const DOT_SPACING = 24;

export default function CanvasBackground({ transform }: { transform: Transform }) {
  const spacing = DOT_SPACING * transform.zoom;
  const ox = ((transform.x % spacing) + spacing) % spacing;
  const oy = ((transform.y % spacing) + spacing) % spacing;

  return (
    <svg
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      aria-hidden="true"
    >
      <defs>
        <pattern
          id="dot-grid"
          patternUnits="userSpaceOnUse"
          width={spacing}
          height={spacing}
          x={ox}
          y={oy}
        >
          <circle
            cx={spacing / 2}
            cy={spacing / 2}
            r={0.5}
            fill="var(--color-canvas-dot)"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dot-grid)" />
    </svg>
  );
}
