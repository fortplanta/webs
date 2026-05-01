import { useEffect, useRef } from 'react';
import { usePanZoom } from './usePanZoom';
import { useCanvas, getLOD } from './useCanvas';
import { CanvasState, Fragment } from '../api/types';
import CanvasBackground from './CanvasBackground';
import Cluster from '../clusters/Cluster';
import ConnectorLayer from '../edges/ConnectorLayer';
import FragmentComponent from '../fragments/Fragment';
import '../styles/connectors.css';

interface CanvasProps {
  projectId: string;
  initialState: CanvasState;
  copiedFragment: Fragment | null;
  onFragmentCopy: (f: Fragment) => void;
  onFragmentPaste: () => void;
}

export default function Canvas({
  projectId,
  initialState,
  copiedFragment,
  onFragmentCopy,
  onFragmentPaste,
}: CanvasProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef(initialState.viewport.zoom || 0.7);
  const { transform, setTransform, handleWheel, onMouseDown, onMouseMove, onMouseUp } = usePanZoom();
  const {
    state,
    startDrag, updateDrag, endDrag,
    updateConnectorLabel, deleteConnector, promoteConnector,
    removeFragment, toggleStarFragment,
    addCluster, addFragment,
    updateViewport,
  } = useCanvas(projectId, initialState);

  const lod = getLOD(transform.zoom);

  // Keep zoom ref current so window drag listeners always use latest zoom
  useEffect(() => { zoomRef.current = transform.zoom; }, [transform.zoom]);

  // Restore viewport from saved state, or center on canvas origin
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    if (initialState.viewport.zoom > 0 && (initialState.viewport.x !== 0 || initialState.viewport.y !== 0)) {
      setTransform(initialState.viewport);
    } else {
      setTransform(prev => ({
        ...prev,
        x: el.clientWidth / 2,
        y: el.clientHeight / 2,
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync pan-zoom transform back into canvas state (for persistence)
  useEffect(() => {
    updateViewport(transform);
  }, [transform, updateViewport]);

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

  // Keyboard copy/paste
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      if (!isMod) return;

      if (e.key === 'c') {
        const hoveredEl = document.querySelector('[data-fragment-id]:hover');
        if (!hoveredEl) return;
        const id = hoveredEl.getAttribute('data-fragment-id');
        if (!id) return;
        const fragment = state.fragments.find(f => f.id === id);
        if (fragment) {
          e.preventDefault();
          onFragmentCopy(fragment);
        }
      }

      if (e.key === 'v' && copiedFragment) {
        e.preventDefault();
        const IMPORTED_CLUSTER_ID = 'imported';
        const hasImportedCluster = state.clusters.some(c => c.id === IMPORTED_CLUSTER_ID);
        if (!hasImportedCluster) {
          addCluster({ id: IMPORTED_CLUSTER_ID, x: 0, y: 0, label: 'imported', isSeed: false });
        }
        const clone: Fragment = {
          ...copiedFragment,
          id: crypto.randomUUID(),
          clusterId: IMPORTED_CLUSTER_ID,
          x: 0,
          y: 0,
        };
        addFragment(clone);
        onFragmentPaste();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.fragments, state.clusters, copiedFragment, onFragmentCopy, onFragmentPaste, addCluster, addFragment]);

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

        {/* Fragments */}
        {state.fragments.map(f => (
          <FragmentComponent
            key={f.id}
            fragment={f}
            lod={lod}
            onMouseDown={e => {
              e.stopPropagation();
              startDrag(f.id, 'fragment', e.clientX, e.clientY, f.x, f.y);
            }}
            onDelete={removeFragment}
            onToggleStar={toggleStarFragment}
            style={{ left: f.x, top: f.y }}
          />
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
