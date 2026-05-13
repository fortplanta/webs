import { useRef, useEffect } from 'react';
import '../styles/fragments.css';
import '../styles/fragment-card.css';
import '../styles/accordion.css';
import '../styles/connector-dot.css';
import { Fragment as FragmentType } from '../api/types';
import { LOD } from '../canvas/useCanvas';
import type { ResizeHandle } from '../canvas/useSelection';
import type { Cluster } from '../api/types';
import FragmentCard from './FragmentCard';
import FragmentAccordions from './FragmentAccordions';
import ConnectorDot from './ConnectorDot';
import TextNote from './layouts/TextNote';
import { Spinner } from '../nd/atoms/Spinner/Spinner';

const RESIZE_HANDLES: ResizeHandle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

interface FragmentProps {
  fragment: FragmentType;
  lod: LOD;
  clusters: Cluster[];
  onMouseDown: (e: React.MouseEvent) => void;
  onDelete: (id: string) => void;
  onToggleStar: (id: string) => void;
  onPivot?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onPin?: (id: string) => void;
  onMoveToCluster?: (fragmentId: string, clusterId: string) => void;
  onAddAccordion?: (fragmentId: string, promptId: string) => Promise<void>;
  onConnectorDotStart?: (fragmentId: string, e: React.MouseEvent) => void;
  isPivoting?: boolean;
  pivotDisabled?: boolean;
  pivotError?: string | null;
  isSelected?: boolean;
  isEditing?: boolean;
  onTitleChange?: (id: string, title: string) => void;
  onDoubleClick?: (id: string) => void;
  onResizeStart?: (handle: ResizeHandle, e: React.MouseEvent) => void;
  dotDragging?: boolean;
  style?: React.CSSProperties;
}

export default function Fragment({
  fragment,
  lod,
  clusters,
  onMouseDown,
  onDelete,
  onToggleStar: _onToggleStar,
  onPivot,
  onDuplicate,
  onPin,
  onMoveToCluster,
  onAddAccordion,
  onConnectorDotStart,
  isPivoting,
  pivotDisabled: _pivotDisabled,
  pivotError,
  isSelected,
  isEditing,
  onTitleChange,
  onDoubleClick,
  onResizeStart,
  dotDragging,
  style,
}: FragmentProps) {
  const { id, layout, width } = fragment;
  const bgVar = `var(--color-fragment-${fragment.type}-bg)`;
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
    }
  }, [isEditing]);

  const selectedClass = isSelected ? ' fragment-wrapper--selected' : '';
  const widthStyle = width ? { ...style, width } : style;

  // Compact LOD — colored bar
  if (lod === 'compact') {
    return (
      <div
        data-fragment-id={id}
        className="fragment fragment--compact"
        style={{ background: bgVar, ...widthStyle }}
        onMouseDown={onMouseDown}
      />
    );
  }

  // Macro LOD — colored dot
  if (lod === 'macro') {
    return (
      <div
        data-fragment-id={id}
        className="fragment fragment--macro"
        style={{ background: bgVar, ...widthStyle }}
        onMouseDown={onMouseDown}
      />
    );
  }

  // Text note — handled separately
  if (layout === 'text-note') {
    if (isEditing) {
      return (
        <div
          data-fragment-id={id}
          className={`fragment fragment--text-note${isSelected ? ' fragment--selected' : ''}`}
          style={widthStyle}
          onMouseDown={onMouseDown}
        >
          <textarea
            ref={inputRef}
            className="text-note__input"
            defaultValue={fragment.title}
            rows={1}
            onMouseDown={e => e.stopPropagation()}
            onInput={e => {
              const el = e.currentTarget;
              el.style.height = 'auto';
              el.style.height = el.scrollHeight + 'px';
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onTitleChange?.(id, (e.target as HTMLTextAreaElement).value.trim());
              }
              if (e.key === 'Escape') {
                onTitleChange?.(id, (e.target as HTMLTextAreaElement).value.trim());
              }
            }}
            onBlur={e => onTitleChange?.(id, e.target.value.trim())}
            onClick={e => e.stopPropagation()}
          />
        </div>
      );
    }
    return (
      <div
        data-fragment-id={id}
        className={`fragment fragment--text-note${isSelected ? ' fragment--selected' : ''}`}
        style={widthStyle}
        onMouseDown={onMouseDown}
        onDoubleClick={e => { e.stopPropagation(); onDoubleClick?.(id); }}
      >
        <TextNote fragment={fragment} />
      </div>
    );
  }

  // Full LOD — new two-section card
  const layoutClass = layout === 'quote-centered' ? 'quote' : layout === 'image-hero' ? 'image-hero' : '';

  const handleAddAccordion = onAddAccordion
    ? (fragmentId: string, promptId: string) => onAddAccordion(fragmentId, promptId)
    : () => Promise.resolve();

  return (
    <div
      data-fragment-id={id}
      className={`fragment-wrapper${layoutClass ? ` fragment-wrapper--${layoutClass}` : ''}${selectedClass}`}
      style={widthStyle}
      onMouseDown={onMouseDown}
    >
      <FragmentCard
        fragment={fragment}
        clusters={clusters}
        onDuplicate={() => onDuplicate?.(id)}
        onMoveToCluster={clusterId => onMoveToCluster?.(id, clusterId)}
        onPin={() => onPin?.(id)}
        onDelete={() => onDelete(id)}
      />

      <FragmentAccordions
        fragment={fragment}
        onAddAccordion={handleAddAccordion}
      />

      {onConnectorDotStart && (
        <ConnectorDot
          onDragStart={e => onConnectorDotStart(id, e)}
          dragging={dotDragging}
        />
      )}

      {isPivoting && (
        <div className="fragment__pivot-overlay">
          <Spinner variant="strip" width={120} />
        </div>
      )}
      {pivotError && !isPivoting && (
        <div className="fragment__pivot-error">{pivotError}</div>
      )}

      {/* Pivot action — still accessible via onPivot from context */}
      {onPivot && (
        <div style={{ display: 'none' }} data-pivot-id={id} onClick={() => onPivot(id)} />
      )}

      {isSelected && onResizeStart && (
        <div className="resize-handles">
          {RESIZE_HANDLES.map(handle => (
            <div
              key={handle}
              className={`resize-handle resize-handle--${handle}`}
              onMouseDown={e => { e.stopPropagation(); onResizeStart(handle, e); }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
