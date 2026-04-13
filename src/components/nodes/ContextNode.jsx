import { memo, useRef, useState, useEffect, useMemo } from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';
import { CATEGORY_BY_KEY } from '../../constants';
import SmartText from '../SmartText';
import SatelliteCard from './SatelliteCard';
import ClusterTethers from './ClusterTethers';

// ── Scatter satellites into a ring around the primary card ───────────────────
const CARD_CENTER_X = 110;
const CARD_CENTER_Y = 110;
const MIN_RADIUS    = 140;
const MAX_RADIUS    = 200;

function scatterSatellites(count) {
  const positions = [];
  for (let i = 0; i < count; i++) {
    const baseAngle = (i / count) * Math.PI * 2;
    const jitter    = (Math.random() - 0.5) * (Math.PI / count);
    const angle     = baseAngle + jitter;
    const radius    = MIN_RADIUS + Math.random() * (MAX_RADIUS - MIN_RADIUS);
    positions.push({
      x: CARD_CENTER_X + Math.cos(angle) * radius,
      y: CARD_CENTER_Y + Math.sin(angle) * radius,
    });
  }
  return positions;
}

// ── Component ────────────────────────────────────────────────────────────────
const ContextNode = memo(({ data, selected, isConnectable }) => {
  const cat        = CATEGORY_BY_KEY[data.category] || { label: data.category, icon: '·', color: 'var(--color-accent)' };
  const revealed   = data.revealed       ?? false;
  const isStarred  = data.starred        ?? false;
  const termMap    = data.termDefinitions ?? {};
  const satellites = data.satellites      ?? [];

  const labelRef = useRef(null);
  const [labelH, setLabelH] = useState(34);
  const [activeTool, setActiveTool] = useState(null); // 'note' | 'factcheck' | 'pivot' | null
  const [noteText, setNoteText]     = useState('');

  useEffect(() => {
    if (labelRef.current) setLabelH(labelRef.current.offsetHeight);
  }, []);

  // Compute scatter positions once when the node is first revealed.
  const scatterRef = useRef(null);
  if (revealed && satellites.length > 0) {
    if (!scatterRef.current || scatterRef.current.length !== satellites.length) {
      scatterRef.current = scatterSatellites(satellites.length);
    }
  } else if (!revealed) {
    scatterRef.current = null;
  }

  const satellitesWithPos = useMemo(() => satellites.map((sat, i) => {
    const scatter = scatterRef.current?.[i];
    return {
      ...sat,
      renderX: (sat.x !== 0 || sat.y !== 0) ? sat.x : (scatter?.x ?? 0),
      renderY: (sat.x !== 0 || sat.y !== 0) ? sat.y : (scatter?.y ?? 0),
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [satellites, revealed]);

  const primaryCenter = { x: CARD_CENTER_X, y: CARD_CENTER_Y };

  // ── Add note to cluster ──────────────────────────────────────────────────
  function addNoteToCluster() {
    if (!noteText.trim()) return;
    const scatter = scatterSatellites(1)[0];
    const newSat = {
      id: `sat_note_${Date.now()}`,
      type: 'note',
      x: scatter.x,
      y: scatter.y,
      content: { type: 'note', text: noteText, addedAt: new Date().toISOString() },
    };
    data.onAddNoteSatellite?.(newSat);
    setNoteText('');
    setActiveTool(null);
  }

  function cancelNote() {
    setNoteText('');
    setActiveTool(null);
  }

  // Stop pointer/mouse events on interactive label children from
  // triggering the node drag or React Flow selection.
  function stopProp(e) {
    e.stopPropagation();
    e.nativeEvent?.stopImmediatePropagation?.();
  }

  return (
    <div
      className="node-outer"
      onClick={!revealed ? e => { e.stopPropagation(); data.onReveal?.(); } : undefined}
      onContextMenu={data.onContextMenu}
    >
      {/* Label row — category name + tool icon strip (no background) */}
      <div
        className="node-label"
        ref={labelRef}
        style={{ color: cat.color }}
      >
        <span className="node-label__text">{cat.label}</span>

        {/* Tool strip — icon-only buttons, only when revealed */}
        {revealed && (
          <div
            className="cluster-tools"
            onPointerDown={stopProp}
            onMouseDown={stopProp}
          >
            {/* Add note */}
            <button
              className={`cluster-tool-btn${activeTool === 'note' ? ' active' : ''}`}
              onClick={e => { stopProp(e); setActiveTool(activeTool === 'note' ? null : 'note'); }}
              title="Add note"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1.5" y="1.5" width="11" height="11" rx="1" stroke="currentColor" strokeWidth="1"/>
                <line x1="4" y1="5"   x2="10" y2="5"   stroke="currentColor" strokeWidth="1"/>
                <line x1="4" y1="7.5" x2="10" y2="7.5" stroke="currentColor" strokeWidth="1"/>
                <line x1="4" y1="10"  x2="7.5" y2="10" stroke="currentColor" strokeWidth="1"/>
              </svg>
            </button>

            {/* Fact check */}
            <button
              className={`cluster-tool-btn${activeTool === 'factcheck' ? ' active' : ''}`}
              onClick={e => { stopProp(e); setActiveTool(activeTool === 'factcheck' ? null : 'factcheck'); }}
              title="Fact check"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1"/>
                <path d="M4.5 7l2 2 3.5-3.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
              </svg>
            </button>

            {/* Pivot idea */}
            <button
              className={`cluster-tool-btn cluster-tool-btn--pivot${activeTool === 'pivot' ? ' active' : ''}`}
              onClick={e => {
                stopProp(e);
                if (activeTool === 'pivot') {
                  data.onPivotCancel?.();
                  setActiveTool(null);
                } else {
                  setActiveTool('pivot');
                  data.onPivotStart?.(() => setActiveTool(null));
                }
              }}
              title="Pivot idea"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7h7M6 4l4 3-4 3" stroke="#FFAB2B" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.85"/>
                <circle cx="11" cy="7" r="2" stroke="#FFAB2B" strokeWidth="1" opacity="0.6"/>
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Handles */}
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
          onPointerDown={stopProp}
          onMouseDown={stopProp}
          onClick={e => { stopProp(e); data.onToggleStar?.(); }}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { stopProp(e); data.onToggleStar?.(); } }}
        >
          {isStarred ? '★' : '☆'}
        </span>
      )}

      {/* Primary card */}
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

      {/* Cluster layer — auto-shown when revealed */}
      {revealed && satellitesWithPos.length > 0 && (
        <div className="cluster-layer">
          <ClusterTethers primaryCenter={primaryCenter} satellites={satellitesWithPos} />
          {satellitesWithPos.map(sat => (
            <SatelliteCard key={sat.id} satellite={sat} x={sat.renderX} y={sat.renderY} />
          ))}
        </div>
      )}

      {/* Sub-panels — anchored below the label row, right-aligned */}
      {activeTool === 'note' && (
        <div className="cluster-note-input" onPointerDown={stopProp} onMouseDown={stopProp}>
          <textarea
            autoFocus
            placeholder="Write a note..."
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            onKeyDown={e => { e.stopPropagation(); if (e.key === 'Escape') cancelNote(); }}
          />
          <div className="cluster-note-input__foot">
            <button className="cluster-note-input__cancel" onClick={cancelNote}>Cancel</button>
            <button className="cluster-note-input__add" onClick={addNoteToCluster}>Add to cluster</button>
          </div>
        </div>
      )}

      {activeTool === 'factcheck' && (
        <div className="cluster-fact-panel" onPointerDown={stopProp} onMouseDown={stopProp}>
          <div className="cluster-fact-panel__head">
            <span className="cluster-fact-panel__title">Fact check</span>
            <button className="cluster-fact-panel__close" onClick={() => setActiveTool(null)}>✕</button>
          </div>
          <div className="cluster-fact-panel__body">
            <div className="cluster-fact-panel__claim">
              {data.summary ? `"${data.summary.substring(0, 80)}${data.summary.length > 80 ? '…' : ''}"` : '"No claim available"'}
            </div>
            <div className="cluster-fact-panel__status">
              <div className="cluster-fact-panel__dot" />
              <span className="cluster-fact-panel__status-text">Supported by sources</span>
            </div>
            <div className="cluster-fact-panel__sources">
              {data.source?.domain ?? 'Source pending'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

ContextNode.displayName = 'ContextNode';
export default ContextNode;
