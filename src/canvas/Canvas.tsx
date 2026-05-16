import { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { usePanZoom } from './usePanZoom';
import { useCanvas, getLOD } from './useCanvas';
import { useTools } from './useTools';
import { useSelection, MIN_FRAGMENT_WIDTH, MAX_FRAGMENT_WIDTH } from './useSelection';
import type { ResizeHandle } from './useSelection';
import { CanvasState, ConnectorRenderType, Fragment, FragmentType, LayoutType, AccordionSlot, SlotType, UserConnection } from '../api/types';
import { addUserConnection, updateUserConnectionAI, loadExplorationState } from './connections';
import { generatePivot, runPromptOnSlot, validateConnectionLabel } from '../api/generate';
import { PROMPTS, PromptDefinition } from '../prompts/prompts';
import CommandMenu, { CommandMenuTarget } from '../ui/CommandMenu';
import TimelineBanner from '../ui/TimelineBanner';
import GanttView from '../ui/GanttView';
import CanvasBackground from './CanvasBackground';
import Cluster from '../clusters/Cluster';
import ConnectorLayer from '../edges/ConnectorLayer';
import FragmentComponent from '../fragments/Fragment';
import SeedFragment from '../fragments/SeedFragment';
import CanvasCommandMenu from '../ui/CanvasCommandMenu';
import StatusBar from '../ui/StatusBar';
import Toolbar from '../ui/Toolbar';
import '../styles/connectors.css';
import '../styles/selection.css';
import '../styles/toolbar.css';
import '../styles/command-menu.css';
import '../styles/timeline.css';

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
  onNewExploration?: () => void;
  ganttOpen?: boolean;
  onGanttOpen?: () => void;
  onGanttClose?: () => void;
}

