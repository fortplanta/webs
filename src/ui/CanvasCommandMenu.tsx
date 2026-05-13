import { useState, useEffect, useRef } from 'react';
import type { FragmentType } from '../api/types';
import '../styles/command-menu.css';

const FRAGMENT_TYPES: FragmentType[] = [
  'concept', 'person', 'thesis', 'source', 'event', 'era', 'domain', 'quote',
];

const TYPE_COLORS: Record<string, string> = {
  person:  'var(--color-fragment-person-bg)',
  concept: 'var(--color-fragment-concept-bg)',
  thesis:  'var(--color-fragment-thesis-bg)',
  source:  'var(--color-fragment-source-bg)',
  event:   'var(--color-fragment-event-bg)',
  era:     'var(--color-fragment-era-bg)',
  domain:  'var(--color-fragment-domain-bg)',
  quote:   'var(--color-fragment-quote-bg)',
};

interface Props {
  x: number;
  y: number;
  sourceFragmentId: string;
  onCreateFragment: (type: FragmentType, x: number, y: number) => void;
  onCreateTextNote: (x: number, y: number) => void;
  onPivot: (fragmentId: string) => void;
  onCreateCluster: (x: number, y: number) => void;
  onClose: () => void;
}

export default function CanvasCommandMenu({
  x, y,
  sourceFragmentId,
  onCreateFragment,
  onCreateTextNote,
  onPivot,
  onCreateCluster,
  onClose,
}: Props) {
  const [showTypePicker, setShowTypePicker] = useState(false);
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
      className="canvas-command-menu"
      style={{ left: x, top: y }}
      onMouseDown={e => e.stopPropagation()}
    >
      <div style={{ position: 'relative' }}>
        <button
          className="canvas-command-menu__item"
          onMouseEnter={() => setShowTypePicker(true)}
          onMouseLeave={() => setShowTypePicker(false)}
        >
          <span className="canvas-command-menu__item-icon">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" width={16} height={16}>
              <circle cx={8} cy={8} r={6} />
              <path d="M8 5v6M5 8h6" />
            </svg>
          </span>
          Create fragment here ›
        </button>
        {showTypePicker && (
          <div
            className="fragment-type-picker"
            onMouseEnter={() => setShowTypePicker(true)}
            onMouseLeave={() => setShowTypePicker(false)}
          >
            {FRAGMENT_TYPES.map(type => (
              <button
                key={type}
                className="fragment-type-picker__item"
                onClick={() => { onCreateFragment(type, x, y); onClose(); }}
              >
                <span className="fragment-type-picker__dot" style={{ background: TYPE_COLORS[type] }} />
                {type}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        className="canvas-command-menu__item"
        onClick={() => { onCreateTextNote(x, y); onClose(); }}
      >
        <span className="canvas-command-menu__item-icon">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" width={16} height={16}>
            <rect x={2} y={3} width={12} height={10} rx={1} />
            <path d="M5 7h6M5 10h4" />
          </svg>
        </span>
        Create text note
      </button>

      <button
        className="canvas-command-menu__item"
        onClick={() => { onPivot(sourceFragmentId); onClose(); }}
      >
        <span className="canvas-command-menu__item-icon">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" width={16} height={16}>
            <path d="M2 8h12M10 4l4 4-4 4" />
          </svg>
        </span>
        Pivot from this fragment
      </button>

      <button
        className="canvas-command-menu__item"
        onClick={() => { onCreateCluster(x, y); onClose(); }}
      >
        <span className="canvas-command-menu__item-icon">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" width={16} height={16}>
            <circle cx={8} cy={8} r={3} />
            <circle cx={8} cy={3} r={1.5} />
            <circle cx={13} cy={11} r={1.5} />
            <circle cx={3} cy={11} r={1.5} />
          </svg>
        </span>
        Create cluster here
      </button>
    </div>
  );
}
