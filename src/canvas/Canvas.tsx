import { useEffect, useRef } from 'react';
import { usePanZoom } from './usePanZoom';
import { useCanvas, getLOD } from './useCanvas';
import CanvasBackground from './CanvasBackground';
import Cluster from '../clusters/Cluster';
import ConnectorLayer from '../edges/ConnectorLayer';
import { fragmentColors } from '../tokens/tokens';
import '../styles/connectors.css';

export default function Canvas() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef(0.7);
  const { transform, setTransform, handleWheel, onMouseDown, onMouseMove, onMouseUp } = usePanZoom();
  const {
    state,
    startDrag, updateDrag, endDrag,
    updateConnectorLabel, deleteConnector, promoteConnector,
  } = useCanvas();

  const lod = getLOD(transform.zoom);

  // Keep zoom ref current so window drag listeners always use latest zoom
  useEffect(() => { zoomRef.current = transform.zoom; }, [transform.zoom]);

  // Center viewport on canvas origin on mount
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    setTransform(prev => ({
      ...prev,
      x: el.clientWidth / 2,
      y: el.clientHeight / 2,
    }));
  }, [setTransform]);

  // Passive wheel listener for zoom
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // Window-level drag handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      updateDrag(e.clientX, e.clientY, zoomRef.current);
    };
    const handleMouseUp = (e: MouseEvent) => {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const fragEl = el?.closest('[data-fragment-id]');
      const targetId = fragEl?.getAttribute('data-fragment-id') ?? undefined;
      endDrag(targetId);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [updateDrag, endDrag]);

  return (
    <div
      ref={wrapperRef}
      className="canvas-wrapper"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      <CanvasBackground transform={transform} />
      <div
        className="canvas-content"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.zoom})`,
        }}
      >
        {/* Connector lines (SVG) sit below fragments via DOM order + z-index */}
        <ConnectorLayer
          connectors={state.connectors}
          fragments={state.fragments}
          clusters={state.clusters}
          transform={transform}
          onLabelChange={updateConnectorLabel}
          onDelete={deleteConnector}
          onPromote={promoteConnector}
        />

        {/* Fragment placeholders */}
        {state.fragments.map(f => (
          <div
            key={f.id}
            data-fragment-id={f.id}
            className={`fragment-placeholder fragment-placeholder--${lod}`}
            style={{
              left: f.x,
              top: f.y,
              background: fragmentColors[f.type].bg,
            }}
            onMouseDown={e => {
              e.stopPropagation();
              startDrag(f.id, 'fragment', e.clientX, e.clientY, f.x, f.y);
            }}
          >
            {lod === 'full' && (
              <span className="fragment-placeholder__title">{f.title}</span>
            )}
          </div>
        ))}

        {/* Cluster spawn points */}
        {state.clusters.map(cluster => (
          <Cluster
            key={cluster.id}
            cluster={cluster}
            onDragStart={(id, mx, my, ox, oy) =>
              startDrag(id, 'cluster', mx, my, ox, oy)
            }
          />
        ))}
      </div>
    </div>
  );
}
