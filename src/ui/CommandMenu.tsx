import { useEffect, useRef } from 'react';
import { PROMPTS, PromptDefinition } from '../prompts/prompts';
import { SlotType } from '../api/types';
import '../styles/command-menu.css';

export interface CommandMenuTarget {
  fragmentId: string;
  slotType: SlotType;
  x: number;
  y: number;
}

interface CommandMenuProps {
  target: CommandMenuTarget;
  onSelect: (fragmentId: string, slotType: SlotType, prompt: PromptDefinition) => void;
  onClose: () => void;
}

export default function CommandMenu({ target, onSelect, onClose }: CommandMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('mousedown', handler);
    window.addEventListener('keydown', keyHandler);
    return () => {
      window.removeEventListener('mousedown', handler);
      window.removeEventListener('keydown', keyHandler);
    };
  }, [onClose]);

  // Adjust position to stay in viewport
  const menuWidth = 280;
  const menuHeight = 320;
  const x = Math.min(target.x, window.innerWidth - menuWidth - 8);
  const y = Math.min(target.y, window.innerHeight - menuHeight - 8);

  const eligible = PROMPTS.filter(p => p.allowedOutputSlots.includes(target.slotType));
  const all = eligible.length > 0 ? eligible : PROMPTS;

  return (
    <div
      ref={menuRef}
      className="command-menu"
      style={{ left: x, top: y }}
      onMouseDown={e => e.stopPropagation()}
    >
      {all.map(prompt => (
        <button
          key={prompt.id}
          className="command-menu__item"
          onClick={() => {
            const outSlot = prompt.allowedOutputSlots.includes(target.slotType)
              ? target.slotType
              : prompt.allowedOutputSlots[0];
            onSelect(target.fragmentId, outSlot, prompt);
            onClose();
          }}
        >
          <span className="command-menu__icon">{prompt.icon}</span>
          <span className="command-menu__text">
            <span className="command-menu__label">{prompt.label}</span>
            <span className="command-menu__desc">{prompt.description}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
