import { useEffect, useRef, useState } from 'react';
import '../styles/starting-card.css';

interface Props {
  onSubmit: (query: string) => void;
  onClose: () => void;
}

export default function StartingCard({ onSubmit, onClose }: Props) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'Enter' && !e.shiftKey && !(e.target instanceof HTMLTextAreaElement)) {
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, onClose]);

  const handleSubmit = () => {
    const q = value.trim();
    if (!q) return;
    onSubmit(q);
    onClose();
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleOverlayMouseDown = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <div className="starting-card__overlay" ref={overlayRef} onMouseDown={handleOverlayMouseDown}>
      <div className="starting-card" onMouseDown={e => e.stopPropagation()}>
        <span className="starting-card__label">what do you want to explore?</span>

        <textarea
          ref={textareaRef}
          className="starting-card__textarea"
          placeholder="type a topic, question, or idea…"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleTextareaKeyDown}
          rows={4}
        />

        <div className="starting-card__actions">
          <div className="starting-card__icon-actions">
            <button className="starting-card__icon-btn" data-stub="true" title="Voice input">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="5" y="1" width="6" height="9" rx="3" stroke="currentColor" strokeWidth="1.5" />
                <path d="M2.5 8.5C2.5 11.5 5 14 8 14s5.5-2.5 5.5-5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="8" y1="14" x2="8" y2="15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
            <button className="starting-card__icon-btn" data-stub="true" title="Attach file">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M13.5 8L7.5 14a4 4 0 01-5.657-5.657L7.5 2.686a2.5 2.5 0 013.535 3.535L5.379 11.879a1 1 0 01-1.414-1.414L9.621 4.808" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <button
            className="starting-card__submit"
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
