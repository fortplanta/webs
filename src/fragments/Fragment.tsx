import { useRef, useEffect, useState } from 'react';
import '../styles/fragments.css';
import '../styles/fragment-card.css';
import '../styles/accordion.css';
import '../styles/connector-dot.css';
import '../styles/slots.css';
import { Fragment as FragmentType, SlotType } from '../api/types';
import { LOD } from '../canvas/useCanvas';
import type { ResizeHandle } from '../canvas/useSelection';
import type { Cluster } from '../api/types';
import FragmentCard from './FragmentCard';
import FragmentAccordions from './FragmentAccordions';
import ConnectorDot from './ConnectorDot';
import TextNote from './layouts/TextNote';
import { Spinner } from '../nd/atoms/Spinner/Spinner';
import { FragmentActionsContext } from './FragmentActionsContext';

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
  onAnchor?: (id: string) => void;
  onUnanchor?: (id: string) => void;
  onResetPositions?: () => void;
  onMoveToCluster?: (fragmentId: string, clusterId: string) => void;
  onAddAccordion?: (fragmentId: string, promptId: string) => Promise<void>;
  onConnectorDotStart?: (fragmentId: string, e: React.MouseEvent) => void;
  onPromptDrop?: (fragmentId: string, promptId: string) => void;
  onNavigateSlotHistory?: (fragmentId: string, slotType: SlotType, direction: 'back' | 'forward') => void;
  onEmptySlotDblClick?: (fragmentId: string, slotType: SlotType, x: number, y: number) => void;
  isPivoting?: boolean;
  pivotDisabled?: boolean;
  pivotError?: string | null;
  isSelected?: boolean;
  isEditing?: boolean;
  onTitleChange?: (id: string, title: string) => void;
  onDoubleClick?: (id: string) => void;
  onResizeStart?: (handle: ResizeHandle, e: React.MouseEvent) => void;
  dotDragging?: boolean;
  isRunningPrompt?: boolean;
  isHighlighted?: boolean;
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
  onAnchor,
  onUnanchor,
  onResetPositions,
  onMoveToCluster,
  onAddAccordion,
  onConnectorDotStart,
  onPromptDrop,
  onNavigateSlotHistory,
  onEmptySlotDblClick,
  isPivoting,
  pivotDisabled: _pivotDisabled,
  pivotError,
  isSelected,
  isEditing,
  onTitleChange,
  onDoubleClick,
  onResizeStart,
  dotDragging,
  isRunningPrompt,
  isHighlighted,
  style,
}: FragmentProps) {
  const { id, layout, width } = fragment;
  const bgVar = `var(--color-fragment-${fragment.type}-bg)`;
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
    }
  }, [isEditing]);

  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const selectedClass = isSelected ? ' fragment-wrapper--selected' : '';
  const highlightClass = isHighlighted ? ' fragment-wrapper--timeline-highlight' : '';
  const draggingClass = isDragging ? ' fragment-wrapper--dragging' : '';
  const widthStyle = width ? { ...style, width } : style;

  const contextValue = {
    fragmentId: id,
    navigateSlotHistory: (slotType: SlotType, direction: 'back' | 'forward') => {
      onNavigateSlotHistory?.(id, slotType, direction);
    },
    openCommandMenu: (slotType: SlotType, x: number, y: number) => {
      onEmptySlotDblClick?.(id, slotType, x, y);
    },
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('text/prompt-id') || e.dataTransfer.types.includes('promptid')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const promptId = e.dataTransfer.getData('text/prompt-id') || e.dataTransfer.getData('promptId');
    if (promptId && onPromptDrop && !isRunningPrompt) {
      onPromptDrop(id, promptId);
    }
  };

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

  // Full LOD — Session 18 two-section card
  const layoutClass = layout === 'quote-centered' ? 'quote' : layout === 'image-hero' ? 'image-hero' : '';

  const handleAddAccordion = onAddAccordion
    ? (fragmentId: string, promptId: string) => onAddAccordion(fragmentId, promptId)
    : () => Promise.resolve();

  const frameStripProps = fragment.anchored ? {} : {
    onMouseDown: (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      setIsDragging(true);
      onMouseDown(e);
    },
  };

  return (
    <FragmentActionsContext.Provider value={contextValue}>
      <div
        data-fragment-id={id}
        data-draggable={fragment.anchored ? undefined : 'true'}
        data-anchored={fragment.anchored ? 'true' : undefined}
        className={`fragment-wrapper${layoutClass ? ` fragment-wrapper--${layoutClass}` : ''}${selectedClass}${highlightClass}${draggingClass}${isDragOver ? ' fragment-wrapper--drag-over' : ''}`}
        style={widthStyle}
        onMouseDown={!fragment.anchored ? (e: React.MouseEvent) => {
          e.stopPropagation();
          if (!e.altKey) {
            setIsDragging(true);
            onMouseDown(e);
          }
        } : undefined}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {!fragment.anchored && (
          <div className="fragment-drag-frame" aria-hidden="true">
            <div className="fragment-drag-frame__top" {...frameStripProps} />
            <div className="fragment-drag-frame__bottom" {...frameStripProps} />
            <div className="fragment-drag-frame__left" {...frameStripProps} />
            <div className="fragment-drag-frame__right" {...frameStripProps} />
          </div>
        )}
        <div className="fragment-card-inner">
          {fragment.anchored && (
            <div className="fragment__anchor-indicator" title="Anchored to cluster">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <rect x="2" y="5" width="8" height="6" rx="1" fill="currentColor" opacity="0.5"/>
                <path d="M4 5V3.5a2 2 0 0 1 4 0V5" stroke="currentColor" strokeWidth="1.2" opacity="0.5"/>
              </svg>
            </div>
          )}
          <FragmentCard
            fragment={fragment}
            clusters={clusters}
            onDuplicate={() => onDuplicate?.(id)}
            onMoveToCluster={clusterId => onMoveToCluster?.(id, clusterId)}
            onPin={() => onPin?.(id)}
            onDelete={() => onDelete(id)}
            onAnchor={onAnchor ? () => onAnchor(id) : undefined}
            onUnanchor={onUnanchor ? () => onUnanchor(id) : undefined}
            onResetPositions={onResetPositions}
          />

          <FragmentAccordions
            fragment={fragment}
            onAddAccordion={handleAddAccordion}
          />
        </div>

        {onConnectorDotStart && (
          <ConnectorDot
            onDragStart={e => onConnectorDotStart(id, e)}
            dragging={dotDragging}
          />
        )}

        {(isPivoting || isRunningPrompt) && (
          <div className="fragment__pivot-overlay">
            <Spinner variant="strip" width={120} />
          </div>
        )}
        {pivotError && !isPivoting && (
          <div className="fragment__pivot-error">{pivotError}</div>
        )}

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
    </FragmentActionsContext.Provider>
  );
}
