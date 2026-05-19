import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '../nd/atoms/Input/Input';
import './UnifiedContextMenu.css';

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  variant?: 'default' | 'destructive';
  disabled?: boolean;
  description?: string;
  submenu?: ContextMenuItem[];
  onClick?: () => void;
}

interface UnifiedContextMenuProps {
  items: ContextMenuItem[];
  position: { x: number; y: number };
  onClose: () => void;
}

function MenuList({
  items,
  onClose,
  searchable,
}: {
  items: ContextMenuItem[];
  onClose: () => void;
  searchable: boolean;
}) {
  const [query, setQuery] = useState('');
  const [focusIndex, setFocusIndex] = useState(0);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);

  const filtered = query
    ? items.filter(i => i.label.toLowerCase().includes(query.toLowerCase()))
    : items;

  // Insert dividers before destructive items
  const withDividers: Array<ContextMenuItem | { _divider: true; id: string }> = [];
  let prevWasDestructive = false;
  filtered.forEach(item => {
    const isDestructive = item.variant === 'destructive';
    if (isDestructive && !prevWasDestructive && withDividers.length > 0) {
      withDividers.push({ _divider: true, id: `div-${item.id}` });
    }
    withDividers.push(item);
    prevWasDestructive = isDestructive;
  });

  const flatItems = filtered.filter(i => !i.disabled);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusIndex(i => Math.min(i + 1, flatItems.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusIndex(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const item = flatItems[focusIndex];
        if (item?.onClick) { item.onClick(); onClose(); }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    },
    [flatItems, focusIndex, onClose]
  );

  let flatIdx = -1;

  return (
    <div onKeyDown={handleKeyDown}>
      {searchable && (
        <div className="ucm__search">
          <Input
            placeholder="search…"
            size="sm"
            value={query}
            onChange={e => { setQuery(e.target.value); setFocusIndex(0); }}
          />
        </div>
      )}
      <ul className="ucm__list" role="menu">
        {withDividers.map(entry => {
          if ('_divider' in entry) {
            return <li key={entry.id} className="ucm__divider" role="separator" />;
          }
          const item = entry as ContextMenuItem;
          const isDestructive = item.variant === 'destructive';
          if (!item.disabled) flatIdx++;
          const isFocused = flatIdx === focusIndex;

          return (
            <li
              key={item.id}
              className="ucm__item"
              role="none"
              onMouseEnter={() => {
                if (!item.disabled) {
                  setFocusIndex(flatIdx);
                  setActiveSubmenu(item.submenu ? item.id : null);
                }
              }}
              onMouseLeave={() => {
                if (!item.submenu) setActiveSubmenu(null);
              }}
            >
              <button
                className={[
                  'ucm__btn',
                  isDestructive ? 'ucm__btn--destructive' : '',
                  isFocused ? 'ucm__btn--focused' : '',
                ].filter(Boolean).join(' ')}
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  if (item.submenu) return;
                  item.onClick?.();
                  onClose();
                }}
              >
                {item.icon && <span className="ucm__icon">{item.icon}</span>}
                <span className="ucm__label">
                  {item.label}
                  {item.description && (
                    <span className="ucm__description">{item.description}</span>
                  )}
                </span>
                {item.shortcut && <span className="ucm__shortcut">{item.shortcut}</span>}
                {item.submenu && <span className="ucm__arrow">▶</span>}
              </button>

              {/* Submenu outside button — anchored to li */}
              {item.submenu && activeSubmenu === item.id && (
                <div className="ucm__submenu" role="menu">
                  <MenuList items={item.submenu} onClose={onClose} searchable={false} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function UnifiedContextMenu({ items, position, onClose }: UnifiedContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', keyHandler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', keyHandler);
    };
  }, [onClose]);

  // Clamp to viewport
  const style: React.CSSProperties = {
    left: Math.min(position.x, window.innerWidth - 290),
    top: Math.min(position.y, window.innerHeight - 400),
  };

  return (
    <div ref={ref} className="ucm" style={style} role="menu">
      <MenuList items={items} onClose={onClose} searchable={items.length > 6} />
    </div>
  );
}
