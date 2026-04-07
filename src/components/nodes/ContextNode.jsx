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
          handleStyle={{ width: 8, height: 8, background: cat.color, opacity: 0.5, border: 'none', borderRadius: '2px' }}
        />
      )}

      <Handle type="target" position={Position.Left}   id="left"   />
      <Handle type="source" position={Position.Right}  id="right"  />
      <Handle type="target" position={Position.Top}    id="top"    />
      <Handle type="source" position={Position.Bottom} id="bottom" />

      {revealed ? (
        <>
          <div className="context-node__bar" />

          {/* Star — stop pointer events to prevent drag interception */}
          <span
            role="button"
            tabIndex={0}
            className={`node-star${isStarred ? ' active' : ''}`}
            title={isStarred ? 'Unstar' : 'Star'}
            onPointerDown={e => e.stopPropagation()}
            onMouseDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); data.onToggleStar?.(); }}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); data.onToggleStar?.(); } }}
          >
            {isStarred ? '★' : '☆'}
          </span>

          <div className="context-node__body">
            {/* Wikipedia image banner */}
            {data.nodeImage && (
              <div className="node-image-banner">
                <img src={data.nodeImage} alt={data.title} className="node-image-banner__img" />
              </div>
            )}
            <div className="context-node__category">
              <span>{cat.icon}</span>
              {cat.label}
              <span className="context-node__ai-badge">AI</span>
            </div>
            <div className="context-node__title">{data.title || cat.label}</div>
            {data.summary && (
              <div className="context-node__summary">
                <SmartText text={data.summary} termMap={termMap} />
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="context-node__locked-inner">
          <div className="context-node__locked-icon">{cat.icon}</div>
          <div className="context-node__locked-category">{cat.label}</div>
          <div className="context-node__locked-hint">Click to reveal</div>
        </div>
      )}
    </div>
  );
});

ContextNode.displayName = 'ContextNode';
export default ContextNode;
