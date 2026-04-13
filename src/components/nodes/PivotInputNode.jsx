import { memo, useState, useRef, useEffect } from 'react';

const PivotInputNode = memo(({ data }) => {
  const [topic, setTopic] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    // Small delay so React Flow finishes positioning before we steal focus
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, []);

  function handleSubmit() {
    if (!topic.trim()) return;
    data.onCommit?.(topic.trim());
  }

  function handleKeyDown(e) {
    // Prevent ReactFlow from intercepting Delete / Backspace etc.
    e.stopPropagation();
    if (e.key === 'Enter') { e.preventDefault(); handleSubmit(); }
    if (e.key === 'Escape') { data.onCancel?.(); }
  }

  return (
    <div className="pivot-input-card">
      <div className="pivot-input-card__tag">Pivot idea</div>
      <input
        ref={inputRef}
        className="pivot-input-card__input"
        placeholder="New topic…"
        value={topic}
        onChange={e => setTopic(e.target.value)}
        onKeyDown={handleKeyDown}
        // Prevent drag-to-pan from activating inside the input
        onPointerDown={e => e.stopPropagation()}
        onMouseDown={e => e.stopPropagation()}
      />
      <div className="pivot-input-card__hint">Enter to confirm · Esc to cancel</div>
    </div>
  );
});

PivotInputNode.displayName = 'PivotInputNode';
export default PivotInputNode;
