import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './CommandPalette.css';
import { Icon } from '../../atoms/Icon/Icon';
import type { icons } from 'lucide-react';

export interface CommandItem {
  key: string;
  label: string;
  hint?: string;
  icon?: keyof typeof icons;
  onSelect: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  items: CommandItem[];
  placeholder?: string;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  open,
  items,
  placeholder = 'search commands…',
  onClose,
}) => {
  const [query, setQuery] = useState('');
  const [focusIdx, setFocusIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = query
    ? items.filter(i => i.label.toLowerCase().includes(query.toLowerCase()))
    : items;

  useEffect(() => {
    if (open) { setQuery(''); setFocusIdx(0); setTimeout(() => inputRef.current?.focus(), 0); }
  }, [open]);

  useEffect(() => { setFocusIdx(0); }, [query]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setFocusIdx(i => Math.min(i + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setFocusIdx(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && filtered[focusIdx]) { filtered[focusIdx].onSelect(); onClose(); }
  };

  if (!open) return null;

  return createPortal(
    <div
      className="nd-command-backdrop"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="nd-command" role="dialog" aria-label="command palette" onKeyDown={handleKey}>
        <div className="nd-command__input-row">
          <Icon name="Search" size={16} color="muted" />
          <input
            ref={inputRef}
            className="nd-command__input"
            placeholder={placeholder}
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
        <div className="nd-command__results" role="listbox">
          {filtered.length === 0 ? (
            <div className="nd-command__empty">no results</div>
          ) : (
            filtered.map((item, idx) => (
              <button
                key={item.key}
                className={['nd-command__item', idx === focusIdx ? 'nd-command__item--focused' : ''].filter(Boolean).join(' ')}
                role="option"
                aria-selected={idx === focusIdx}
                onClick={() => { item.onSelect(); onClose(); }}
              >
                {item.icon && <Icon name={item.icon} size={14} color="muted" />}
                <span className="nd-command__item-label">{item.label}</span>
                {item.hint && <span className="nd-command__item-hint">{item.hint}</span>}
              </button>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};
