import '../styles/fragments.css';
import { Fragment as FragmentType, LayoutType } from '../api/types';
import { LOD } from '../canvas/useCanvas';
import FragmentHeader from './FragmentHeader';
import VerticalFlow from './layouts/VerticalFlow';
import QuoteCentered from './layouts/QuoteCentered';
import ImageHero from './layouts/ImageHero';
import CardSplit from './layouts/CardSplit';
import Timeline from './layouts/Timeline';
import ListProminent from './layouts/ListProminent';

const LAYOUT_COMPONENTS: Record<LayoutType, React.ComponentType<{ fragment: FragmentType }>> = {
  'vertical-flow':  VerticalFlow,
  'image-hero':     ImageHero,
  'quote-centered': QuoteCentered,
  'card-split':     CardSplit,
  'timeline':       Timeline,
  'list-prominent': ListProminent,
};

interface FragmentProps {
  fragment: FragmentType;
  lod: LOD;
  onMouseDown: (e: React.MouseEvent) => void;
  onDelete: (id: string) => void;
  onToggleStar: (id: string) => void;
  onPivot?: (id: string) => void;
  isPivoting?: boolean;
  pivotDisabled?: boolean;
  pivotError?: string | null;
  style?: React.CSSProperties;
}

export default function Fragment({
  fragment,
  lod,
  onMouseDown,
  onDelete,
  onToggleStar,
  onPivot,
  isPivoting,
  pivotDisabled,
  pivotError,
  style,
}: FragmentProps) {
  const { id, type, layout, title, starred } = fragment;
  const bgVar = `var(--color-fragment-${type}-bg)`;

  if (lod === 'compact') {
    return (
      <div
        data-fragment-id={id}
        className="fragment fragment--compact"
        style={{ background: bgVar, ...style }}
        onMouseDown={onMouseDown}
      />
    );
  }

  if (lod === 'macro') {
    return (
      <div
        data-fragment-id={id}
        className="fragment fragment--macro"
        style={{ background: bgVar, ...style }}
        onMouseDown={onMouseDown}
      />
    );
  }

  const LayoutComponent = LAYOUT_COMPONENTS[layout];
  const isQuote = layout === 'quote-centered';
  const isImageHero = layout === 'image-hero';
  const pivotButtonDisabled = isPivoting || pivotDisabled;

  return (
    <div
      data-fragment-id={id}
      className={`fragment fragment--${layout}`}
      style={style}
      onMouseDown={onMouseDown}
    >
      {!isQuote && (
        <FragmentHeader type={type} title={title} small={isImageHero} />
      )}
      <div className="fragment__card-body">
        <LayoutComponent fragment={fragment} />
        {isPivoting && (
          <div className="fragment__pivot-overlay">
            <div className="fragment__pivot-strip">
              <div className="fragment__pivot-track" />
              <div className="loading-canvas__head" />
            </div>
          </div>
        )}
        {pivotError && !isPivoting && (
          <div className="fragment__pivot-error">{pivotError}</div>
        )}
      </div>
      <div className="fragment__menubar">
        <button
          className="fragment__menubar-item"
          onClick={e => { e.stopPropagation(); onDelete(id); }}
        >
          delete
        </button>
        <button
          className={`fragment__menubar-item${pivotButtonDisabled ? ' fragment__menubar-item--disabled' : ''}`}
          onClick={e => { e.stopPropagation(); if (!pivotButtonDisabled) onPivot?.(id); }}
        >
          pivot
        </button>
        <button className="fragment__menubar-item">fact</button>
        <button
          className={`fragment__menubar-item${starred ? ' fragment__menubar-item--active' : ''}`}
          onClick={e => { e.stopPropagation(); onToggleStar(id); }}
        >
          star
        </button>
      </div>
    </div>
  );
}
