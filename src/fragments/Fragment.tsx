import { useRef, useEffect, useState } from 'react';
import '../styles/fragments.css';
import '../styles/slots.css';
import { Fragment as FragmentType, LayoutType, SlotType } from '../api/types';
import { LOD } from '../canvas/useCanvas';
import type { ResizeHandle } from '../canvas/useSelection';
import FragmentHeader from './FragmentHeader';
import VerticalFlow from './layouts/VerticalFlow';
import QuoteCentered from './layouts/QuoteCentered';
import ImageHero from './layouts/ImageHero';
import CardSplit from './layouts/CardSplit';
import Timeline from './layouts/Timeline';
import ListProminent from './layouts/ListProminent';
import TextNote from './layouts/TextNote';
import EmptySlot from './slots/EmptySlot';
import { Icon } from '../nd/atoms/Icon/Icon';
import { Spinner } from '../nd/atoms/Spinner/Spinner';
import { FragmentActionsContext } from './FragmentActionsContext';

const LAYOUT_COMPONENTS: Record<LayoutType, React.ComponentType<{ fragment: FragmentType }>> = {
  'vertical-flow':  VerticalFlow,
  'image-hero':     ImageHero,
  'quote-centered': QuoteCentered,
  'card-split':     CardSplit,
  'timeline':       Timeline,
  'list-prominent': ListProminent,
  'text-note':      TextNote,
};

const RESIZE_HANDLES: ResizeHandle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

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
  isSelected?: boolean;
  isEditing?: boolean;
  onTitleChange?: (id: string, title: string) => void;
  onDoubleClick?: (id: string) => void;
  onResizeStart?: (handle: ResizeHandle, e: React.MouseEvent) => void;
  onPromptDrop?: (fragmentId: string, promptId: string) => void;
  onNavigateSlotHistory?: (fragmentId: string, slotType: SlotType, direction: 'back' | 'forward') => void;
  onEmptySlotDblClick?: (fragmentId: string, slotType: SlotType, x: number, y: number) => void;
  isRunningPrompt?: boolean;
  isHighlighted?: boolean;
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
  isSelected,
  isEditing,
  onTitleChange,
  onDoubleClick,
  onResizeStart,
  onPromptDrop,
  onNavigateSlotHistory,
  onEmptySlotDblClick,
  isRunningPrompt,
  isHighlighted,
  style,
}: FragmentProps) {
  const { id, type, layout, title, starred, width } = fragment;
  const bgVar = `var(--color-fragment-${type}-bg)`;
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
      // Auto-size to content on mount
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
    }
  }, [isEditing]);

  const selectedClass = isSelected ? ' fragment--selected' : '';
  const dragOverClass = isDragOver ? ' fragment--drag-over' : '';
  const highlightClass = isHighlighted ? ' fragment--timeline-highlight' : '';
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
    // dataTransfer.types are lowercased by the browser
    if (e.dataTransfer.types.includes('promptid') || e.dataTransfer.types.includes('text/plain')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const promptId = e.dataTransfer.getData('promptId');
    if (promptId && onPromptDrop && !isRunningPrompt) {
      onPromptDrop(id, promptId);
    }
  };

  if (lod === 'compact') {
    return (
      <div
        data-fragment-id={id}
        className={`fragment fragment--compact${selectedClass}`}
        style={{ background: bgVar, ...widthStyle }}
        onMouseDown={onMouseDown}
      />
    );
  }

  if (lod === 'macro') {
    return (
      <div
        data-fragment-id={id}
        className={`fragment fragment--macro${selectedClass}`}
        style={{ background: bgVar, ...widthStyle }}
        onMouseDown={onMouseDown}
      />
    );
  }

  const emptySlots = fragment.emptySlots ?? [];

  const isTextNote = layout === 'text-note';
  const isQuote = layout === 'quote-centered';
  const isImageHero = layout === 'image-hero';
  const pivotButtonDisabled = isPivoting || pivotDisabled;
  const LayoutComponent = LAYOUT_COMPONENTS[layout];

  // Text note in edit mode
  if (isTextNote && isEditing) {
    return (
      <div
        data-fragment-id={id}
        className={`fragment fragment--text-note${selectedClass}`}
        style={widthStyle}
        onMouseDown={onMouseDown}
      >
        <textarea
          ref={inputRef}
          className="text-note__input"
          defaultValue={title}
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
    <FragmentActionsContext.Provider value={contextValue}>
      <div
        data-fragment-id={id}
        className={`fragment fragment--${layout}${selectedClass}${dragOverClass}${highlightClass}`}
        style={widthStyle}
        onMouseDown={onMouseDown}
        onDoubleClick={isTextNote ? (e => { e.stopPropagation(); onDoubleClick?.(id); }) : undefined}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {!isQuote && !isTextNote && (
          <FragmentHeader type={type} title={title} small={isImageHero} />
        )}
        <div className="fragment__card-body" style={{ position: 'relative' }}>
          <LayoutComponent fragment={fragment} />
          {emptySlots.map(slotType => (
            <EmptySlot key={slotType} slotType={slotType} />
          ))}
          {isPivoting && (
            <div className="fragment__pivot-overlay">
              <Spinner variant="strip" width={120} />
            </div>
          )}
          {isRunningPrompt && (
            <div className="fragment__prompt-overlay">
              <Spinner variant="strip" width={120} />
            </div>
          )}
          {pivotError && !isPivoting && (
            <div className="fragment__pivot-error">{pivotError}</div>
          )}
        </div>
        {!isTextNote && (
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
        )}

        {/* Resize handles — shown when selected at full LOD */}
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
