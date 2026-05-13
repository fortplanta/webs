import { useEffect } from 'react';
import '../styles/accordion-modal.css';
import type { AccordionSlot } from '../api/types';
import { getPromptById } from '../prompts/prompts';

interface Props {
  slot: AccordionSlot;
  onClose: () => void;
}

export default function AccordionModal({ slot, onClose }: Props) {
  const prompt = getPromptById(slot.promptId);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      className="accordion-modal__overlay"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="accordion-modal"
        onMouseDown={e => e.stopPropagation()}
        onClick={e => e.stopPropagation()}
      >
        <div className="accordion-modal__header">
          <span className="accordion-modal__icon">
            {prompt?.icon ?? <DefaultIcon />}
          </span>
          <span className="accordion-modal__title">{slot.promptLabel}</span>
          <button className="accordion-modal__close" onClick={onClose}>✕</button>
        </div>
        <div className="accordion-modal__content">
          {slot.content}
        </div>
      </div>
    </div>
  );
}

function DefaultIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" width={16} height={16}>
      <circle cx={8} cy={8} r={5} />
    </svg>
  );
}
