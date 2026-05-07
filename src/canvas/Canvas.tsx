import { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { usePanZoom } from './usePanZoom';
import { useCanvas, getLOD } from './useCanvas';
import { useTools } from './useTools';
import { useSelection, MIN_FRAGMENT_WIDTH, MAX_FRAGMENT_WIDTH } from './useSelection';
import type { ResizeHandle } from './useSelection';
import { CanvasState, Fragment, LayoutType } from '../api/types';
import { generatePivot } from '../api/generate';
import CanvasBackground from './CanvasBackground';
import Cluster from '../clusters/Cluster';
import ConnectorLayer from '../edges/ConnectorLayer';
import FragmentComponent from '../fragments/Fragment';
import StatusBar from '../ui/StatusBar';
import Toolbar from '../ui/Toolbar';
import '../styles/connectors.css';
import '../styles/selection.css';
import '../styles/toolbar.css';

// Default widths per layout (mirrors CSS) — used for resize start width when fragment.width is unset
const LAYOUT_WIDTHS: Partial<Record<LayoutType, number>> = {
  'vertical-flow':  320,
  'image-hero':     480,
  'quote-centered': 380,
  'card-split':     320,
  'timeline':       400,
  'list-prominent': 480,
  'text-note':      200,
};

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
  const transformRef = useRef({ x: 0, y: 0, zoom: 0.7 });

  const { transform, setTransform, handleWheel, onMouseDown: panMouseDown, onMouseMove, onMouseUp } = usePanZoom();
  const {
    state,
    startDrag, updateDrag, endDrag,
    updateFragmentWidth, updateFragmentTitle,
    updateConnectorLabel, updateConnectorRenderType, deleteConnector, promoteConnector,
    removeFragment, toggleStarFragment,
    addCluster, addFragment, addPivotCluster,
    updateViewport,
  } = useCanvas(projectId, initialState);

  const { activeTool, switchTo } = useTools();
  const { selectedIds, selectionRect, selectId, deselectAll, selectMany, startRect, updateRect, finishRect } = useSelection();

  const lod = getLOD(transform.zoom);

  // Keep refs current
  useEffect(() => { zoomRef.current = transform.zoom; }, [transform.zoom]);
  useEffect(() => { transformRef.current = transform; }, [transform]);

  // Pivot state
  const [pivotingFragmentId, setPivotingFragmentId] = useState<string | null>(null);
  const [pivotErrors, setPivotErrors] = useState<Record<string, string>>({});
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Text note editing state
  const [editingFragmentId, setEditingFragmentId] = useState<string | null>(null);

  // Resize drag ref
  const resizeDragRef = useRef<{
    fragmentId: string;
    handle: ResizeHandle;
    startMouseX: number;
    origWidth: number;
    origX: number;
    isLeft: boolean;
  } | null>(null);

  // Selection rect dragging ref (to avoid state lag in handlers)
  const selectionDragging = useRef(false);

  // Restore viewport
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

  // Sync viewport to state
  useEffect(() => { updateViewport(transform); }, [transform, updateViewport]);

  // Passive wheel listener
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // Window-level mouse handlers — fragment drag, resize drag, selection rect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (resizeDragRef.current) {
        const rd = resizeDragRef.current;
        const rawDx = (e.clientX - rd.startMouseX) / zoomRef.current;
        const delta = rd.isLeft ? -rawDx : rawDx;
        const newWidth = Math.max(MIN_FRAGMENT_WIDTH, Math.min(MAX_FRAGMENT_WIDTH, rd.origWidth + delta));
        updateFragmentWidth(rd.fragmentId, newWidth);
        if (rd.isLeft) {
          // Also shift x so the right edge stays anchored
          // newX = origX + rawDx
          // (we update via updateDrag which only works for fragment-kind drags; skip x shift for now)
        }
        return;
      }
      if (selectionDragging.current) {
        const t = transformRef.current;
        const cx = (e.clientX - t.x) / t.zoom;
        const cy = (e.clientY - t.y) / t.zoom;
        updateRect(cx, cy);
        return;
      }
      updateDrag(e.clientX, e.clientY, zoomRef.current);
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (resizeDragRef.current) {
        resizeDragRef.current = null;
        return;
      }
      if (selectionDragging.current) {
        selectionDragging.current = false;
        const rect = finishRect();
        if (rect) {
          const minX = Math.min(rect.startX, rect.endX);
          const maxX = Math.max(rect.startX, rect.endX);
          const minY = Math.min(rect.startY, rect.endY);
          const maxY = Math.max(rect.startY, rect.endY);
          if (maxX - minX > 4 || maxY - minY > 4) {
            const hit = state.fragments.filter(f => {
              const fw = f.width ?? LAYOUT_WIDTHS[f.layout] ?? 320;
              return f.x < maxX && f.x + fw > minX && f.y < maxY && f.y + 100 > minY;
            });
            selectMany(hit.map(f => f.id));
          }
        }
        return;
      }
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
  }, [updateDrag, endDrag, updateFragmentWidth, updateRect, finishRect, selectMany, state.fragments]);

  // Keyboard: copy/paste + delete selected
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true';

      const isMod = e.metaKey || e.ctrlKey;
      if (isMod && e.key === 'c') {
        const hoveredEl = document.querySelector('[data-fragment-id]:hover');
        if (!hoveredEl) return;
        const id = hoveredEl.getAttribute('data-fragment-id');
        if (!id) return;
        const fragment = state.fragments.find(f => f.id === id);
        if (fragment) { e.preventDefault(); onFragmentCopy(fragment); }
        return;
      }
      if (isMod && e.key === 'v' && copiedFragment) {
        e.preventDefault();
        const IMPORTED_CLUSTER_ID = 'imported';
        if (!state.clusters.some(c => c.id === IMPORTED_CLUSTER_ID)) {
          addCluster({ id: IMPORTED_CLUSTER_ID, x: 0, y: 0, label: 'imported', isSeed: false });
        }
        addFragment({ ...copiedFragment, id: uuidv4(), clusterId: IMPORTED_CLUSTER_ID, x: 0, y: 0 });
        onFragmentPaste();
        return;
      }

      if (!isTyping && (e.key === 'Delete' || e.key === 'Backspace') && selectedIds.size > 0) {
        e.preventDefault();
        selectedIds.forEach(id => removeFragment(id));
        deselectAll();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.fragments, state.clusters, copiedFragment, selectedIds, onFragmentCopy, onFragmentPaste, addCluster, addFragment, removeFragment, deselectAll]);

  // Canvas background mouse down — select tool starts rect, text tool places note
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only handle direct clicks on canvas-content or canvas-wrapper (not on fragments)
    if ((e.target as HTMLElement).closest('[data-fragment-id]')) return;

    if (activeTool === 'text') return; // text placement handled on click

    if (activeTool === 'select') {
      deselectAll();
      const t = transformRef.current;
      const cx = (e.clientX - t.x) / t.zoom;
      const cy = (e.clientY - t.y) / t.zoom;
      startRect(cx, cy);
      selectionDragging.current = true;
      return;
    }

    // Fallback: pan
    panMouseDown(e);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('[data-fragment-id]')) return;
    if (activeTool !== 'text') return;

    const t = transformRef.current;
    const cx = (e.clientX - t.x) / t.zoom;
    const cy = (e.clientY - t.y) / t.zoom;

    const TEXT_NOTES_CLUSTER = 'text-notes';
    if (!state.clusters.some(c => c.id === TEXT_NOTES_CLUSTER)) {
      addCluster({ id: TEXT_NOTES_CLUSTER, x: 0, y: 0, label: 'notes', isSeed: false });
    }

    const id = uuidv4();
    addFragment({
      id,
      clusterId: TEXT_NOTES_CLUSTER,
      x: cx,
      y: cy,
      type: 'text-note',
      layout: 'text-note',
      title: '',
      slots: [],
      createdAtZoom: t.zoom,
      starred: false,
    });

    setEditingFragmentId(id);
    switchTo('select');
  };

  const handlePivot = async (fragmentId: string) => {
    if (pivotingFragmentId !== null) return;
    const fragment = state.fragments.find(f => f.id === fragmentId);
    if (!fragment) return;
    setPivotingFragmentId(fragmentId);
    try {
      const result = await generatePivot(fragment, fragment.clusterId);
      addPivotCluster(result.cluster, result.fragments, result.interConnector);
      const midX = (fragment.x + result.cluster.x) / 2;
      const midY = (fragment.y + result.cluster.y) / 2;
      const el = wrapperRef.current;
      if (el) {
        setIsTransitioning(true);
        setTransform(prev => ({
          ...prev,
          x: el.clientWidth / 2 - midX * prev.zoom,
          y: el.clientHeight / 2 - midY * prev.zoom,
        }));
        setTimeout(() => setIsTransitioning(false), 400);
      }
      setPivotingFragmentId(null);
    } catch (err) {
      console.error('Pivot failed:', err);
      setPivotErrors(prev => ({ ...prev, [fragmentId]: "couldn't generate — try again" }));
      setPivotingFragmentId(null);
      setTimeout(() => {
        setPivotErrors(prev => { const next = { ...prev }; delete next[fragmentId]; return next; });
      }, 3000);
    }
  };

  const handleResizeStart = (fragment: Fragment, handle: ResizeHandle, e: React.MouseEvent) => {
    const isLeft = handle === 'nw' || handle === 'w' || handle === 'sw';
    resizeDragRef.current = {
      fragmentId: fragment.id,
      handle,
      startMouseX: e.clientX,
      origWidth: fragment.width ?? LAYOUT_WIDTHS[fragment.layout] ?? 320,
      origX: fragment.x,
      isLeft,
    };
  };

  const handleTitleChange = (id: string, title: string) => {
    if (!title) {
      removeFragment(id);
    } else {
      updateFragmentTitle(id, title);
    }
    setEditingFragmentId(null);
  };

  const canvasClass = `canvas-wrapper canvas--${activeTool}-tool`;

  return (
    <div
      ref={wrapperRef}
      className={canvasClass}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onClick={handleCanvasClick}
    >
      <CanvasBackground transform={transform} />
      <div
        className="canvas-content"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.zoom})`,
          transition: isTransitioning ? 'transform 400ms ease-out' : 'none',
        }}
      >
        <ConnectorLayer
          connectors={state.connectors}
          fragments={state.fragments}
          clusters={state.clusters}
          transform={transform}
          onLabelChange={updateConnectorLabel}
          onRenderTypeChange={updateConnectorRenderType}
          onDelete={deleteConnector}
          onPromote={promoteConnector}
        />

        {state.fragments.map(f => (
          <FragmentComponent
            key={f.id}
            fragment={f}
            lod={lod}
            onMouseDown={e => {
              e.stopPropagation();
              if (activeTool === 'select') {
                selectId(f.id, e.shiftKey);
              }
              startDrag(f.id, 'fragment', e.clientX, e.clientY, f.x, f.y);
            }}
            onDelete={removeFragment}
            onToggleStar={toggleStarFragment}
            onPivot={handlePivot}
            isPivoting={f.id === pivotingFragmentId}
            pivotDisabled={pivotingFragmentId !== null && f.id !== pivotingFragmentId}
            pivotError={pivotErrors[f.id] ?? null}
            isSelected={selectedIds.has(f.id)}
            isEditing={editingFragmentId === f.id}
            onTitleChange={handleTitleChange}
            onResizeStart={(handle, e) => handleResizeStart(f, handle, e)}
            style={{ left: f.x, top: f.y }}
          />
        ))}

        {state.clusters.map(cluster => (
          <Cluster
            key={cluster.id}
            cluster={cluster}
            onDragStart={(id, mx, my, ox, oy) =>
              startDrag(id, 'cluster', mx, my, ox, oy)
            }
          />
        ))}

        {/* Selection rectangle */}
        {selectionRect && (
          <div
            className="selection-rect"
            style={{
              left:   Math.min(selectionRect.startX, selectionRect.endX),
              top:    Math.min(selectionRect.startY, selectionRect.endY),
              width:  Math.abs(selectionRect.endX - selectionRect.startX),
              height: Math.abs(selectionRect.endY - selectionRect.startY),
            }}
          />
        )}
      </div>

      <Toolbar activeTool={activeTool} onSelect={switchTo} />

      <StatusBar
        zoom={transform.zoom}
        fragmentCount={state.fragments.length}
        clusterCount={state.clusters.length}
      />
    </div>
  );
}
