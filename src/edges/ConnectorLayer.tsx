import { useState, useMemo, useEffect } from 'react';
import type { Connector, ConnectorRenderType, Fragment, Cluster } from '../api/types';
import type { Transform } from '../canvas/usePanZoom';
import ConnectorEdge from './Connector';

const RENDER_TYPES: ConnectorRenderType[] = ['bezier', 'straight', 'step', 'smoothstep'];

interface Props {
  connectors: Connector[];
  fragments: Fragment[];
  clusters: Cluster[];
  transform: Transform;
  onLabelChange: (id: string, label: string) => void;
  onRenderTypeChange: (id: string, renderType: ConnectorRenderType) => void;
  onDelete: (id: string) => void;
  onPromote: (id: string, type: 'standard' | 'strong') => void;
}

type ContextMenu = { connectorId: string; x: number; y: number } | null;

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
  connectors, fragments, clusters, transform,
  onLabelChange, onRenderTypeChange, onDelete, onPromote,
}: Props) {
  const [contextMenu, setContextMenu] = useState<ContextMenu>(null);

  useEffect(() => {
    if (!contextMenu) return;
    const handler = () => setContextMenu(null);
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [contextMenu]);

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

  const handleContextMenu = (e: React.MouseEvent, connectorId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const cx = (e.clientX - transform.x) / transform.zoom;
    const cy = (e.clientY - transform.y) / transform.zoom;
    setContextMenu({ connectorId, x: cx, y: cy });
  };

  const activeConnector = contextMenu
    ? connectors.find(c => c.id === contextMenu.connectorId)
    : null;

  return (
    <>
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
              onContextMenu={handleContextMenu}
            />
          );
        })}
      </svg>

      {contextMenu && activeConnector && (
        <div
          className="connector-context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onMouseDown={e => e.stopPropagation()}
          onClick={e => e.stopPropagation()}
        >
          {RENDER_TYPES.map(rt => {
            const current = (activeConnector.renderType ?? 'bezier') === rt;
            return (
              <button
                key={rt}
                className={current ? 'connector-context-menu__item--checked' : ''}
                onClick={() => { onRenderTypeChange(activeConnector.id, rt); setContextMenu(null); }}
              >
                <span className="connector-context-menu__check">{current ? '✓' : ''}</span>
                {rt}
              </button>
            );
          })}
          <div className="connector-context-menu__divider" />
          {activeConnector.type === 'standard' && (
            <button onClick={() => { onPromote(activeConnector.id, 'strong'); setContextMenu(null); }}>Make strong</button>
          )}
          {activeConnector.type === 'strong' && (
            <button onClick={() => { onPromote(activeConnector.id, 'standard'); setContextMenu(null); }}>Make standard</button>
          )}
          <button onClick={() => { onDelete(activeConnector.id); setContextMenu(null); }}>Delete</button>
        </div>
      )}
    </>
  );
}
