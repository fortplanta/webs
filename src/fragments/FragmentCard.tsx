import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  onAnchor?: () => void;
  onUnanchor?: () => void;
  onResetPositions?: () => void;
}

export default function FragmentCard({
  fragment,
  clusters,
  onDuplicate,
  onMoveToCluster,
  onPin,
  onDelete,
  onAnchor,
  onUnanchor,
  onResetPositions,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);

  const { type, layout, title, sources, pinned } = fragment;
  const isQuote = layout === 'quote-centered';

  const handleMenuOpen = () => {
    const rect = menuBtnRef.current?.getBoundingClientRect();
    if (rect) {
      setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    setMenuOpen(v => !v);
  };

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
              ref={menuBtnRef}
              className="fragment-card__menu-btn"
              onMouseDown={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); handleMenuOpen(); }}
            >
              ···
            </button>
          </div>
          {menuOpen && menuPos && createPortal(
            <FragmentMenu
              fragmentId={fragment.id}
              pinned={pinned}
              anchored={fragment.anchored}
              clusters={clusters}
              onDuplicate={onDuplicate}
              onMoveToCluster={onMoveToCluster}
              onPin={onPin}
              onDelete={onDelete}
              onAnchor={onAnchor}
              onUnanchor={onUnanchor}
              onResetPositions={onResetPositions}
              onClose={() => setMenuOpen(false)}
              style={{ position: 'fixed', top: menuPos.top, right: menuPos.right }}
            />,
            document.body
          )}
        </div>
      )}

      {renderLayoutBody()}

      {sources && sources.length > 0 && (
        <SourceAttribution sources={sources} />
      )}
    </div>
  );
}
