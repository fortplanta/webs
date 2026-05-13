import { useState } from 'react';
import type { Fragment, Cluster } from '../api/types';
import SourceAttribution from './SourceAttribution';
import FragmentMenu from './FragmentMenu';

interface Props {
  fragment: Fragment;
  clusters: Cluster[];
  onDuplicate: () => void;
  onMoveToCluster: (clusterId: string) => void;
  onPin: () => void;
  onDelete: () => void;
}

export default function FragmentCard({
  fragment,
  clusters,
  onDuplicate,
  onMoveToCluster,
  onPin,
  onDelete,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  const { type, title, slots, sources, pinned } = fragment;
  const body = slots.find(s => s.type === 'body')?.content;
  const tags = slots.find(s => s.type === 'tags')?.items;

  return (
    <div className="fragment-card">
      <div className="fragment-card__header">
        <span
          className="fragment-card__chip"
          style={{
            background: `var(--color-fragment-${type}-bg)`,
            color: `var(--color-fragment-${type}-text)`,
          }}
        >
          {type}
        </span>
        <span className="fragment-card__title-text">{title}</span>
        <div className="fragment-menu-anchor">
          <button
            className="fragment-card__menu-btn"
            onMouseDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); setMenuOpen(v => !v); }}
          >
            ···
          </button>
          {menuOpen && (
            <FragmentMenu
              fragmentId={fragment.id}
              pinned={pinned}
              clusters={clusters}
              onDuplicate={onDuplicate}
              onMoveToCluster={onMoveToCluster}
              onPin={onPin}
              onDelete={onDelete}
              onClose={() => setMenuOpen(false)}
            />
          )}
        </div>
      </div>

      <div className="fragment-card__content">
        {body && <div className="fragment-card__body-text">{body}</div>}
        {tags && tags.length > 0 && (
          <div className="fragment-card__tags">
            {tags.map(tag => (
              <span key={tag} className="fragment-card__tag">{tag}</span>
            ))}
          </div>
        )}
        {sources && sources.length > 0 && (
          <SourceAttribution sources={sources} />
        )}
      </div>
    </div>
  );
}
