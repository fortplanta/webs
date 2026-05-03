import { useState, useRef, useEffect } from 'react';
import type { Connector } from '../api/types';

interface Props {
  connector: Connector;
  midX: number;
  midY: number;
  zoom: number;
  onLabelChange: (id: string, label: string) => void;
  onOffsetChange: (dx: number, dy: number) => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
}

export default function ConnectorLabel({ connector, midX, midY, zoom, onLabelChange, onOffsetChange, onContextMenu }: Props) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const dragging = useRef(false);
  const dragPos = useRef<{ x: number; y: number } | null>(null);
  const hasDragged = useRef(false);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const startEdit = () => {
    setEditValue(connector.label);
    setEditing(true);
  };

  const confirm = () => {
    onLabelChange(connector.id, editValue.trim());
    setEditing(false);
  };

  const cancel = () => setEditing(false);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!dragging.current || !dragPos.current) return;
      const dx = (e.clientX - dragPos.current.x) / zoom;
      const dy = (e.clientY - dragPos.current.y) / zoom;
      dragPos.current = { x: e.clientX, y: e.clientY };
      hasDragged.current = true;
      onOffsetChange(dx, dy);
    };
    const handleUp = () => {
      dragging.current = false;
      dragPos.current = null;
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [zoom, onOffsetChange]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (editing) return;
    e.stopPropagation();
    e.preventDefault();
    dragging.current = true;
    dragPos.current = { x: e.clientX, y: e.clientY };
    hasDragged.current = false;
  };

  const handleClick = (e: React.MouseEvent) => {
    if (hasDragged.current) { hasDragged.current = false; return; }
    if (!connector.label && !editing) startEdit();
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (hasDragged.current) return;
    if (connector.label && !editing) startEdit();
  };

  return (
    <div
      className={`connector-label ${connector.label ? 'connector-label--pill' : 'connector-label--dot'}`}
      style={{ left: midX, top: midY, cursor: editing ? 'text' : 'grab' }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseDown={handleMouseDown}
      onContextMenu={e => onContextMenu(e, connector.id)}
    >
      {editing ? (
        <input
          ref={inputRef}
          className="connector-label__input"
          value={editValue}
          onChange={e => setEditValue(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') confirm();
            if (e.key === 'Escape') cancel();
          }}
          onBlur={confirm}
          onClick={e => e.stopPropagation()}
        />
      ) : connector.label ? (
        <span>{connector.label}</span>
      ) : null}
    </div>
  );
}
