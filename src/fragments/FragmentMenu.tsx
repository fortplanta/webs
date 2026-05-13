import { useState, useEffect, useRef } from 'react';
import type { Cluster } from '../api/types';

interface Props {
  fragmentId: string;
  pinned?: boolean;
  clusters: Cluster[];
  onDuplicate: () => void;
  onMoveToCluster: (clusterId: string) => void;
  onPin: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export default function FragmentMenu({
  fragmentId: _fragmentId,
  pinned,
  clusters,
  onDuplicate,
  onMoveToCluster,
  onPin,
  onDelete,
  onClose,
}: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [onClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="fragment-menu"
      onMouseDown={e => e.stopPropagation()}
      onClick={e => e.stopPropagation()}
    >
      <button className="fragment-menu__item" onClick={() => { onDuplicate(); onClose(); }}>
        Duplicate
      </button>

      <div style={{ position: 'relative' }}>
        <button
          className="fragment-menu__item"
          onMouseEnter={() => setShowMoveMenu(true)}
          onMouseLeave={() => setShowMoveMenu(false)}
        >
          Move to cluster ›
        </button>
        {showMoveMenu && clusters.length > 0 && (
          <div
            className="fragment-menu"
            style={{ position: 'absolute', left: '100%', top: 0, minWidth: 160 }}
            onMouseEnter={() => setShowMoveMenu(true)}
            onMouseLeave={() => setShowMoveMenu(false)}
          >
            {clusters.map(c => (
              <button
                key={c.id}
                className="fragment-menu__item"
                onClick={() => { onMoveToCluster(c.id); onClose(); }}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        className={`fragment-menu__item${pinned ? ' fragment-menu__item--checked' : ''}`}
        onClick={() => { onPin(); onClose(); }}
      >
        {pinned ? 'Pinned' : 'Pin'}
      </button>

      <div className="fragment-menu__divider" />

      {confirmDelete ? (
        <div className="fragment-menu__confirm">
          <span>Sure?</span>
          <button onClick={() => { onDelete(); onClose(); }}>Delete</button>
          <button onClick={() => setConfirmDelete(false)}>Cancel</button>
        </div>
      ) : (
        <button
          className="fragment-menu__item fragment-menu__item--destructive"
          onClick={() => setConfirmDelete(true)}
        >
          Delete
        </button>
      )}
    </div>
  );
}
