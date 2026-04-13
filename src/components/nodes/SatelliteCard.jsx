import { memo, useState, useRef } from 'react';
import { useReactFlow } from '@xyflow/react';

// ── Satellite type renderers ──────────────────────────────────────────────────

function ImageSat({ content }) {
  return (
    <div className="satellite__image-area">
      {content.src
        ? <img src={content.src} alt={content.caption || ''} className="satellite__image-img" />
        : <span className="satellite__image-placeholder">image</span>
      }
    </div>
  );
}

function QuoteSat({ content }) {
  return (
    <>
      <div className="satellite__quote-mark">"</div>
      <div className="satellite__quote-text">{content.text}</div>
      {content.attribution && (
        <div className="satellite__quote-attr">{content.attribution}</div>
      )}
    </>
  );
}

function StatSat({ content }) {
  return (
    <>
      <div className="satellite__stat-value">{content.value}</div>
      <div className="satellite__stat-label">{content.label}</div>
    </>
  );
}

function SourceSat({ content }) {
  const initial = (content.domain || content.name || '?')[0].toUpperCase();
  return (
    <>
      <div className="satellite__source-logo">{initial}</div>
      <div className="satellite__source-domain">{content.domain || content.name}</div>
    </>
  );
}

function VideoSat({ content }) {
  return (
    <>
      <div className="satellite__video-thumb">
        {content.thumbnailSrc
          ? <img src={content.thumbnailSrc} alt={content.title} className="satellite__video-img" />
          : null
        }
        <div className="satellite__video-play">▶</div>
        {content.duration && (
          <div className="satellite__video-duration">{content.duration}</div>
        )}
      </div>
      <div className="satellite__video-title">{content.title}</div>
    </>
  );
}

function ConceptSat({ content }) {
  return (
    <>
      <div className="satellite__concept-label">{content.label}</div>
      {content.description && (
        <div className="satellite__concept-desc">{content.description}</div>
      )}
    </>
  );
}

function DatapointSat({ content }) {
  return (
    <>
      <div className="satellite__dp-value">{content.value}<span className="satellite__dp-unit"> {content.unit}</span></div>
      <div className="satellite__dp-context">{content.context}</div>
    </>
  );
}

function NoteSat({ content }) {
  return (
    <>
      <div className="satellite__note-text">{content.text}</div>
      {content.addedAt && (
        <div className="satellite__note-time">
          {new Date(content.addedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </div>
      )}
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const TYPE_LABEL = {
  image:     'image',
  quote:     'quote',
  stat:      'stat',
  source:    'source',
  video:     'video',
  concept:   'concept',
  datapoint: 'data',
  note:      'note',
};

const SatelliteCard = memo(({ satellite, x, y, onDragEnd }) => {
  const { type, content } = satellite;
  const { getZoom } = useReactFlow();

  const [localPos, setLocalPos] = useState({ x, y });
  const dragRef = useRef(null);

  const onMouseDown = (e) => {
    e.stopPropagation();
    e.preventDefault();

    dragRef.current = {
      startMx: e.clientX,
      startMy: e.clientY,
      startX:  localPos.x,
      startY:  localPos.y,
    };

    const onMove = (ev) => {
      if (!dragRef.current) return;
      const zoom = getZoom();
      setLocalPos({
        x: dragRef.current.startX + (ev.clientX - dragRef.current.startMx) / zoom,
        y: dragRef.current.startY + (ev.clientY - dragRef.current.startMy) / zoom,
      });
    };

    const onUp = (ev) => {
      if (!dragRef.current) return;
      const zoom   = getZoom();
      const finalX = dragRef.current.startX + (ev.clientX - dragRef.current.startMx) / zoom;
      const finalY = dragRef.current.startY + (ev.clientY - dragRef.current.startMy) / zoom;
      onDragEnd?.(satellite.id, finalX, finalY);
      dragRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
  };

  return (
    <div
      className={`satellite satellite--${type}`}
      data-id={satellite.id}
      style={{ left: localPos.x, top: localPos.y, cursor: 'grab' }}
      onMouseDown={onMouseDown}
    >
      <div className={`satellite__type-label${type === 'note' ? ' satellite__type-label--note' : ''}`}>
        {TYPE_LABEL[type] ?? type}
      </div>

      {type === 'image'     && <ImageSat     content={content} />}
      {type === 'quote'     && <QuoteSat     content={content} />}
      {type === 'stat'      && <StatSat      content={content} />}
      {type === 'source'    && <SourceSat    content={content} />}
      {type === 'video'     && <VideoSat     content={content} />}
      {type === 'concept'   && <ConceptSat   content={content} />}
      {type === 'datapoint' && <DatapointSat content={content} />}
      {type === 'note'      && <NoteSat      content={content} />}
    </div>
  );
});

SatelliteCard.displayName = 'SatelliteCard';
export default SatelliteCard;
