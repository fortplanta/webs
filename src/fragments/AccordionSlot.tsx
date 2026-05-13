import { useState } from 'react';
import type { AccordionSlot as AccordionSlotType } from '../api/types';
import { getPromptById } from '../prompts/prompts';

interface Props {
  slot: AccordionSlotType;
  defaultOpen?: boolean;
  history?: boolean;
}

export default function AccordionSlot({ slot, defaultOpen = false, history = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const prompt = getPromptById(slot.promptId);

  return (
    <div className={`accordion-slot${open ? ' accordion-slot--open' : ''}${history ? ' accordion-slot--history' : ''}`}>
      <button
        className="accordion-slot__header"
        onMouseDown={e => e.stopPropagation()}
        onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
      >
        <span className="accordion-slot__icon">
          {prompt?.icon ?? <DefaultIcon />}
        </span>
        <span className="accordion-slot__label">{slot.promptLabel}</span>
        <span className="accordion-slot__chevron">▾</span>
      </button>
      {open && (
        <div className="accordion-slot__content">{slot.content}</div>
      )}
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
