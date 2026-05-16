import { useState, useEffect, useRef } from 'react';
import type { Cluster } from '../api/types';

interface Props {
  fragmentId: string;
  pinned?: boolean;
  anchored?: boolean;
  clusters: Cluster[];
  depthScore?: number;
  onDuplicate: () => void;
  onMoveToCluster: (clusterId: string) => void;
  onPin: () => void;
  onDelete: () => void;
  onAnchor?: () => void;
  onUnanchor?: () => void;
  onResetPositions?: () => void;
  onLinkToExploration?: () => void;
  onClose: () => void;
  style?: React.CSSProperties;
}

export default function FragmentMenu({
  fragmentId: _fragmentId,
  pinned,
  anchored,
  clusters,
  depthScore = 0,
  onDuplicate,
  onMoveToCluster,
  onPin,
  onDelete,
  onAnchor,
  onUnanchor,
  onResetPositions,
  onLinkToExploration,
  onClose,
  style,
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
      style={style}
      onMouseDown={e => e.stopPropagation()}
      onClick={e => e.stopPropagation()}
    >
      <button className="fragment-menu__item" onClick={() => { onDuplicate(); onClose(); }}>
        Duplicate
      </button>

      {depthScore >= 200 && onLinkToExploration && (
        <button className="fragment-menu__item" onClick={() => { onLinkToExploration(); onClose(); }}>
          Link to another exploration →
        </button>
      )}

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

      {(onAnchor || onUnanchor) && (
        <button
          className={`fragment-menu__item${anchored ? ' fragment-menu__item--checked' : ''}`}
          onClick={() => { anchored ? onUnanchor?.() : onAnchor?.(); onClose(); }}
        >
          {anchored ? 'Unanchor' : 'Anchor to cluster'}
        </button>
      )}

      {onResetPositions && (
        <button className="fragment-menu__item" onClick={() => { onClose(); onResetPositions(); }}>
          Reset all positions
        </button>
      )}

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
