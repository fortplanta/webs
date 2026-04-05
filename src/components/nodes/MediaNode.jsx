import { memo } from 'react';
import { NodeResizer } from '@xyflow/react';

const MediaNode = memo(({ data, selected }) => {
  const isVideo = data.mediaType === 'video';

  return (
    <div className={`media-node${selected ? ' selected' : ''}`}>
      <NodeResizer
        isVisible={selected}
        minWidth={120}
        minHeight={80}
        lineStyle={{ borderColor: 'var(--color-accent)', opacity: 0.4 }}
        handleStyle={{ width: 8, height: 8, background: 'var(--color-accent)', border: 'none', borderRadius: '2px', opacity: 0.6 }}
      />

      <button
        className="media-node__remove"
        onClick={e => { e.stopPropagation(); data.onDelete?.(); }}
        title="Remove"
        aria-label="Remove media node"
      >
        ✕
      </button>

      <div className="media-node__media-wrap">
        {isVideo ? (
          <video
            src={data.src}
            controls
            className="media-node__media"
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <img
            src={data.src}
            alt={data.name || 'Dropped image'}
            className="media-node__media"
            draggable={false}
          />
        )}
      </div>

      {data.name && (
        <div className="media-node__caption">{data.name}</div>
      )}
    </div>
  );
});

MediaNode.displayName = 'MediaNode';
export default MediaNode;
