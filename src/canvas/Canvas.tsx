import { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { usePanZoom } from './usePanZoom';
import { useCanvas, getLOD } from './useCanvas';
import { useTools } from './useTools';
import { useSelection, MIN_FRAGMENT_WIDTH, MAX_FRAGMENT_WIDTH } from './useSelection';
import type { ResizeHandle } from './useSelection';
import { CanvasState, ConnectorRenderType, Fragment, FragmentType, LayoutType, AccordionSlot } from '../api/types';
import { generatePivot } from '../api/generate';
import CanvasBackground from './CanvasBackground';
import Cluster from '../clusters/Cluster';
import ConnectorLayer from '../edges/ConnectorLayer';
import FragmentComponent from '../fragments/Fragment';
import CanvasCommandMenu from '../ui/CanvasCommandMenu';
import StatusBar from '../ui/StatusBar';
import Toolbar from '../ui/Toolbar';
import '../styles/connectors.css';
import '../styles/selection.css';
import '../styles/toolbar.css';
import '../styles/command-menu.css';

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

const RENDER_TYPES: ConnectorRenderType[] = ['bezier', 'straight', 'step', 'smoothstep'];

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
    addConnector, addEmptyFragment, addAccordionSlot,
    duplicateFragment, pinFragment, moveFragmentToCluster,
    updateViewport,
    pushUndo,
    undo,
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

  // Connector dot drag state
  const dotDragRef = useRef<{
    sourceFragmentId: string;
    x1: number;
    y1: number;
  } | null>(null);
  const [dotDragPreview, setDotDragPreview] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [dotDraggingFragmentId, setDotDraggingFragmentId] = useState<string | null>(null);

  // Canvas command menu (from connector dot drop on empty canvas)
  const [commandMenu, setCommandMenu] = useState<{
    x: number; y: number; sourceFragmentId: string;
  } | null>(null);

  // Connector context menu state — stored in screen coords so it can use position: fixed
  const connectorMenuRef = useRef<HTMLDivElement>(null);
  const [connectorMenu, setConnectorMenu] = useState<{
    connectorId: string;
    screenX: number;
    screenY: number;
  } | null>(null);

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

  // Close connector context menu on outside mousedown
  useEffect(() => {
    if (!connectorMenu) return;
    const handler = (e: MouseEvent) => {
      if (connectorMenuRef.current?.contains(e.target as Node)) return;
      setConnectorMenu(null);
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [connectorMenu]);

  // Convert viewport-relative coords to canvas-space coords
  // Must subtract wrapperRef's bounding rect because transform.x/y are wrapper-relative
  const toCanvas = (clientX: number, clientY: number) => {
    const rect = wrapperRef.current?.getBoundingClientRect() ?? { left: 0, top: 0 };
    const t = transformRef.current;
    return {
      x: (clientX - rect.left - t.x) / t.zoom,
      y: (clientY - rect.top - t.y) / t.zoom,
    };
  };

  const handleConnectorDotStart = (fragmentId: string, e: React.MouseEvent) => {
    const frag = state.fragments.find(f => f.id === fragmentId);
    if (!frag) return;
    const { x: cx, y: cy } = toCanvas(e.clientX, e.clientY);
    dotDragRef.current = { sourceFragmentId: fragmentId, x1: frag.x, y1: frag.y };
    setDotDragPreview({ x1: frag.x, y1: frag.y, x2: cx, y2: cy });
    setDotDraggingFragmentId(fragmentId);
  };

  // Window-level mouse handlers — fragment drag, resize drag, selection rect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dotDragRef.current) {
        const { x: cx, y: cy } = toCanvas(e.clientX, e.clientY);
        const { x1, y1 } = dotDragRef.current;
        setDotDragPreview({ x1, y1, x2: cx, y2: cy });
        return;
      }
      if (resizeDragRef.current) {
        const rd = resizeDragRef.current;
        const rawDx = (e.clientX - rd.startMouseX) / zoomRef.current;
        const delta = rd.isLeft ? -rawDx : rawDx;
        const newWidth = Math.max(MIN_FRAGMENT_WIDTH, Math.min(MAX_FRAGMENT_WIDTH, rd.origWidth + delta));
        updateFragmentWidth(rd.fragmentId, newWidth);
        return;
      }
      if (selectionDragging.current) {
        const rect = wrapperRef.current?.getBoundingClientRect() ?? { left: 0, top: 0 };
        const t = transformRef.current;
        const cx = (e.clientX - rect.left - t.x) / t.zoom;
        const cy = (e.clientY - rect.top - t.y) / t.zoom;
        updateRect(cx, cy);
        return;
      }
      updateDrag(e.clientX, e.clientY, zoomRef.current);
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (dotDragRef.current) {
        const { sourceFragmentId } = dotDragRef.current;
        dotDragRef.current = null;
        setDotDragPreview(null);
        setDotDraggingFragmentId(null);

        // Check if dropped on a fragment
        const el = document.elementFromPoint(e.clientX, e.clientY);
        const fragEl = el?.closest('[data-fragment-id]');
        const targetId = fragEl?.getAttribute('data-fragment-id');
        if (targetId && targetId !== sourceFragmentId) {
          addConnector(sourceFragmentId, targetId);
        } else {
          // Dropped on empty canvas — show command menu in canvas space
          const { x: cx, y: cy } = toCanvas(e.clientX, e.clientY);
          setCommandMenu({ x: cx, y: cy, sourceFragmentId });
        }
        return;
      }
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
  }, [updateDrag, endDrag, updateFragmentWidth, updateRect, finishRect, selectMany, state.fragments, addConnector]);

  // Keyboard: copy/paste + delete selected + undo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true';

      const isMod = e.metaKey || e.ctrlKey;

      if (isMod && e.key === 'z') {
        e.preventDefault();
        undo();
        return;
      }

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
  }, [state.fragments, state.clusters, copiedFragment, selectedIds, onFragmentCopy, onFragmentPaste, addCluster, addFragment, removeFragment, deselectAll, undo]);

  // Canvas background mouse down — select tool starts rect, text tool places note
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only handle direct clicks on canvas-content or canvas-wrapper (not on fragments)
    if ((e.target as HTMLElement).closest('[data-fragment-id]')) return;

    if (activeTool === 'text') return; // text placement handled on click

    if (activeTool === 'select') {
      deselectAll();
      const { x: cx, y: cy } = toCanvas(e.clientX, e.clientY);
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

    const { x: cx, y: cy } = toCanvas(e.clientX, e.clientY);

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
      createdAtZoom: transformRef.current.zoom,
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
    pushUndo(); // capture state before resize
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

  const handleAddAccordion = async (fragmentId: string, promptId: string) => {
    const frag = state.fragments.find(f => f.id === fragmentId);
    if (!frag) return;
    const slot: AccordionSlot = {
      id: uuidv4(),
      promptId,
      promptLabel: promptId.replace(/-/g, ' '),
      content: `Generated response for "${frag.title}" using prompt "${promptId}".`,
      createdAt: Date.now(),
    };
    addAccordionSlot(fragmentId, slot);
  };

  const handleFragmentDoubleClick = (id: string) => {
    const fragment = state.fragments.find(f => f.id === id);
    if (fragment?.layout === 'text-note') {
      setEditingFragmentId(id);
    }
  };

  const handleConnectorContextMenu = (e: React.MouseEvent, connectorId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setConnectorMenu({ connectorId, screenX: e.clientX, screenY: e.clientY });
  };

  const activeConnector = connectorMenu
    ? state.connectors.find(c => c.id === connectorMenu.connectorId)
    : null;

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
          onLabelChange={updateConnectorLabel}
          onContextMenu={handleConnectorContextMenu}
          preview={dotDragPreview}
        />

        {state.fragments.map(f => (
          <FragmentComponent
            key={f.id}
            fragment={f}
            lod={lod}
            clusters={state.clusters}
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
            onDuplicate={duplicateFragment}
            onPin={pinFragment}
            onMoveToCluster={moveFragmentToCluster}
            onAddAccordion={handleAddAccordion}
            onConnectorDotStart={handleConnectorDotStart}
            isPivoting={f.id === pivotingFragmentId}
            pivotDisabled={pivotingFragmentId !== null && f.id !== pivotingFragmentId}
            pivotError={pivotErrors[f.id] ?? null}
            isSelected={selectedIds.has(f.id)}
            isEditing={editingFragmentId === f.id}
            onTitleChange={handleTitleChange}
            onDoubleClick={handleFragmentDoubleClick}
            onResizeStart={(handle, e) => handleResizeStart(f, handle, e)}
            dotDragging={dotDraggingFragmentId === f.id}
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

        {/* Canvas command menu — inside transform so it pans with canvas */}
        {commandMenu && (
          <CanvasCommandMenu
            x={commandMenu.x}
            y={commandMenu.y}
            sourceFragmentId={commandMenu.sourceFragmentId}
            onCreateFragment={(type: FragmentType, x: number, y: number) => {
              const FALLBACK_CLUSTER = 'canvas-drops';
              if (!state.clusters.some(c => c.id === FALLBACK_CLUSTER)) {
                addCluster({ id: FALLBACK_CLUSTER, x: 0, y: 0, label: 'canvas drops', isSeed: false });
              }
              const newId = addEmptyFragment(type, x, y, FALLBACK_CLUSTER);
              addConnector(commandMenu.sourceFragmentId, newId);
            }}
            onCreateTextNote={(x: number, y: number) => {
              const TEXT_NOTES_CLUSTER = 'text-notes';
              if (!state.clusters.some(c => c.id === TEXT_NOTES_CLUSTER)) {
                addCluster({ id: TEXT_NOTES_CLUSTER, x: 0, y: 0, label: 'notes', isSeed: false });
              }
              const newId = uuidv4();
              addFragment({ id: newId, clusterId: TEXT_NOTES_CLUSTER, x, y, type: 'text-note', layout: 'text-note', title: '', slots: [], createdAtZoom: transformRef.current.zoom, starred: false });
              addConnector(commandMenu.sourceFragmentId, newId);
              setEditingFragmentId(newId);
            }}
            onPivot={handlePivot}
            onCreateCluster={(x: number, y: number) => {
              const newClusterId = uuidv4();
              addCluster({ id: newClusterId, x, y, label: 'new cluster', isSeed: false });
            }}
            onClose={() => setCommandMenu(null)}
          />
        )}

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

      {/* Connector context menu — fixed position, outside canvas-content transform */}
      {connectorMenu && activeConnector && (
        <div
          ref={connectorMenuRef}
          className="connector-context-menu"
          style={{ position: 'fixed', left: connectorMenu.screenX, top: connectorMenu.screenY }}
          onMouseDown={e => e.stopPropagation()}
          onClick={e => e.stopPropagation()}
        >
          {RENDER_TYPES.map(rt => {
            const current = (activeConnector.renderType ?? 'straight') === rt;
            return (
              <button
                key={rt}
                className={current ? 'connector-context-menu__item--checked' : ''}
                onClick={() => { updateConnectorRenderType(activeConnector.id, rt); setConnectorMenu(null); }}
              >
                <span className="connector-context-menu__check">{current ? '✓' : ''}</span>
                {rt}
              </button>
            );
          })}
          <div className="connector-context-menu__divider" />
          {activeConnector.type === 'standard' && (
            <button onClick={() => { promoteConnector(activeConnector.id, 'strong'); setConnectorMenu(null); }}>Make strong</button>
          )}
          {activeConnector.type === 'strong' && (
            <button onClick={() => { promoteConnector(activeConnector.id, 'standard'); setConnectorMenu(null); }}>Make standard</button>
          )}
          <button onClick={() => { deleteConnector(activeConnector.id); setConnectorMenu(null); }}>Delete</button>
        </div>
      )}

      <Toolbar activeTool={activeTool} onSelect={switchTo} />

      <StatusBar
        zoom={transform.zoom}
        fragmentCount={state.fragments.length}
        clusterCount={state.clusters.length}
      />
    </div>
  );
}
