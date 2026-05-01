import { useState, useRef, useEffect } from 'react';
import { TabSession } from '../api/types';

interface TabStripProps {
  tabs: TabSession[];
  activeTabId: string;
  canAdd: boolean;
  onSwitch: (id: string) => void;
  onClose: (id: string) => void;
  onAdd: () => void;
  onRename: (id: string, name: string) => void;
}

interface TabItemProps {
  tab: TabSession;
  isActive: boolean;
  onSwitch: () => void;
  onClose: () => void;
  onRename: (name: string) => void;
}

function TabItem({ tab, isActive, onSwitch, onClose, onRename }: TabItemProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(tab.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commitRename = () => {
    const name = draft.trim() || tab.name;
    setDraft(name);
    onRename(name);
    setEditing(false);
  };

  const cancelRename = () => {
    setDraft(tab.name);
    setEditing(false);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className={`tab${isActive ? ' tab--active' : ''}`}
      onClick={onSwitch}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onSwitch(); }}
      onDoubleClick={e => {
        e.stopPropagation();
        setDraft(tab.name);
        setEditing(true);
      }}
    >
      {editing ? (
        <input
          ref={inputRef}
          className="tab__name-input"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commitRename}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); commitRename(); }
            if (e.key === 'Escape') { e.preventDefault(); cancelRename(); }
          }}
          onClick={e => e.stopPropagation()}
          onDoubleClick={e => e.stopPropagation()}
        />
      ) : (
        <span className="tab__name">{tab.name}</span>
      )}
      <button
        className="tab__close"
        onClick={e => { e.stopPropagation(); onClose(); }}
        title="Close exploration"
      >
        ×
      </button>
    </div>
  );
}

export default function TabStrip({ tabs, activeTabId, canAdd, onSwitch, onClose, onAdd, onRename }: TabStripProps) {
  return (
    <div className="tab-strip">
      <div className="tab-strip__tabs">
        {tabs.map(tab => (
          <TabItem
            key={tab.id}
            tab={tab}
            isActive={tab.id === activeTabId}
            onSwitch={() => onSwitch(tab.id)}
            onClose={() => onClose(tab.id)}
            onRename={name => onRename(tab.id, name)}
          />
        ))}
      </div>
      <button
        className="tab-strip__add"
        onClick={onAdd}
        disabled={!canAdd}
        title={canAdd ? 'New exploration' : 'Maximum 20 explorations open'}
      >
        +
      </button>
    </div>
  );
}
