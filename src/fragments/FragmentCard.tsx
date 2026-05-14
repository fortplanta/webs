import { useState } from 'react';
import type { Fragment, Cluster } from '../api/types';
import SourceAttribution from './SourceAttribution';
import FragmentMenu from './FragmentMenu';
import VerticalFlow from './layouts/VerticalFlow';
import QuoteCentered from './layouts/QuoteCentered';
import Timeline from './layouts/Timeline';
import ImageHero from './layouts/ImageHero';
import CardSplit from './layouts/CardSplit';
import ListProminent from './layouts/ListProminent';

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

  const { type, layout, title, sources, pinned } = fragment;
  const isQuote = layout === 'quote-centered';

  function renderLayoutBody() {
    switch (layout) {
      case 'quote-centered':  return <QuoteCentered fragment={fragment} />;
      case 'timeline':        return <Timeline fragment={fragment} />;
      case 'image-hero':      return <ImageHero fragment={fragment} />;
      case 'card-split':      return <CardSplit fragment={fragment} />;
      case 'list-prominent':  return <ListProminent fragment={fragment} />;
      case 'vertical-flow':
      default:                return <VerticalFlow fragment={fragment} />;
    }
  }

  return (
    <div className="fragment-card">
      {!isQuote && (
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
      )}

      {renderLayoutBody()}

      {sources && sources.length > 0 && (
        <SourceAttribution sources={sources} />
      )}
    </div>
  );
}
