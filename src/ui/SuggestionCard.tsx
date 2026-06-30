import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import '../styles/progress.css';

interface Props {
  title: string;
  explanation: string;
  onExplore: (title: string) => void;
  onDismiss: () => void;
}

export default function SuggestionCard({ title, explanation, onExplore, onDismiss }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onDismiss(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onDismiss]);

  const content = (
    <div
      className="suggestion-card-overlay"
      onClick={e => { if (e.target === e.currentTarget) onDismiss(); }}
    >
      <div className="suggestion-card">
        <div className="suggestion-card__eyebrow">based on how you think...</div>
        <div className="suggestion-card__intro">you might want to explore:</div>
        <div className="suggestion-card__title">{title}</div>
        <div className="suggestion-card__explanation">{explanation}</div>
        <div className="suggestion-card__actions">
          <button
            className="suggestion-card__explore"
            onClick={() => onExplore(title)}
          >
            explore →
          </button>
          <button
            className="suggestion-card__dismiss"
            onClick={onDismiss}
          >
            not now
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
