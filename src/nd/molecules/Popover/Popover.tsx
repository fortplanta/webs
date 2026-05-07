import { useState, useRef, useEffect } from 'react';
import './Popover.css';

interface PopoverProps {
  trigger: React.ReactElement;
  content: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

export const Popover: React.FC<PopoverProps> = ({
  trigger,
  content,
  placement = 'bottom',
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

  return (
    <div ref={ref} className="nd-popover-wrap">
      <span onClick={() => setOpen(o => !o)} style={{ display: 'inline-flex' }}>
        {trigger}
      </span>
      {open && (
        <div className={`nd-popover nd-popover--${placement}`}>
          {content}
        </div>
      )}
    </div>
  );
};
