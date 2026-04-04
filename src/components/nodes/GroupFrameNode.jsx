import { memo } from 'react';

const GroupFrameNode = memo(({ data }) => {
  return (
    <div className="group-frame">
      <span className="group-frame__label" title={data.label}>
        {data.label}
      </span>
      <button
        className="group-frame__collapse-btn"
        onClick={e => { e.stopPropagation(); data.onToggleCollapse?.(); }}
      >
        {data.collapsed ? 'Expand' : 'Collapse'}
      </button>
    </div>
  );
});

GroupFrameNode.displayName = 'GroupFrameNode';
export default GroupFrameNode;
