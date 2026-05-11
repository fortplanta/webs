import { useState, useRef, useEffect } from 'react';
import type { Connector } from '../api/types';
import { getPath, getMidpoint } from './bezier';

interface Props {
  connector: Connector;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  scope: 'intra' | 'inter';
  sourceColor?: string;
  onLabelChange: (id: string, label: string) => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
}

const FO_W = 160;
const FO_H = 32;

export default function ConnectorEdge({
  connector, x1, y1, x2, y2, scope, sourceColor,
  onLabelChange, onContextMenu,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const renderType = connector.renderType ?? 'straight';
  const d = getPath(x1, y1, x2, y2, renderType);
  const { mx, my } = getMidpoint(x1, y1, x2, y2);

  const startEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditValue(connector.label);
    setEditing(true);
  };

  const confirm = () => {
    onLabelChange(connector.id, editValue.trim());
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); confirm(); }
    if (e.key === 'Escape') setEditing(false);
  };

  const handleCtxOnPath = (e: React.MouseEvent<SVGPathElement>) => {
    e.stopPropagation();
    onContextMenu(e, connector.id);
  };

  const handleCtxOnLabel = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    onContextMenu(e, connector.id);
  };

  const label = (
    <foreignObject
      x={mx - FO_W / 2}
      y={my - FO_H / 2}
      width={FO_W}
      height={FO_H}
      style={{ overflow: 'visible', pointerEvents: 'none' }}
    >
      <div
        className="connector-label-fo"
        style={{ pointerEvents: 'auto' }}
        onClick={startEdit}
        onContextMenu={handleCtxOnLabel}
      >
        {editing ? (
          <input
            ref={inputRef}
            className="connector-label-fo__input"
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={confirm}
            onClick={e => e.stopPropagation()}
          />
        ) : connector.label ? (
          <span className="connector-label-fo__pill">{connector.label}</span>
        ) : (
          <span className="connector-label-fo__empty" />
        )}
      </div>
    </foreignObject>
  );

  if (connector.type === 'standard') {
    const opacity = scope === 'intra' ? 0.40 : 0.20;
    return (
      <g>
        <path
          d={d}
          stroke={`rgba(0,0,0,${opacity})`}
          strokeWidth={1.5}
          fill="none"
          style={{ pointerEvents: 'stroke', cursor: 'context-menu' }}
          onContextMenu={handleCtxOnPath}
        />
        {label}
      </g>
    );
  }

  // strong — 4 stacked paths for glow + foreignObject label
  const color = sourceColor ?? 'rgba(0,0,0,0.8)';
  return (
    <g>
      <path d={d} className="connector-strong-outer-glow" style={{ stroke: color }} fill="none" />
      <path d={d} className="connector-strong-mid-glow"   style={{ stroke: color }} fill="none" />
      <path d={d} className="connector-strong-inner-glow" style={{ stroke: color }} fill="none" />
      <path
        d={d}
        className="connector-strong-core"
        style={{ stroke: color, pointerEvents: 'stroke', cursor: 'context-menu' } as React.CSSProperties}
        fill="none"
        onContextMenu={handleCtxOnPath}
      />
      {label}
    </g>
  );
}
