import { useEffect, useRef } from 'react';
import './ToolSubmenuGrid.css';

export interface ToolSubtype {
  id: string;
  icon: React.ReactNode;
  label: string;
}

interface ToolSubmenuGridProps {
  items: ToolSubtype[];
  activeId?: string;
  onSelect: (id: string) => void;
  anchorRef: React.RefObject<HTMLElement>;
  onClose?: () => void;
}

export function ToolSubmenuGrid({ items, activeId, onSelect, anchorRef, onClose }: ToolSubmenuGridProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        ref.current &&
        !ref.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose?.();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [anchorRef, onClose]);

  return (
    <div ref={ref} className="tsg" role="menu">
      {items.map(item => (
        <button
          key={item.id}
          className={['tsg__item', item.id === activeId ? 'tsg__item--active' : ''].filter(Boolean).join(' ')}
          role="menuitem"
          onClick={() => { onSelect(item.id); onClose?.(); }}
        >
          <span className="tsg__icon">{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
}
