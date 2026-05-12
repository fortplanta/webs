import { useEffect, useRef, useState } from 'react';
import '../styles/modal.css';

interface Props {
  onSubmit: (query: string) => void;
  onClose: () => void;
}

export default function ExplorationModal({ onSubmit, onClose }: Props) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Trap focus within modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'Tab') {
        const focusable = overlayRef.current?.querySelectorAll<HTMLElement>(
          'input, button:not(:disabled)'
        );
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSubmit = () => {
    const q = value.trim();
    if (!q) return;
    onSubmit(q);
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <div className="exploration-modal__overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="exploration-modal" role="dialog" aria-modal="true">
        <p className="exploration-modal__label">what do you want to explore?</p>
        <input
          ref={inputRef}
          className="exploration-modal__input"
          type="text"
          placeholder="type a topic…"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
        />
        <div className="exploration-modal__actions">
          <button
            className="exploration-modal__submit"
            onClick={handleSubmit}
            disabled={!value.trim()}
          >
            explore →
          </button>
        </div>
      </div>
    </div>
  );
}
