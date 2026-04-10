import { memo, useState, useRef, useEffect } from 'react';
import { NodeResizer } from '@xyflow/react';

function StickyNode({ data, selected }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(data.text ?? '');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [editing]);

  const exitEdit = () => {
    setEditing(false);
    data.onTextChange?.(text);
  };

  const handleDoubleClick = () => {
    setEditing(true);
  };

  const handleBlur = () => {
    exitEdit();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      exitEdit();
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      exitEdit();
    }
  };

  return (
    <div
      className={`sticky-node${selected ? ' selected' : ''}${editing ? ' editing' : ''}`}
      onDoubleClick={handleDoubleClick}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={160}
        minHeight={80}
        handleStyle={{
          width: 6,
          height: 6,
          background: 'rgba(255,255,255,0.4)',
          border: 'none',
          borderRadius: 1,
        }}
        lineStyle={{
          borderColor: 'rgba(255,255,255,0.15)',
        }}
      />

      {editing ? (
        <textarea
          ref={textareaRef}
          className="sticky-node__textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        />
      ) : (
        <div className={`sticky-node__text${text === '' ? ' placeholder' : ''}`}>
          {text === '' ? 'Double-click to add a note…' : text}
        </div>
      )}

      <button
        className="sticky-node__remove"
        onMouseDown={(e) => {
          e.stopPropagation();
          data.onDelete?.();
        }}
        tabIndex={-1}
        aria-label="Delete sticky note"
      >
        ×
      </button>
    </div>
  );
}

StickyNode.displayName = 'StickyNode';

export default memo(StickyNode);
