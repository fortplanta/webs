import { useMemo } from 'react';
import type { Connector, Fragment, Cluster } from '../api/types';
import ConnectorEdge from './Connector';

interface Props {
  connectors: Connector[];
  fragments: Fragment[];
  clusters: Cluster[];
  onLabelChange: (id: string, label: string) => void;
  onContextMenu: (e: React.MouseEvent, connectorId: string) => void;
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
  onLabelChange, onContextMenu,
}: Props) {
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

  return (
    <svg
      style={{
        position: 'absolute', top: 0, left: 0,
        width: 1, height: 1, overflow: 'visible',
        pointerEvents: 'none', zIndex: 0,
      }}
    >
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
