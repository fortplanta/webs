import { useRef, useEffect, useCallback } from 'react';
import '../styles/panels.css';

interface Props {
  title: string;
  value: string;
  onChange: (text: string) => void;
  onClose: () => void;
}

export default function NotePanel({ title, value, onChange, onClose }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onChange(text), 500);
  }, [onChange]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div className="note-panel" onMouseDown={e => e.stopPropagation()}>
      <div className="note-panel__header">
        <span className="note-panel__label">note</span>
        <button className="note-panel__close" onClick={onClose} aria-label="Close note panel">
          ×
        </button>
      </div>
      <p className="note-panel__title">{title}</p>
      <div className="note-panel__body">
        <textarea
          ref={textareaRef}
          className="note-panel__textarea"
          defaultValue={value}
          onChange={handleChange}
          placeholder="add a note…"
        />
      </div>
    </div>
  );
}
