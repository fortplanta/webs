import { memo } from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';
import { CATEGORY_BY_KEY } from '../../constants';
import SmartText from '../SmartText';

const ContextNode = memo(({ data, selected }) => {
  const cat      = CATEGORY_BY_KEY[data.category] || { label: data.category, icon: '·', color: 'var(--color-accent)' };
  const revealed = data.revealed   ?? false;
  const isStarred = data.starred   ?? false;
  const termMap  = data.termDefinitions ?? {};

  return (
    <div
      className={`context-node${revealed ? ' revealed' : ' locked'}${selected ? ' selected' : ''}${isStarred ? ' starred' : ''}`}
      style={{ '--node-color': cat.color }}
      onClick={!revealed ? e => { e.stopPropagation(); data.onReveal?.(); } : undefined}
      onContextMenu={data.onContextMenu}
    >
      {revealed && (
        <NodeResizer
          isVisible={selected}
          minWidth={160}
          minHeight={72}
          lineStyle={{ borderColor: cat.color, opacity: 0.3 }}
          handleStyle={{ width: 6, height: 6, background: cat.color, opacity: 0.5, border: 'none', borderRadius: '1px' }}
        />
      )}

      {/* Handles on all 4 sides — outside overflow so never clipped */}
      <Handle type="target" position={Position.Left}   id="left"   />
      <Handle type="source" position={Position.Right}  id="right"  />
      <Handle type="target" position={Position.Top}    id="top"    />
      <Handle type="source" position={Position.Bottom} id="bottom" />

      {/* Star — stops ALL pointer events to prevent ReactFlow drag interception */}
      {revealed && (
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
      )}

      {revealed ? (
        /* Inner clip wrapper — clips image + bar to border-radius without clipping handles */
        <div className="context-node__inner-clip">
          <div className="context-node__bar" />

          {/* Wikipedia image banner */}
          {data.nodeImage && (
            <div className="node-image-banner">
              <img src={data.nodeImage} alt={data.title} className="node-image-banner__img" />
            </div>
          )}

          <div className="context-node__body">
            <div className="context-node__category">
              <span>{cat.icon}</span>
              {cat.label}
              <span className="context-node__ai-badge">ai</span>
            </div>
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
          <div className="context-node__locked-category">{cat.label}</div>
          <div className="context-node__locked-hint">click to reveal</div>
        </div>
      )}
    </div>
  );
});

ContextNode.displayName = 'ContextNode';
export default ContextNode;
