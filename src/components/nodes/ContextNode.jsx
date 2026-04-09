import { memo, useRef, useState, useEffect } from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';
import { CATEGORY_BY_KEY } from '../../constants';
import SmartText from '../SmartText';

const ContextNode = memo(({ data, selected }) => {
  const cat       = CATEGORY_BY_KEY[data.category] || { label: data.category, icon: '·', color: 'var(--color-accent)' };
  const revealed  = data.revealed  ?? false;
  const isStarred = data.starred   ?? false;
  const termMap   = data.termDefinitions ?? {};

  const labelRef = useRef(null);
  const [labelH, setLabelH] = useState(34);
  useEffect(() => {
    if (labelRef.current) setLabelH(labelRef.current.offsetHeight);
  }, []);

  return (
    <div
      className="node-outer"
      onClick={!revealed ? e => { e.stopPropagation(); data.onReveal?.(); } : undefined}
      onContextMenu={data.onContextMenu}
    >
      {/* Floating label — category name above the card */}
      <div className="node-label" ref={labelRef} style={{ color: cat.color }}>
        {cat.label}
      </div>

      {/* Handles — positioned on the card edges */}
      <Handle type="target" position={Position.Left}   id="left"   style={{ top: labelH + 60 }} />
      <Handle type="source" position={Position.Right}  id="right"  style={{ top: labelH + 60 }} />
      <Handle type="target" position={Position.Top}    id="top"    style={{ top: labelH }} />
      <Handle type="source" position={Position.Bottom} id="bottom" />

      {/* Image — floats between label and card */}
      {revealed && data.nodeImage && (
        <div className="node-img-float" style={{ marginTop: labelH }}>
          <img src={data.nodeImage} alt={data.title} className="node-img-float__img" />
        </div>
      )}

      {/* Star */}
      {revealed && (
        <span
          role="button"
          tabIndex={0}
          className={`node-star${isStarred ? ' active' : ''}`}
          title={isStarred ? 'unstar' : 'star'}
          style={{ top: labelH + (data.nodeImage ? 168 : 8) }}
          onPointerDown={e => { e.stopPropagation(); e.nativeEvent?.stopImmediatePropagation?.(); }}
          onMouseDown={e => { e.stopPropagation(); e.nativeEvent?.stopImmediatePropagation?.(); }}
          onClick={e => { e.stopPropagation(); e.nativeEvent?.stopImmediatePropagation?.(); data.onToggleStar?.(); }}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); data.onToggleStar?.(); } }}
        >
          {isStarred ? '★' : '☆'}
        </span>
      )}

      <div
        className={`context-node${revealed ? ' revealed' : ' locked'}${selected ? ' selected' : ''}${isStarred ? ' starred' : ''}${revealed && data.nodeImage ? ' has-image' : ''}`}
        style={{ '--node-color': cat.color, marginTop: revealed && data.nodeImage ? 0 : labelH }}
      >
        {revealed && (
          <NodeResizer
            isVisible={selected}
            minWidth={200}
            minHeight={72}
            lineStyle={{ borderColor: 'rgba(255,255,255,0.15)', opacity: 0.5 }}
            handleStyle={{ width: 6, height: 6, background: 'rgba(255,255,255,0.4)', border: 'none', borderRadius: '1px' }}
          />
        )}

        {revealed ? (
          <div className="context-node__inner-clip">
            <div className="context-node__body">
              <div className="context-node__title">{data.title || cat.label}</div>
              {data.summary && (
                <div className="context-node__summary">
                  <SmartText text={data.summary} termMap={termMap} />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="context-node__locked-inner">
            <div className="context-node__locked-icon">{cat.icon}</div>
            <div className="context-node__locked-hint">click to reveal</div>
          </div>
        )}
      </div>
    </div>
  );
});

ContextNode.displayName = 'ContextNode';
export default ContextNode;
