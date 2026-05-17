import { useMemo, useState } from 'react';
import { Html, Line } from '@react-three/drei';
import type { Connector, Fragment, Cluster, UserConnection } from '../api/types';
import ConnectorLine from './Connector';

// ─── Z layers ────────────────────────────────────────────────────────────────
const Z_CONNECTORS = 0;
const Z_TETHERS    = 0;
const Z_PREVIEW    = 0.5;

// canvasToThree y-flip
function cy(y: number) { return -y; }

const LAYOUT_WIDTHS_CL: Record<string, number> = {
  'vertical-flow': 320, 'image-hero': 480, 'quote-centered': 380,
  'card-split': 320, 'timeline': 400, 'list-prominent': 480, 'text-note': 200,
};

interface PreviewConnector { x1: number; y1: number; x2: number; y2: number; }

interface Props {
  connectors: Connector[];
  fragments: Fragment[];
  clusters: Cluster[];
  onLabelChange: (id: string, label: string) => void;
  onContextMenu: (e: React.MouseEvent, connectorId: string) => void;
  preview?: PreviewConnector | null;
  selectedTetherKey?: string | null;
  onTetherSelect?: (key: string) => void;
  onTetherDelete?: (key: string) => void;
  userConnections?: UserConnection[];
  connectPreview?: PreviewConnector | null;
  pendingConnectionIds?: Set<string>;
  fadingLabelIds?: Set<string>;
}

// Fragment type → hex color for connector coloring
const FRAG_COLOR_HEX: Record<string, string> = {
  person:  '#00E87B',
  concept: '#FF6D00',
  thesis:  '#FF3B30',
  source:  '#00D4FF',
  event:   '#FF9F0A',
  era:     '#BF5AF2',
  domain:  '#1a1a1a',
  quote:   '#2563EB',
};