export default function Canvas({
  projectId,
  initialState,
  copiedFragment,
  onFragmentCopy,
  onFragmentPaste,
  onNewExploration,
  ganttOpen = false,
  onGanttOpen,
  onGanttClose,
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
    updateFragmentSlot, navigateSlotHistory,
    duplicateFragment, pinFragment, moveFragmentToCluster,
    moveGroupElements, removeCluster,
    resetToInitialPositions,
    anchorFragment, unanchorFragment,
    unassignFromCluster,
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

  // Connector dot drag state (Session 18)
  const dotDragRef = useRef<{
    sourceFragmentId: string;
    x1: number;
    y1: number;
  } | null>(null);
  const [dotDragPreview, setDotDragPreview] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [dotDraggingFragmentId, setDotDraggingFragmentId] = useState<string | null>(null);

  // User connection draw handle state (Session 24)
  const connectHandleRef = useRef<{ sourceFragmentId: string; x1: number; y1: number } | null>(null);
  const [connectPreview, setConnectPreview] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [connectDropTargetId, setConnectDropTargetId] = useState<string | null>(null);
  const [userConnectionsList, setUserConnectionsList] = useState<UserConnection[]>(() =>
    loadExplorationState(projectId)?.userConnections ?? []
  );

  // AI-pending user connections (marching dashes while waiting for label)
  // Map: connectionId → { heuristicStrength, badgeX, badgeY }
  const pendingConnectionsRef = useRef<Map<string, { heuristicStrength: 1 | 2 | 3; badgeX: number; badgeY: number }>>(new Map());
  const [pendingConnectionIds, setPendingConnectionIds] = useState<Set<string>>(new Set());
  const [fadingLabelIds, setFadingLabelIds] = useState<Set<string>>(new Set());

  // Floating score badges: +N chips that float up and disappear
  const [scoreBadges, setScoreBadges] = useState<Array<{ id: string; delta: number; x: number; y: number }>>([]);

  // Canvas drop menu (connector dot → empty canvas) — canvas-space coords
  const [canvasDropMenu, setCanvasDropMenu] = useState<{
    x: number; y: number; sourceFragmentId: string;
  } | null>(null);

  // Prompt running state (Session 17)
  const [promptingFragmentIds, setPromptingFragmentIds] = useState<Set<string>>(new Set());

  // Slot command menu (empty slot double-click) — screen coords
  const [commandMenu, setCommandMenu] = useState<CommandMenuTarget | null>(null);

  // Timeline highlight state (Session 17)
  const [highlightedFragmentId, setHighlightedFragmentId] = useState<string | null>(null);

  // Reset confirmation dialog
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Selected tether (cluster-spawn to fragment line)
  const [selectedTetherKey, setSelectedTetherKey] = useState<string | null>(null);

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

  // Group drag — ref tracks start positions, state drives CSS class (Session 20)
  const groupDragRef = useRef<{
    startMouseX: number;
    startMouseY: number;
    startPositions: Map<string, { x: number; y: number; type: 'fragment' | 'cluster' }>;
  } | null>(null);
  const [groupDragging, setGroupDragging] = useState(false);

  // Selection rect dragging ref (to avoid state lag in handlers)
  const selectionDragging = useRef(false);

  // Double-click text mode — per fragment

  // Alt key: text-select cursor on fragment cards
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Alt') el.classList.add('canvas-wrapper--alt'); };
    const onKeyUp = (e: KeyboardEvent) => { if (e.key === 'Alt') el.classList.remove('canvas-wrapper--alt'); };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      el.classList.remove('canvas-wrapper--alt');
    };
  }, []);

  // Prevent accidental text selection during any canvas drag
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const onDown = (e: MouseEvent) => {
      if (e.altKey) return;
      document.body.classList.add('drag-active');
    };
    const onUp = () => document.body.classList.remove('drag-active');
    el.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    return () => {
      el.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      document.body.classList.remove('drag-active');
    };
  }, []);

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

  // Reload user connections on tab switch
  useEffect(() => {
    setUserConnectionsList(loadExplorationState(projectId)?.userConnections ?? []);
  }, [projectId]);

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

  const handleConnectHandleStart = (fragmentId: string, e: React.MouseEvent) => {
    const frag = state.fragments.find(f => f.id === fragmentId);
    if (!frag) return;
    const fragWidth = frag.width ?? LAYOUT_WIDTHS[frag.layout] ?? 320;
    const x1 = frag.x + fragWidth / 2;
    const y1 = frag.y;
    const { x: cx, y: cy } = toCanvas(e.clientX, e.clientY);
    connectHandleRef.current = { sourceFragmentId: fragmentId, x1, y1 };
    setConnectPreview({ x1, y1, x2: cx, y2: cy });
  };

  // Window-level mouse handlers — fragment drag, resize drag, selection rect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (groupDragRef.current) {
        const gd = groupDragRef.current;
        const dx = (e.clientX - gd.startMouseX) / zoomRef.current;
        const dy = (e.clientY - gd.startMouseY) / zoomRef.current;
        const updates = Array.from(gd.startPositions.entries()).map(([id, pos]) => ({
          id, type: pos.type as 'fragment' | 'cluster',
          x: pos.x + dx, y: pos.y + dy,
        }));
        moveGroupElements(updates);
        return;
      }
      if (connectHandleRef.current) {
        const { x: cx, y: cy } = toCanvas(e.clientX, e.clientY);
        const { x1, y1 } = connectHandleRef.current;
        setConnectPreview({ x1, y1, x2: cx, y2: cy });
        const el = document.elementFromPoint(e.clientX, e.clientY);
        const fragEl = el?.closest('[data-fragment-id]');
        const hoveredId = fragEl?.getAttribute('data-fragment-id') ?? null;
        setConnectDropTargetId(
          hoveredId && hoveredId !== connectHandleRef.current.sourceFragmentId ? hoveredId : null
        );
        return;
      }
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
      if (groupDragRef.current) {
        groupDragRef.current = null;
        setGroupDragging(false);
        return;
      }
      if (connectHandleRef.current) {
        const { sourceFragmentId } = connectHandleRef.current;
        connectHandleRef.current = null;
        setConnectPreview(null);
        setConnectDropTargetId(null);
        const el = document.elementFromPoint(e.clientX, e.clientY);
        const fragEl = el?.closest('[data-fragment-id]');
        const targetId = fragEl?.getAttribute('data-fragment-id');
        if (targetId && targetId !== sourceFragmentId) {
          const result = addUserConnection(projectId, sourceFragmentId, targetId);
          setUserConnectionsList(loadExplorationState(projectId)?.userConnections ?? []);
          if (result) {
            const { id: connectionId, strength: heuristicStrength } = result;
            // Show initial score badge at drop position
            const badgeId = crypto.randomUUID();
            setScoreBadges(prev => [...prev, { id: badgeId, delta: heuristicStrength * 10, x: e.clientX, y: e.clientY }]);
            setTimeout(() => setScoreBadges(prev => prev.filter(b => b.id !== badgeId)), 1000);
            // Mark connection as AI-pending (marching dashes)
            pendingConnectionsRef.current.set(connectionId, { heuristicStrength, badgeX: e.clientX, badgeY: e.clientY });
            setPendingConnectionIds(prev => new Set(prev).add(connectionId));
            // Fire background AI validation (non-blocking)
            const sourceFragment = state.fragments.find(f => f.id === sourceFragmentId);
            const targetFragment = state.fragments.find(f => f.id === targetId);
            if (sourceFragment && targetFragment) {
              validateConnectionLabel(sourceFragment, targetFragment).then(aiResult => {
                const pending = pendingConnectionsRef.current.get(connectionId);
                pendingConnectionsRef.current.delete(connectionId);
                setPendingConnectionIds(prev => { const next = new Set(prev); next.delete(connectionId); return next; });
                if (!aiResult) {
                  // Error: keep heuristic, empty label
                  updateUserConnectionAI(projectId, connectionId, { label: '', strength: heuristicStrength, rationale: '' });
                  setUserConnectionsList(loadExplorationState(projectId)?.userConnections ?? []);
                  return;
                }
                // Fade out label, update, fade in
                setFadingLabelIds(prev => new Set(prev).add(connectionId));
                setTimeout(() => {
                  const update = updateUserConnectionAI(projectId, connectionId, aiResult);
                  setUserConnectionsList(loadExplorationState(projectId)?.userConnections ?? []);
                  // Show delta badge if AI returned stronger score
                  if (update && pending && aiResult.strength > pending.heuristicStrength) {
                    const delta = (aiResult.strength - pending.heuristicStrength) * 10;
                    const deltaBadgeId = crypto.randomUUID();
                    setScoreBadges(prev => [...prev, { id: deltaBadgeId, delta, x: pending.badgeX, y: pending.badgeY - 20 }]);
                    setTimeout(() => setScoreBadges(prev => prev.filter(b => b.id !== deltaBadgeId)), 1000);
                  }
                  setFadingLabelIds(prev => { const next = new Set(prev); next.delete(connectionId); return next; });
                }, 150);
              }).catch(err => {
                console.error('Connection validation error:', err);
                pendingConnectionsRef.current.delete(connectionId);
                setPendingConnectionIds(prev => { const next = new Set(prev); next.delete(connectionId); return next; });
              });
            } else {
              // Fragments not found — clear pending immediately
              pendingConnectionsRef.current.delete(connectionId);
              setPendingConnectionIds(prev => { const next = new Set(prev); next.delete(connectionId); return next; });
            }
          }
        }
        return;
      }
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
          // Dropped on empty canvas — show canvas drop command menu
          const { x: cx, y: cy } = toCanvas(e.clientX, e.clientY);
          setCanvasDropMenu({ x: cx, y: cy, sourceFragmentId });
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
            // Fragment wrappers are centered (translate -50%,-50%) so bounds are centered on x,y
            const hitFrags = state.fragments.filter(f => {
              const fw = f.width ?? LAYOUT_WIDTHS[f.layout] ?? 320;
              const fh = 480;
              const left = f.x - fw / 2;
              const right = f.x + fw / 2;
              const top = f.y - fh / 2;
              const bottom = f.y + fh / 2;
              return left < maxX && right > minX && top < maxY && bottom > minY;
            });
            const hitClusters = state.clusters.filter(c =>
              c.x - 8 < maxX && c.x + 8 > minX && c.y - 8 < maxY && c.y + 8 > minY
            );
            selectMany([...hitFrags.map(f => f.id), ...hitClusters.map(c => c.id)]);
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
  }, [updateDrag, endDrag, updateFragmentWidth, updateRect, finishRect, selectMany, state.fragments, state.clusters, addConnector, moveGroupElements, projectId]);

  // Keyboard: copy/paste + delete selected + undo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true';

      const isMod = e.metaKey || e.ctrlKey;

      if (e.key === 'Escape') {
        if (selectionDragging.current) {
          selectionDragging.current = false;
          finishRect();
        }
        deselectAll();
        return;
      }

      if (isMod && e.key === 'a') {
        e.preventDefault();
        selectMany([
          ...state.fragments.map(f => f.id),
          ...state.clusters.map(c => c.id),
        ]);
        return;
      }

      if (isMod && e.key === 'z') {
        e.preventDefault();
        undo();
        return;
      }

      if (isMod && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        setShowResetConfirm(true);
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

      if (!isTyping && (e.key === 'Delete' || e.key === 'Backspace')) {
        // Delete selected tether
        if (selectedTetherKey) {
          e.preventDefault();
          const fragId = selectedTetherKey.split('-').slice(1).join('-');
          unassignFromCluster(fragId);
          setSelectedTetherKey(null);
          return;
        }
        // Delete selected elements
        if (selectedIds.size > 0) {
          e.preventDefault();
          if (selectedIds.size > 3 && !window.confirm(`Delete ${selectedIds.size} selected elements?`)) return;
          const fragIds = new Set(state.fragments.map(f => f.id));
          selectedIds.forEach(id => {
            if (fragIds.has(id)) removeFragment(id);
            else removeCluster(id);
          });
          deselectAll();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.fragments, state.clusters, copiedFragment, selectedIds, selectedTetherKey, onFragmentCopy, onFragmentPaste, addCluster, addFragment, removeFragment, removeCluster, deselectAll, selectMany, finishRect, undo, unassignFromCluster]);

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

  // Session 17: run a prompt on a fragment's slot via drag-drop
  const handlePromptDrop = async (fragmentId: string, promptId: string) => {
    if (promptingFragmentIds.has(fragmentId)) return;
    const fragment = state.fragments.find(f => f.id === fragmentId);
    const prompt = PROMPTS.find(p => p.id === promptId);
    if (!fragment || !prompt) return;

    const targetSlotType: SlotType = prompt.allowedOutputSlots[0];
    setPromptingFragmentIds(prev => new Set(prev).add(fragmentId));
    try {
      const result = await runPromptOnSlot(fragment, prompt, targetSlotType);
      updateFragmentSlot(fragmentId, result.slotType, result.content, result.items, promptId);
    } catch (err) {
      console.error('Prompt run failed:', err);
    } finally {
      setPromptingFragmentIds(prev => {
        const next = new Set(prev);
        next.delete(fragmentId);
        return next;
      });
    }
  };

  // Session 17: run a prompt from the slot command menu
  const handleCommandMenuSelect = async (fragmentId: string, slotType: SlotType, prompt: PromptDefinition) => {
    if (promptingFragmentIds.has(fragmentId)) return;
    const fragment = state.fragments.find(f => f.id === fragmentId);
    if (!fragment) return;

    setPromptingFragmentIds(prev => new Set(prev).add(fragmentId));
    try {
      const result = await runPromptOnSlot(fragment, prompt, slotType);
      updateFragmentSlot(fragmentId, result.slotType, result.content, result.items, prompt.id);
    } catch (err) {
      console.error('Prompt run failed:', err);
    } finally {
      setPromptingFragmentIds(prev => {
        const next = new Set(prev);
        next.delete(fragmentId);
        return next;
      });
    }
  };

  // Session 18: add an accordion slot (stub content, no API call)
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

  const handleFragmentDoubleClick = (id: string) => {
    const fragment = state.fragments.find(f => f.id === id);
    if (fragment?.layout === 'text-note') {
      setEditingFragmentId(id);
    }
  };

  // Session 17: navigate to fragment from timeline banner
  const handleNavigateToFragment = (fragmentId: string) => {
    const fragment = state.fragments.find(f => f.id === fragmentId);
    if (!fragment || !wrapperRef.current) return;
    const { clientWidth: w, clientHeight: h } = wrapperRef.current;
    const currentZoom = transformRef.current.zoom;
    const newZoom = currentZoom < 0.4 ? 0.8 : currentZoom;
    const newX = w / 2 - fragment.x * newZoom;
    const newY = h / 2 - fragment.y * newZoom;
    setIsTransitioning(true);
    setTransform({ x: newX, y: newY, zoom: newZoom });
    setTimeout(() => setIsTransitioning(false), 400);
    setHighlightedFragmentId(fragmentId);
    setTimeout(() => setHighlightedFragmentId(null), 600);
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
        data-group-dragging={groupDragging || undefined}
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
          userConnections={userConnectionsList}
          connectPreview={connectPreview}
          pendingConnectionIds={pendingConnectionIds}
          fadingLabelIds={fadingLabelIds}
          selectedTetherKey={selectedTetherKey}
          onTetherSelect={key => { setSelectedTetherKey(key); deselectAll(); }}
          onTetherDelete={key => {
            const fragId = key.split('-').slice(1).join('-');
            unassignFromCluster(fragId);
            setSelectedTetherKey(null);
          }}
        />

        {state.fragments
          // Skip the seed fragment — rendered via SeedFragment below
          .filter(f => {
            const cluster = state.clusters.find(c => c.id === f.clusterId);
            return !cluster?.isSeed;
          })
          .map(f => (
          <FragmentComponent
            key={f.id}
            fragment={f}
            lod={lod}
            clusters={state.clusters}
            onMouseDown={e => {
              e.stopPropagation();
              if (f.anchored) return;
              // Group drag: mousedown on a selected element when multiple are selected
              if (
                activeTool === 'select' &&
                selectedIds.size > 1 &&
                selectedIds.has(f.id) &&
                !e.shiftKey &&
                !(e.target as HTMLElement).closest('.resize-handle') &&
                !(e.target as HTMLElement).closest('.connector-dot')
              ) {
                pushUndo();
                const startPositions = new Map<string, { x: number; y: number; type: 'fragment' | 'cluster' }>();
                state.fragments.filter(fr => selectedIds.has(fr.id))
                  .forEach(fr => startPositions.set(fr.id, { x: fr.x, y: fr.y, type: 'fragment' }));
                state.clusters.filter(c => selectedIds.has(c.id))
                  .forEach(c => startPositions.set(c.id, { x: c.x, y: c.y, type: 'cluster' }));
                groupDragRef.current = { startMouseX: e.clientX, startMouseY: e.clientY, startPositions };
                setGroupDragging(true);
                return;
              }
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
            onAnchor={anchorFragment}
            onUnanchor={unanchorFragment}
            onResetPositions={() => setShowResetConfirm(true)}
            onMoveToCluster={moveFragmentToCluster}
            onAddAccordion={handleAddAccordion}
            onConnectorDotStart={handleConnectorDotStart}
            onConnectHandleMouseDown={handleConnectHandleStart}
            isDropTarget={connectDropTargetId === f.id}
            onPromptDrop={handlePromptDrop}
            onNavigateSlotHistory={navigateSlotHistory}
            onEmptySlotDblClick={(fragmentId, slotType, x, y) =>
              setCommandMenu({ fragmentId, slotType, x, y })
            }
            isPivoting={f.id === pivotingFragmentId}
            pivotDisabled={pivotingFragmentId !== null && f.id !== pivotingFragmentId}
            pivotError={pivotErrors[f.id] ?? null}
            isSelected={selectedIds.has(f.id)}
            isEditing={editingFragmentId === f.id}
            onTitleChange={handleTitleChange}
            onDoubleClick={handleFragmentDoubleClick}
            onResizeStart={(handle, e) => handleResizeStart(f, handle, e)}
            dotDragging={dotDraggingFragmentId === f.id}
            isRunningPrompt={promptingFragmentIds.has(f.id)}
            isHighlighted={highlightedFragmentId === f.id}
            style={{ left: f.x, top: f.y }}
          />
        ))}

        {state.clusters.map(cluster => {
          if (cluster.isSeed) {
            // Find the seed fragment for context text
            const seedFrag = state.fragments.find(f => f.clusterId === cluster.id);
            const context = seedFrag?.slots.find(s => s.type === 'body')?.content ?? '';
            return (
              <SeedFragment
                key={cluster.id}
                query={state.query || cluster.label}
                context={context}
                x={cluster.x}
                y={cluster.y}
                onMouseDown={e => {
                  e.stopPropagation();
                  startDrag(cluster.id, 'cluster', e.clientX, e.clientY, cluster.x, cluster.y);
                }}
              />
            );
          }
          return (
            <Cluster
              key={cluster.id}
              cluster={cluster}
              lod={lod}
              onDragStart={(id, mx, my, ox, oy) =>
                startDrag(id, 'cluster', mx, my, ox, oy)
              }
            />
          );
        })}

        {/* Canvas drop menu — inside transform so it pans with canvas */}
        {canvasDropMenu && (
          <CanvasCommandMenu
            x={canvasDropMenu.x}
            y={canvasDropMenu.y}
            sourceFragmentId={canvasDropMenu.sourceFragmentId}
            onCreateFragment={(type: FragmentType, x: number, y: number) => {
              const FALLBACK_CLUSTER = 'canvas-drops';
              if (!state.clusters.some(c => c.id === FALLBACK_CLUSTER)) {
                addCluster({ id: FALLBACK_CLUSTER, x: 0, y: 0, label: 'canvas drops', isSeed: false });
              }
              const newId = addEmptyFragment(type, x, y, FALLBACK_CLUSTER);
              addConnector(canvasDropMenu.sourceFragmentId, newId);
            }}
            onCreateTextNote={(x: number, y: number) => {
              const TEXT_NOTES_CLUSTER = 'text-notes';
              if (!state.clusters.some(c => c.id === TEXT_NOTES_CLUSTER)) {
                addCluster({ id: TEXT_NOTES_CLUSTER, x: 0, y: 0, label: 'notes', isSeed: false });
              }
              const newId = uuidv4();
              addFragment({ id: newId, clusterId: TEXT_NOTES_CLUSTER, x, y, type: 'text-note', layout: 'text-note', title: '', slots: [], createdAtZoom: transformRef.current.zoom, starred: false });
              addConnector(canvasDropMenu.sourceFragmentId, newId);
              setEditingFragmentId(newId);
            }}
            onPivot={handlePivot}
            onCreateCluster={(x: number, y: number) => {
              const newClusterId = uuidv4();
              addCluster({ id: newClusterId, x, y, label: 'new cluster', isSeed: false });
            }}
            onClose={() => setCanvasDropMenu(null)}
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

      {/* Score badges — fixed position, float up on connection drawn */}
      {scoreBadges.map(b => (
        <div
          key={b.id}
          className="score-badge"
          style={{ left: b.x, top: b.y }}
        >
          +{b.delta}
        </div>
      ))}

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

      {ganttOpen && (
        <GanttView
          fragments={state.fragments}
          onClose={onGanttClose ?? (() => {})}
          onNavigateTo={handleNavigateToFragment}
        />
      )}

      <TimelineBanner fragments={state.fragments} onOpenGantt={onGanttOpen ?? (() => {})} />

      <Toolbar activeTool={activeTool} onSelect={switchTo} onNewExploration={onNewExploration} />

      <StatusBar
        zoom={transform.zoom}
        fragmentCount={state.fragments.length}
        clusterCount={state.clusters.length}
      />

      {/* Slot command menu — fixed position */}
      {commandMenu && (
        <CommandMenu
          target={commandMenu}
          onSelect={handleCommandMenuSelect}
          onClose={() => setCommandMenu(null)}
        />
      )}

      {/* Reset positions confirmation */}
      {showResetConfirm && (
        <div className="reset-confirm-panel">
          <span className="reset-confirm-panel__msg">Reset all positions to initial layout? This cannot be undone.</span>
          <button className="reset-confirm-panel__btn reset-confirm-panel__btn--cancel" onClick={() => setShowResetConfirm(false)}>Cancel</button>
          <button className="reset-confirm-panel__btn reset-confirm-panel__btn--confirm" onClick={() => { resetToInitialPositions(); setShowResetConfirm(false); }}>Reset positions</button>
        </div>
      )}
    </div>
  );
}
