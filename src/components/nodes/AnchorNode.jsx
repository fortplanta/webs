import { memo, useRef, useState, useEffect } from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';

const AnchorNode = memo(({ data, selected }) => {
  const revealedCount = data.contextNodes?.filter(n => n.revealed).length ?? 0;
  const totalCount    = data.contextNodes?.length ?? 0;
  const isExpanded    = totalCount > 0;
  const isLoading     = data.loading  ?? false;
  const isStarred     = data.starred  ?? false;

  const labelRef = useRef(null);
  const [labelH, setLabelH] = useState(34);
  useEffect(() => {
    if (labelRef.current) setLabelH(labelRef.current.offsetHeight);
  }, []);

  return (
    <div className="node-outer">
      {/* Floating category label — sits above the card */}
      <div className="node-label" ref={labelRef}>note</div>

      {/* Handles — on the card, offset by label height */}
      <Handle type="target" position={Position.Left}   id="left"   style={{ top: labelH + (/* card center approx */ 60) }} />
      <Handle type="source" position={Position.Right}  id="right"  style={{ top: labelH + 60 }} />
      <Handle type="target" position={Position.Top}    id="top"    style={{ top: labelH }} />
      <Handle type="source" position={Position.Bottom} id="bottom" />

      <div
        className={`anchor-node${selected ? ' selected' : ''}${isLoading ? ' loading' : ''}${isStarred ? ' starred' : ''}`}
        style={{ marginTop: labelH }}
        onContextMenu={data.onContextMenu}
      >
        <NodeResizer
          isVisible={selected}
          minWidth={240}
          minHeight={80}
          lineStyle={{ borderColor: 'rgba(255,255,255,0.15)', opacity: 0.5 }}
          handleStyle={{ width: 6, height: 6, background: 'rgba(255,255,255,0.4)', border: 'none', borderRadius: '1px' }}
        />

        <div className="anchor-node__bar" />

        {/* Star */}
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
          <div className="anchor-node__title">{data.title || 'untitled'}</div>
          {data.body && <div className="anchor-node__desc">{data.body}</div>}
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
              <span className="anchor-node__expand" style={{ cursor: 'default', opacity: 0.30 }}>
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
      </div>
    </div>
  );
});

AnchorNode.displayName = 'AnchorNode';
export default AnchorNode;
