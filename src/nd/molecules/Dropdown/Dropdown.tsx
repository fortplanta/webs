import { useState, useRef, useEffect } from 'react';
import './Dropdown.css';

export interface DropdownItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
  separator?: boolean;
}

interface DropdownProps {
  trigger: React.ReactElement;
  items: DropdownItem[];
  align?: 'left' | 'right';
  onSelect?: (key: string) => void;
}

export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  items,
  align = 'left',
  onSelect,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setOpen(false);
  };

  return (
    <div ref={ref} className="nd-dropdown" onKeyDown={handleKey}>
      <span onClick={() => setOpen(o => !o)} style={{ display: 'inline-flex' }}>
        {trigger}
      </span>
      {open && (
        <div className={['nd-dropdown__menu', align === 'right' ? 'nd-dropdown__menu--right' : ''].filter(Boolean).join(' ')} role="menu">
          {items.map(item =>
            item.separator ? (
              <div key={item.key} className="nd-dropdown__separator" role="separator" />
            ) : (
              <button
                key={item.key}
                className={['nd-dropdown__item', item.danger ? 'nd-dropdown__item--danger' : ''].filter(Boolean).join(' ')}
                disabled={item.disabled}
                role="menuitem"
                onClick={() => { onSelect?.(item.key); setOpen(false); }}
              >
                {item.icon && <span>{item.icon}</span>}
                {item.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
};
