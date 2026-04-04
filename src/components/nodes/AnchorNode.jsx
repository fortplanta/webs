import { memo } from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';

const AnchorNode = memo(({ data, selected }) => {
  const revealedCount = data.contextNodes?.filter(n => n.revealed).length ?? 0;
  const totalCount = data.contextNodes?.length ?? 0;
  const isExpanded = totalCount > 0;
  const isLoading = data.loading ?? false;
  const isStarred = data.starred ?? false;

  return (
    <div
      className={`anchor-node${selected ? ' selected' : ''}${isLoading ? ' loading' : ''}${isStarred ? ' starred' : ''}`}
      onContextMenu={data.onContextMenu}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={180}
        minHeight={80}
        lineStyle={{ borderColor: 'var(--color-accent)', opacity: 0.3 }}
        handleStyle={{
          width: 8, height: 8,
          background: 'var(--color-accent)',
          opacity: 0.5, border: 'none', borderRadius: '2px',
        }}
      />

      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <Handle type="target" position={Position.Top} id="top" />
      <Handle type="source" position={Position.Bottom} id="bottom" />

      <div className="anchor-node__bar" />

      {/* Star badge */}
      <span
        className={`node-star${isStarred ? ' active' : ''}`}
        title={isStarred ? 'Unstar' : 'Star'}
        onClick={e => { e.stopPropagation(); data.onToggleStar?.(); }}
      >
        {isStarred ? '★' : '☆'}
      </span>

      <div className="anchor-node__body">
        <div className="anchor-node__label">Note</div>
        <div className="anchor-node__title">{data.title || 'Untitled'}</div>
        {data.body && (
          <div className="anchor-node__desc">{data.body}</div>
        )}
      </div>

      <div className="anchor-node__footer">
        {isLoading ? (
          <span className="anchor-node__loading-hint">
            <span className="spinner" />
            Expanding…
          </span>
        ) : !isExpanded ? (
          <button
            className="anchor-node__expand"
            onClick={e => { e.stopPropagation(); data.onExpand?.(); }}
          >
            + Expand
          </button>
        ) : (
          <span className="anchor-node__expand" style={{ cursor: 'default', opacity: 0.5 }}>
            Expanded
          </span>
        )}
        {isExpanded && !isLoading && (
          <span className="anchor-node__connections">
            {revealedCount}/{totalCount} revealed
          </span>
        )}
      </div>
    </div>
  );
});

AnchorNode.displayName = 'AnchorNode';
export default AnchorNode;
