import { useState, useRef, useEffect } from 'react';
import type { Connector } from '../api/types';

interface Props {
  connector: Connector;
  midX: number;
  midY: number;
  onLabelChange: (id: string, label: string) => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
}

export default function ConnectorLabel({ connector, midX, midY, onLabelChange, onContextMenu }: Props) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div
      className={`connector-label ${connector.label ? 'connector-label--pill' : 'connector-label--dot'}`}
      style={{ left: midX, top: midY }}
      onClick={!connector.label && !editing ? startEdit : undefined}
      onDoubleClick={connector.label && !editing ? startEdit : undefined}
      onContextMenu={e => onContextMenu(e, connector.id)}
      onMouseDown={e => e.stopPropagation()}
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
