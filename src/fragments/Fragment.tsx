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
import { Icon } from '../nd/atoms/Icon/Icon';
import { Spinner } from '../nd/atoms/Spinner/Spinner';

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
            <Spinner variant="strip" width={120} />
          </div>
        )}
        {pivotError && !isPivoting && (
          <div className="fragment__pivot-error">{pivotError}</div>
        )}
      </div>
      <div className="fragment__menubar">
        <button
          className="fragment__menubar-item"
          title="Delete"
          onClick={e => { e.stopPropagation(); onDelete(id); }}
        >
          <Icon name="Trash2" size={14} color="inherit" />
        </button>
        <button
          className={`fragment__menubar-item${pivotButtonDisabled ? ' fragment__menubar-item--disabled' : ''}`}
          title="Pivot"
          onClick={e => { e.stopPropagation(); if (!pivotButtonDisabled) onPivot?.(id); }}
        >
          <Icon name="Shuffle" size={14} color="inherit" />
        </button>
        <button
          className={`fragment__menubar-item${starred ? ' fragment__menubar-item--active' : ''}`}
          title={starred ? 'Unstar' : 'Star'}
          onClick={e => { e.stopPropagation(); onToggleStar(id); }}
        >
          <Icon name="Star" size={14} color="inherit" />
        </button>
      </div>
    </div>
  );
}
