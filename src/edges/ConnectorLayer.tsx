import { useState, useMemo, useEffect } from 'react';
import type { Connector, Fragment, Cluster } from '../api/types';
import type { Transform } from '../canvas/usePanZoom';
import ConnectorLine from './Connector';
import ConnectorLabel from './ConnectorLabel';
import { getBezierMidpoint } from './bezier';

interface Props {
  connectors: Connector[];
  fragments: Fragment[];
  clusters: Cluster[];
  transform: Transform;
  onLabelChange: (id: string, label: string) => void;
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
  onLabelChange, onDelete, onPromote,
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
          width: 0, height: 0, overflow: 'visible',
          pointerEvents: 'none',
        }}
      >
        {connectors.map(conn => {
          const src = posById.get(conn.sourceId);
          const tgt = posById.get(conn.targetId);
          if (!src || !tgt) return null;
          const dist = Math.hypot(src.x - tgt.x, src.y - tgt.y);
          const srcType = fragTypeById.get(conn.sourceId);
          const sourceColor = srcType ? FRAG_COLOR_VAR[srcType] : undefined;
          return (
            <ConnectorLine
              key={conn.id}
              connector={conn}
              x1={src.x} y1={src.y}
              x2={tgt.x} y2={tgt.y}
              distance={dist}
              sourceColor={sourceColor}
              onContextMenu={handleContextMenu}
            />
          );
        })}
      </svg>

      {/* Labels for standard and strong connectors only */}
      {connectors.filter(c => c.type === 'standard' || c.type === 'strong').map(conn => {
        const src = posById.get(conn.sourceId);
        const tgt = posById.get(conn.targetId);
        if (!src || !tgt) return null;
        const { mx, my } = getBezierMidpoint(src.x, src.y, tgt.x, tgt.y);
        return (
          <ConnectorLabel
            key={conn.id}
            connector={conn}
            midX={mx}
            midY={my}
            onLabelChange={onLabelChange}
            onContextMenu={handleContextMenu}
          />
        );
      })}

      {/* Context menu */}
      {contextMenu && activeConnector && (
        <div
          className="connector-context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onMouseDown={e => e.stopPropagation()}
          onClick={e => e.stopPropagation()}
        >
          {(activeConnector.type === 'tether' || activeConnector.type === 'weak') && (
            <button onClick={() => { onPromote(activeConnector.id, 'strong'); setContextMenu(null); }}>
              Make strong
            </button>
          )}
          {activeConnector.type === 'standard' && (<>
            <button onClick={() => { onPromote(activeConnector.id, 'strong'); setContextMenu(null); }}>Make strong</button>
            <button onClick={() => { onDelete(activeConnector.id); setContextMenu(null); }}>Delete</button>
          </>)}
          {activeConnector.type === 'strong' && (<>
            <button onClick={() => { onPromote(activeConnector.id, 'standard'); setContextMenu(null); }}>Make standard</button>
            <button onClick={() => { onDelete(activeConnector.id); setContextMenu(null); }}>Delete</button>
          </>)}
        </div>
      )}
    </>
  );
}