export default function ConnectorLayer({
  connectors, fragments, clusters,
  onLabelChange, onContextMenu, preview,
  selectedTetherKey, onTetherSelect, onTetherDelete,
  userConnections = [],
  connectPreview,
  pendingConnectionIds,
  fadingLabelIds,
}: Props) {
  const [hoveredTetherKey, setHoveredTetherKey] = useState<string | null>(null);

  // ── Position / type lookup maps ────────────────────────────────────────────
  const posById = useMemo(() => {
    const m = new Map<string, { x: number; y: number }>();
    fragments.forEach(f => m.set(f.id, { x: f.x, y: f.y }));
    clusters.forEach(c  => m.set(c.id,  { x: c.x,  y: c.y  }));
    return m;
  }, [fragments, clusters]);

  const fragTypeById = useMemo(() => {
    const m = new Map<string, string>();
    fragments.forEach(f => m.set(f.id, f.type));
    return m;
  }, [fragments]);

  const clusterIdByFragId = useMemo(() => {
    const m = new Map<string, string>();
    fragments.forEach(f => m.set(f.id, f.clusterId));
    return m;
  }, [fragments]);

  const fragWidthById = useMemo(() => {
    const m = new Map<string, number>();
    fragments.forEach(f => m.set(f.id, f.width ?? LAYOUT_WIDTHS_CL[f.layout] ?? 320));
    return m;
  }, [fragments]);

  // ── Tether lines (cluster spawn → each of its fragments) ──────────────────
  const clusterTethers = useMemo(() => {
    const lines: { key: string; cx: number; cy: number; fx: number; fy: number }[] = [];
    clusters.forEach(c => {
      fragments.filter(f => f.clusterId === c.id).forEach(f => {
        lines.push({ key: `${c.id}-${f.id}`, cx: c.x, cy: c.y, fx: f.x, fy: f.y });
      });
    });
    return lines;
  }, [clusters, fragments]);

  return (
    <>
      {/* ── Tether lines ─────────────────────────────────────────────────── */}
      {clusterTethers.map(t => {
        const isSelected = selectedTetherKey === t.key;
        const isHovered  = hoveredTetherKey  === t.key;
        const mx = (t.cx + t.fx) / 2;
        const my = (t.cy + t.fy) / 2;

        return (
          <group key={t.key}>
            {/* Visual tether line */}
            <Line
              points={[
                [t.cx, cy(t.cy), Z_TETHERS],
                [t.fx, cy(t.fy), Z_TETHERS],
              ]}
              color={isSelected ? '#0D99FF' : '#000000'}
              lineWidth={isSelected ? 2 : 1}
              opacity={isSelected ? 1 : 0.18}
              transparent
              dashed
              dashSize={2}
              gapSize={5}
            />

            {/* Interactive midpoint hit area (Html) */}
            <group position={[mx, cy(my), Z_TETHERS + 0.1]}>
              <Html transform={false} occlude={false} center zIndexRange={[10, 50]}>
                <div
                  style={{ width: 20, height: 20, cursor: 'pointer', position: 'relative' }}
                  onClick={e => { e.stopPropagation(); onTetherSelect?.(t.key); }}
                  onMouseEnter={() => setHoveredTetherKey(t.key)}
                  onMouseLeave={() => setHoveredTetherKey(null)}
                >
                  {(isHovered || isSelected) && (
                    <button
                      className="tether-delete-btn"
                      style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}
                      onClick={e => { e.stopPropagation(); onTetherDelete?.(t.key); }}
                      onMouseEnter={() => setHoveredTetherKey(t.key)}
                      onMouseLeave={() => setHoveredTetherKey(null)}
                      title="Remove tether"
                    >
                      ×
                    </button>
                  )}
                </div>
              </Html>
            </group>
          </group>
        );
      })}

      {/* ── User connections ──────────────────────────────────────────────── */}
      {userConnections.map(uc => {
        const src = posById.get(uc.sourceFragmentId);
        const tgt = posById.get(uc.targetFragmentId);
        if (!src || !tgt) return null;
        const srcW = fragWidthById.get(uc.sourceFragmentId) ?? 320;
        const tgtW = fragWidthById.get(uc.targetFragmentId) ?? 320;
        const x1 = src.x + srcW / 2;
        const y1 = src.y;
        const x2 = tgt.x - tgtW / 2;
        const y2 = tgt.y;
        const lx = (x1 + x2) / 2;
        const ly = (y1 + y2) / 2;
        const isPending     = pendingConnectionIds?.has(uc.id) ?? false;
        const isLabelFading = fadingLabelIds?.has(uc.id) ?? false;

        return (
          <group key={uc.id}>
            <Line
              points={[[x1, cy(y1), Z_CONNECTORS], [x2, cy(y2), Z_CONNECTORS]]}
              color="#000000"
              lineWidth={1.5}
              opacity={0.35}
              transparent
              dashed={isPending}
              dashSize={isPending ? 6 : undefined}
              gapSize={isPending ? 4 : undefined}
            />
            {uc.label && (
              <group position={[lx, cy(ly), Z_CONNECTORS + 0.5]}>
                <Html
                  transform={false}
                  occlude={false}
                  center
                  zIndexRange={[10, 50]}
                  style={{ opacity: isLabelFading ? 0 : 1, transition: 'opacity 150ms', pointerEvents: 'none' }}
                >
                  <span className="connector-label-fo">{uc.label}</span>
                </Html>
              </group>
            )}
          </group>
        );
      })}

      {/* ── Connect handle preview (user dragging connection) ─────────────── */}
      {connectPreview && (
        <Line
          points={[
            [connectPreview.x1, cy(connectPreview.y1), Z_PREVIEW],
            [connectPreview.x2, cy(connectPreview.y2), Z_PREVIEW],
          ]}
          color="#000000"
          lineWidth={1.5}
          opacity={0.45}
          transparent
          dashed
          dashSize={6}
          gapSize={4}
        />
      )}

      {/* ── Connector dot drag preview ────────────────────────────────────── */}
      {preview && (
        <Line
          points={[
            [preview.x1, cy(preview.y1), Z_PREVIEW],
            [preview.x2, cy(preview.y2), Z_PREVIEW],
          ]}
          color="#000000"
          lineWidth={1.5}
          opacity={0.5}
          transparent
          dashed
          dashSize={4}
          gapSize={6}
        />
      )}

      {/* ── AI connectors ─────────────────────────────────────────────────── */}
      {connectors.map(conn => {
        const src = posById.get(conn.sourceId);
        const tgt = posById.get(conn.targetId);
        if (!src || !tgt) return null;
        const srcCluster = clusterIdByFragId.get(conn.sourceId);
        const tgtCluster = clusterIdByFragId.get(conn.targetId);
        const scope: 'intra' | 'inter' =
          srcCluster && tgtCluster && srcCluster === tgtCluster ? 'intra' : 'inter';
        const srcType     = fragTypeById.get(conn.sourceId);
        const sourceColor = srcType ? FRAG_COLOR_HEX[srcType] : undefined;

        return (
          <ConnectorLine
            key={conn.id}
            connector={conn}
            x1={src.x} y1={src.y}
            x2={tgt.x} y2={tgt.y}
            scope={scope}
            sourceColor={sourceColor}
            onLabelChange={onLabelChange}
            onContextMenu={onContextMenu}
          />
        );
      })}
    </>
  );
}
