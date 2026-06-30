import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { Fragment } from '../api/types';
import '../styles/connections.css';

interface Props {
  sourceFragment: Fragment;
  targetFragment: Fragment;
  screenX: number;
  screenY: number;
  isEvaluating: boolean;
  onSubmitExplanation: (explanation: string) => void;
  onFindConnection: () => void;
  onCancel: () => void;
}

export default function ConnectionValidator({
  sourceFragment,
  targetFragment,
  screenX,
  screenY,
  isEvaluating,
  onSubmitExplanation,
  onFindConnection,
  onCancel,
}: Props) {
  const [explanation, setExplanation] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCancel]);

  // Position the panel — clamp to viewport
  const panelWidth  = 320;
  const panelHeight = 220; // approx
  const left = Math.min(Math.max(screenX - panelWidth / 2, 12), window.innerWidth  - panelWidth  - 12);
  const top  = Math.min(Math.max(screenY - panelHeight / 2, 12), window.innerHeight - panelHeight - 12);

  const handleSubmit = () => {
    const trimmed = explanation.trim();
    if (trimmed) onSubmitExplanation(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const content = (
    <div
      className="connection-validator"
      style={{ left, top }}
      onMouseDown={e => e.stopPropagation()}
    >
      {isEvaluating ? (
        <div className="connection-validator__loading">
          <span className="connection-validator__spinner" />
          evaluating...
        </div>
      ) : (
        <>
          <div className="connection-validator__eyebrow">unexpected connection</div>
          <div className="connection-validator__prompt">
            what's the link between <strong>{sourceFragment.title}</strong> and <strong>{targetFragment.title}</strong>?
          </div>
          <textarea
            ref={textareaRef}
            className="connection-validator__textarea"
            placeholder="explain why these connect..."
            value={explanation}
            onChange={e => setExplanation(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="connection-validator__actions">
            <button
              className="connection-validator__submit"
              onClick={handleSubmit}
              disabled={!explanation.trim()}
            >
              validate
            </button>
            <button
              className="connection-validator__find"
              onClick={onFindConnection}
            >
              find the connection
            </button>
          </div>
        </>
      )}
    </div>
  );

  return createPortal(content, document.body);
}
