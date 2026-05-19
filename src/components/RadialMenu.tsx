import { useEffect, useRef, useState } from 'react';
import './RadialMenu.css';

export interface RadialMenuItem {
  id: string;
  icon: React.ReactNode;
  label: string;
}

interface RadialMenuProps {
  items: RadialMenuItem[];
  activeId: string;
  position: { x: number; y: number };
  onSelect: (id: string) => void;
  onClose: () => void;
}

const RADIUS = 88;
const DEADZONE = 28;

function getItemPosition(index: number, total: number, radius: number) {
  const angle = (2 * Math.PI * index) / total - Math.PI / 2;
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
}

function getPointedIndex(mx: number, my: number, cx: number, cy: number, total: number): number | null {
  const dx = mx - cx;
  const dy = my - cy;
  if (Math.sqrt(dx * dx + dy * dy) < DEADZONE) return null;
  const angle = Math.atan2(dy, dx);
  const normalized = ((angle + Math.PI / 2) + 2 * Math.PI) % (2 * Math.PI);
  return Math.round(normalized / ((2 * Math.PI) / total)) % total;
}

export function RadialMenu({ items, activeId, position, onSelect, onClose }: RadialMenuProps) {
  const [pointedId, setPointedId] = useState<string | null>(null);
  const pointedRef = useRef<string | null>(null);
  pointedRef.current = pointedId;

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const idx = getPointedIndex(e.clientX, e.clientY, position.x, position.y, items.length);
      setPointedId(idx !== null ? items[idx].id : null);
    };

    const onUp = () => {
      if (pointedRef.current) onSelect(pointedRef.current);
      onClose();
    };

    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('keydown', onKey);
    };
  }, [items, position, onSelect, onClose]);

  const displayLabel = items.find(i => i.id === (pointedId ?? activeId))?.label ?? '';

  return (
    <div className="rm" style={{ left: position.x, top: position.y }}>
      <div className="rm__center-label">
        <span className={['rm__center-text', displayLabel ? 'rm__center-text--visible' : ''].filter(Boolean).join(' ')}>
          {displayLabel}
        </span>
      </div>

      {items.map((item, i) => {
        const { x, y } = getItemPosition(i, items.length, RADIUS);
        const isPointed = item.id === pointedId;
        const isActive = item.id === activeId;
        return (
          <div key={item.id} className="rm__item" style={{ left: x, top: y }}>
            <button
              className={[
                'rm__btn',
                isPointed ? 'rm__btn--pointed' : '',
                isActive && !isPointed ? 'rm__btn--active' : '',
              ].filter(Boolean).join(' ')}
              aria-label={item.label}
              aria-pressed={isActive}
              tabIndex={-1}
            >
              {item.icon}
            </button>
          </div>
        );
      })}
    </div>
  );
}
