import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

/**
 * Renders text with hoverable tooltips for technical terms and hard words.
 * termMap: { "term": "definition" }
 */
export default function SmartText({ text, termMap = {} }) {
  const [tooltip, setTooltip] = useState(null); // { term, def, x, y }

  const handleEnter = useCallback((e, term, def) => {
    const rect = e.target.getBoundingClientRect();
    const x = Math.min(rect.left, window.innerWidth - 300);
    const y = rect.bottom + 6;
    setTooltip({ term, def, x, y });
  }, []);

  const handleLeave = useCallback(() => setTooltip(null), []);

  if (!text) return null;

  // Sort terms longest-first to avoid partial matches overriding longer ones
  const terms = Object.keys(termMap).sort((a, b) => b.length - a.length);
  if (terms.length === 0) return <>{text}</>;

  // Build regex that matches any term (case-insensitive)
  const escaped = terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) => {
        const matchedTerm = terms.find(t => t.toLowerCase() === part.toLowerCase());
        if (matchedTerm) {
          return (
            <span
              key={i}
              className="smart-term"
              onMouseEnter={e => handleEnter(e, matchedTerm, termMap[matchedTerm])}
              onMouseLeave={handleLeave}
            >
              {part}
            </span>
          );
        }
        return part;
      })}

      {tooltip && createPortal(
        <div
          className="smart-tooltip"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <div className="smart-tooltip__term">{tooltip.term}</div>
          <div className="smart-tooltip__def">{tooltip.def}</div>
        </div>,
        document.body
      )}
    </>
  );
}
