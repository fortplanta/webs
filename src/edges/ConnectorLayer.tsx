import { useState, useMemo, useEffect } from 'react';
import type { Connector, Fragment, Cluster } from '../api/types';
import type { Transform } from '../canvas/usePanZoom';
import ConnectorLine from './Connector';
import ConnectorLabel from './ConnectorLabel';

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

export default function ConnectorLayer({
  connectors, fragments, clusters, transform,
  onLabelChange, onDelete, onPromote,
}: Props) {
  const [contextMenu, setContextMenu] = useState<ContextMenu>(null);

  // Dismiss context menu on any window click
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

  const handleContextMenu = (e: React.MouseEvent, connectorId: string) => {
    e.preventDefault();
    e.stopPropagation();
    // Convert screen coords to canvas space for menu position
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
        <defs>
          <filter id="connector-glow-filter" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>
        {connectors.map(conn => {
          const src = posById.get(conn.sourceId);
          const tgt = posById.get(conn.targetId);
          if (!src || !tgt) return null;
          const dist = Math.hypot(src.x - tgt.x, src.y - tgt.y);
          return (
            <ConnectorLine
              key={conn.id}
              connector={conn}
              x1={src.x} y1={src.y}
              x2={tgt.x} y2={tgt.y}
              distance={dist}
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
        return (
          <ConnectorLabel
            key={conn.id}
            connector={conn}
            midX={(src.x + tgt.x) / 2}
            midY={(src.y + tgt.y) / 2}
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
