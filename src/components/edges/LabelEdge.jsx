/**
 * LabelEdge — smoothstep edge with interactive midpoint dot.
 * Replaces the default 'smoothstep' edge type for all canvas edges.
 */
import { useState, useRef } from 'react';
import { EdgeLabelRenderer, BaseEdge, getSmoothStepPath } from '@xyflow/react';

export default function LabelEdge({
  id,
  sourceX, sourceY,
  targetX, targetY,
  sourcePosition,
  targetPosition,
  data,
  style,
  markerEnd,
  markerStart,
}) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  const [hovered, setHovered]   = useState(false);
  const [editing, setEditing]   = useState(false);
  const [label, setLabel]       = useState(data?.label ?? '');
  const inputRef                = useRef(null);

  function handleDotClick(e) {
    e.stopPropagation();
    setEditing(true);
    setHovered(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function handleSubmit() {
    setEditing(false);
  }

  return (
    <>
      <BaseEdge path={edgePath} style={style} markerEnd={markerEnd} markerStart={markerStart} />

      <EdgeLabelRenderer>
        <div
          className="nodrag nopan edge-label-root"
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
          }}
        >
          {!editing && (
            <div
              className={`edge-midpoint${hovered ? ' hovered' : ''}`}
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
              onClick={handleDotClick}
            >
              {/* Center dot — always present */}
              <div className="edge-dot edge-dot--center" />

              {/* Bloom dots — hover only */}
              {hovered && (
                <>
                  <div className="edge-dot edge-dot--n" />
                  <div className="edge-dot edge-dot--s" />
                  <div className="edge-dot edge-dot--e" />
                  <div className="edge-dot edge-dot--w" />
                </>
              )}

              {/* Label text when set and not hovering */}
              {label && !hovered && (
                <div className="edge-label-text">{label}</div>
              )}
            </div>
          )}

          {editing && (
            <div className="edge-label-input-wrap">
              <input
                ref={inputRef}
                className="edge-label-input"
                value={label}
                onChange={e => setLabel(e.target.value)}
                onBlur={handleSubmit}
                onKeyDown={e => {
                  if (e.key === 'Enter')  handleSubmit();
                  if (e.key === 'Escape') setEditing(false);
                }}
                placeholder="Label edge…"
              />
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
