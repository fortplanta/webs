import { useMemo, useState } from 'react';
import type { Connector, Fragment, Cluster, UserConnection } from '../api/types';
import ConnectorEdge from './Connector';

const LAYOUT_WIDTHS_CL: Record<string, number> = {
  'vertical-flow': 320, 'image-hero': 480, 'quote-centered': 380,
  'card-split': 320, 'timeline': 400, 'list-prominent': 480, 'text-note': 200,
};

interface PreviewConnector {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

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
}

const FRAG_COLOR_VAR: Record<string, string> = {
  person:  'var(--color-fragment-person-bg)',
  concept: 'var(--color-fragment-concept-bg)',
  thesis:  'var(--color-fragment-thesis-bg)',
  source:  'var(--color-fragment-source-bg)',
  event:   'var(--color-fragment-event-bg)',
  era:     'var(--color-fragment-era-bg)',
  domain:  'var(--color-fragment-domain-bg)',
  quote:   'var(--color-fragment-quote-bg)',
};

export default function ConnectorLayer({
  connectors, fragments, clusters,
  onLabelChange, onContextMenu, preview,
  selectedTetherKey, onTetherSelect, onTetherDelete,
  userConnections = [],
  connectPreview,
}: Props) {
  const [hoveredTetherKey, setHoveredTetherKey] = useState<string | null>(null);
  const posById = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    fragments.forEach(f => map.set(f.id, { x: f.x, y: f.y }));
    clusters.forEach(c => map.set(c.id, { x: c.x, y: c.y }));
    return map;
  }, [fragments, clusters]);

  const fragTypeById = useMemo(() => {
    const map = new Map<string, string>();
    fragments.forEach(f => map.set(f.id, f.type));
    return map;
  }, [fragments]);

  const clusterIdByFragId = useMemo(() => {
    const map = new Map<string, string>();
    fragments.forEach(f => map.set(f.id, f.clusterId));
    return map;
  }, [fragments]);

  const fragWidthById = useMemo(() => {
    const map = new Map<string, number>();
    fragments.forEach(f => map.set(f.id, f.width ?? LAYOUT_WIDTHS_CL[f.layout] ?? 320));
    return map;
  }, [fragments]);

  // Tether lines: faint lines from each cluster spawn point to its fragments
  const clusterTethers = useMemo(() => {
    const lines: { key: string; cx: number; cy: number; fx: number; fy: number }[] = [];
    clusters.forEach(c => {
      const clusterFrags = fragments.filter(f => f.clusterId === c.id);
      clusterFrags.forEach(f => {
        lines.push({ key: `${c.id}-${f.id}`, cx: c.x, cy: c.y, fx: f.x, fy: f.y });
      });
    });
    return lines;
  }, [clusters, fragments]);

  return (
    <svg
      style={{
        position: 'absolute', top: 0, left: 0,
        width: 1, height: 1, overflow: 'visible',
        zIndex: 0,
      }}
    >
      {clusterTethers.map(t => {
        const isSelected = selectedTetherKey === t.key;
        const isHovered = hoveredTetherKey === t.key;
        const mx = (t.cx + t.fx) / 2;
        const my = (t.cy + t.fy) / 2;
        return (
          <g key={t.key}>
            {/* Invisible wide hit target */}
            <line
              x1={t.cx} y1={t.cy} x2={t.fx} y2={t.fy}
              stroke="transparent" strokeWidth={12}
              style={{ cursor: 'pointer', pointerEvents: 'stroke' }}
              onClick={e => { e.stopPropagation(); onTetherSelect?.(t.key); }}
              onMouseEnter={() => setHoveredTetherKey(t.key)}
              onMouseLeave={() => setHoveredTetherKey(null)}
            />
            {/* Visible line */}
            <line
              x1={t.cx} y1={t.cy} x2={t.fx} y2={t.fy}
              stroke={isSelected ? '#0D99FF' : 'rgba(0,0,0,0.18)'}
              strokeWidth={isSelected ? 2 : 1}
              strokeDasharray="2 5"
              style={{ pointerEvents: 'none' }}
            />
            {/* × delete button at midpoint — shown on hover or select */}
            {(isHovered || isSelected) && (
              <foreignObject
                x={mx - 8} y={my - 8}
                width={16} height={16}
                style={{ pointerEvents: 'auto', overflow: 'visible' }}
              >
                <button
                  className="tether-delete-btn"
                  onClick={e => { e.stopPropagation(); onTetherDelete?.(t.key); }}
                  onMouseEnter={() => setHoveredTetherKey(t.key)}
                  onMouseLeave={() => setHoveredTetherKey(null)}
                  title="Remove tether"
                >×</button>
              </foreignObject>
            )}
          </g>
        );
      })}
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
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        return (
          <g key={uc.id} pointerEvents="none">
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(0,0,0,0.35)" strokeWidth={1.5} />
            {uc.label && (
              <foreignObject x={mx - 60} y={my - 10} width={120} height={20} style={{ overflow: 'visible' }}>
                <span className="connector-label-fo">{uc.label}</span>
              </foreignObject>
            )}
          </g>
        );
      })}

      {connectPreview && (
        <line
          x1={connectPreview.x1} y1={connectPreview.y1}
          x2={connectPreview.x2} y2={connectPreview.y2}
          stroke="#000"
          strokeWidth={1.5}
          strokeDasharray="6 4"
          opacity={0.45}
          pointerEvents="none"
        />
      )}

      {preview && (
        <path
          d={`M ${preview.x1} ${preview.y1} L ${preview.x2} ${preview.y2}`}
          className="connector-preview"
        />
      )}
      {connectors.map(conn => {
        const src = posById.get(conn.sourceId);
        const tgt = posById.get(conn.targetId);
        if (!src || !tgt) return null;
        const srcCluster = clusterIdByFragId.get(conn.sourceId);
        const tgtCluster = clusterIdByFragId.get(conn.targetId);
        const scope: 'intra' | 'inter' =
          srcCluster && tgtCluster && srcCluster === tgtCluster ? 'intra' : 'inter';
        const srcType = fragTypeById.get(conn.sourceId);
        const sourceColor = srcType ? FRAG_COLOR_VAR[srcType] : undefined;
        return (
          <ConnectorEdge
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
    </svg>
  );
}
