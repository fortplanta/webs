import { useState } from 'react';
import type { Fragment, AccordionSlot as AccordionSlotType } from '../api/types';
import AccordionSlotComponent from './AccordionSlot';

const MAX_VISIBLE = 3;

interface Props {
  fragment: Fragment;
  onAddAccordion: (fragmentId: string, promptId: string) => Promise<void>;
}

export default function FragmentAccordions({ fragment, onAddAccordion }: Props) {
  const accordions = fragment.accordions ?? [];
  const [historyOpen, setHistoryOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);

  const visible = accordions.slice(0, MAX_VISIBLE);
  const older = accordions.slice(MAX_VISIBLE);

  const handleDragOver = (e: React.DragEvent) => {
    const promptId = e.dataTransfer.types.includes('text/prompt-id');
    if (!promptId) return;
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const promptId = e.dataTransfer.getData('text/prompt-id');
    if (!promptId) return;
    setLoading(true);
    try {
      await onAddAccordion(fragment.id, promptId);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fragment-accordions" onMouseDown={e => e.stopPropagation()}>
      {visible.map((slot, i) => (
        <AccordionSlotComponent
          key={slot.id}
          slot={slot}
          defaultOpen={i === 0}
        />
      ))}

      {older.length > 0 && (
        <HistorySlot slots={older} open={historyOpen} onToggle={() => setHistoryOpen(v => !v)} />
      )}

      <div
        className={`accordion-drop-target${dragOver ? ' accordion-drop-target--drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {loading ? (
          <div className="accordion-drop-target__loading">
            <span>generating…</span>
          </div>
        ) : (
          '+ drop a prompt here'
        )}
      </div>
    </div>
  );
}

function HistorySlot({ slots, open, onToggle }: { slots: AccordionSlotType[]; open: boolean; onToggle: () => void }) {
  return (
    <div className={`accordion-slot accordion-slot--history${open ? ' accordion-slot--open' : ''}`}>
      <button
        className="accordion-slot__header"
        onMouseDown={e => e.stopPropagation()}
        onClick={e => { e.stopPropagation(); onToggle(); }}
      >
        <span className="accordion-slot__icon">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" width={16} height={16}>
            <circle cx={8} cy={8} r={6} />
            <path d="M8 5v3l2 2" />
          </svg>
        </span>
        <span className="accordion-slot__label">{slots.length} more</span>
        <span className="accordion-slot__chevron">▾</span>
      </button>
      {open && (
        <div className="accordion-slot__history-list">
          {slots.map(slot => (
            <div key={slot.id} className="accordion-slot__history-item">
              <span className="accordion-slot__history-label">{slot.promptLabel}</span>
              <span className="accordion-slot__history-time">{relTime(slot.createdAt)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function relTime(ms: number): string {
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}
