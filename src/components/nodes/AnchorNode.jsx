import { memo } from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';

const AnchorNode = memo(({ data, selected }) => {
  const revealedCount = data.contextNodes?.filter(n => n.revealed).length ?? 0;
  const totalCount    = data.contextNodes?.length ?? 0;
  const isExpanded    = totalCount > 0;
  const isLoading     = data.loading  ?? false;
  const isStarred     = data.starred  ?? false;

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
        handleStyle={{ width: 6, height: 6, background: 'var(--color-accent)', opacity: 0.5, border: 'none', borderRadius: '1px' }}
      />

      {/* Handles on all 4 sides */}
      <Handle type="target" position={Position.Left}   id="left"   />
      <Handle type="source" position={Position.Right}  id="right"  />
      <Handle type="target" position={Position.Top}    id="top"    />
      <Handle type="source" position={Position.Bottom} id="bottom" />

      <div className="anchor-node__bar" />

      {/* Star — stops ALL events to prevent ReactFlow drag interception */}
      <span
        role="button"
        tabIndex={0}
        className={`node-star${isStarred ? ' active' : ''}`}
        title={isStarred ? 'unstar' : 'star'}
        onPointerDown={e => { e.stopPropagation(); e.nativeEvent?.stopImmediatePropagation?.(); }}
        onMouseDown={e => { e.stopPropagation(); e.nativeEvent?.stopImmediatePropagation?.(); }}
        onClick={e => { e.stopPropagation(); e.nativeEvent?.stopImmediatePropagation?.(); data.onToggleStar?.(); }}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); data.onToggleStar?.(); } }}
      >
        {isStarred ? '★' : '☆'}
      </span>

      <div className="anchor-node__body">
        {data.nodeImage && (
          <div className="node-image-banner">
            <img src={data.nodeImage} alt={data.title} className="node-image-banner__img" />
          </div>
        )}
        <div className="anchor-node__label">note</div>
        <div className="anchor-node__title">{data.title || 'untitled'}</div>
        {data.body && <div className="anchor-node__desc">{data.body}</div>}
      </div>

      <div className="anchor-node__footer">
        {isLoading ? (
          <span className="anchor-node__loading-hint">
            <span className="spinner" />
            expanding…
          </span>
        ) : !isExpanded ? (
          <button
            className="anchor-node__expand"
            onPointerDown={e => { e.stopPropagation(); e.nativeEvent?.stopImmediatePropagation?.(); }}
            onMouseDown={e => { e.stopPropagation(); e.nativeEvent?.stopImmediatePropagation?.(); }}
            onClick={e => { e.stopPropagation(); data.onExpand?.(); }}
          >
            + expand
          </button>
        ) : (
          <span className="anchor-node__expand" style={{ cursor: 'default', opacity: 0.45 }}>
            expanded
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
