import { useEffect, useRef, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Canvas as R3FCanvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { usePanZoom } from './usePanZoom';
import { useCanvas, getLOD } from './useCanvas';
import type { LOD } from './useCanvas';
import { useTools } from './useTools';
import { useSelection, MIN_FRAGMENT_WIDTH, MAX_FRAGMENT_WIDTH } from './useSelection';
import type { ResizeHandle } from './useSelection';
import { CanvasState, ConnectorRenderType, Fragment, FragmentType, LayoutType, AccordionSlot, SlotType, UserConnection } from '../api/types';
import { addUserConnection, updateUserConnectionAI, loadExplorationState } from './connections';
import { getCrossLinksForExploration, addCrossLink, getCrossLinks, updateCrossLinkLabel } from './crossLinks';
import { loadCanvasState } from '../storage/storage';
import { generatePivot, runPromptOnSlot, validateConnectionLabel, validateCrossLink } from '../api/generate';
import type { Transform } from './usePanZoom';
import type { ProjectMeta } from '../api/types';
import CrossLinkModal from '../ui/CrossLinkModal';
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

// ─── Scene coordinate helpers ─────────────────────────────────────────────────
// All canvas coords use CSS convention: x right, y down.
// Three.js uses y-up, so we negate y when placing objects in 3D space.

const Z_LAYERS = {
  background:  -10,
  connectors:    0,
  clusters:      1,
  fragments:     2,
  fragHovered:   5,
  fragSelected:  8,
};

// Per-fragment z variation: subtle depth spread so clusters have parallax.
// Deterministic per fragment ID → same value every render.
const DEPTH_SPREAD = 8;
function getFragmentZ(fragment: Fragment, clusterIndex: number): number {
  const hash = (fragment.id.charCodeAt(0) ?? 0) % 10;
  return Z_LAYERS.fragments + (clusterIndex % 3) * 3 + hash * 0.5;
}

// ─── Default widths per layout (mirrors CSS) ──────────────────────────────────
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

// ─── SceneSetup ───────────────────────────────────────────────────────────────
// Lives inside the R3F Canvas. Restores saved camera position on mount,
// then each frame updates LOD/zoom state and persists viewport.
interface SceneSetupProps {
  cameraRef: React.MutableRefObject<THREE.OrthographicCamera | null>;
  sizeRef: React.MutableRefObject<{ width: number; height: number }>;
  initialViewport: Transform;
  onLodChange: (lod: LOD) => void;
  onZoomChange: (zoom: number) => void;
  onViewportChange: (t: Transform) => void;
}

function SceneSetup({
  cameraRef, sizeRef, initialViewport,
  onLodChange, onZoomChange, onViewportChange,
}: SceneSetupProps) {
  const { camera, size } = useThree();
  const prevLod  = useRef<LOD>('full');
  const prevZoom = useRef<number>(0.7);
  const lastSave = useRef<number>(0);

  // Restore saved viewport on mount
  useEffect(() => {
    const cam = camera as THREE.OrthographicCamera;
    cameraRef.current = cam;
    sizeRef.current = { width: size.width, height: size.height };

    const vp = initialViewport;
    if (vp.zoom > 0 && (vp.x !== 0 || vp.y !== 0)) {
      cam.zoom = vp.zoom;
      cam.position.x = (size.width / 2 - vp.x) / vp.zoom;
      cam.position.y = -(size.height / 2 - vp.y) / vp.zoom;
    } else {
      cam.zoom = vp.zoom || 0.7;
      cam.position.x = 0;
      cam.position.y = 0;
    }
    cam.updateProjectionMatrix();
  // initialViewport intentionally excluded — only restore once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    sizeRef.current = { width: size.width, height: size.height };
  }, [size, sizeRef]);

  useFrame(() => {
    const cam = camera as THREE.OrthographicCamera;
    sizeRef.current = { width: size.width, height: size.height };

    // LOD threshold updates
    const newLod = getLOD(cam.zoom);
    if (newLod !== prevLod.current) {
      prevLod.current = newLod;
      onLodChange(newLod);
    }

    // Display zoom (throttled — skip tiny jitter)
    if (Math.abs(cam.zoom - prevZoom.current) > 0.004) {
      prevZoom.current = cam.zoom;
      onZoomChange(cam.zoom);
    }

    // Persist viewport (~1s debounce)
    const now = Date.now();
    if (now - lastSave.current > 1000) {
      lastSave.current = now;
      const tx = size.width  / 2 - cam.position.x * cam.zoom;
      const ty = size.height / 2 + cam.position.y * cam.zoom;
      onViewportChange({ x: tx, y: ty, zoom: cam.zoom });
    }
  });

  return null;
}

// ─── Canvas ───────────────────────────────────────────────────────────────────

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
  projects?: ProjectMeta[];
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
  projects = [],
}: CanvasProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const cameraRef  = useRef<THREE.OrthographicCamera | null>(null);
  const sizeRef    = useRef({ width: window.innerWidth, height: window.innerHeight });

  const { handleWheel, onMouseDown: panMouseDown, onMouseMove, onMouseUp } = usePanZoom(cameraRef, sizeRef, wrapperRef);

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

  // LOD and display zoom driven by SceneSetup via useFrame
  const [lod, setLod] = useState<LOD>(() => getLOD(initialState.viewport.zoom || 0.7));
  const [displayZoom, setDisplayZoom] = useState(initialState.viewport.zoom || 0.7);

  // Pivot state
  const [pivotingFragmentId, setPivotingFragmentId] = useState<string | null>(null);
  const [pivotErrors, setPivotErrors] = useState<Record<string, string>>({});

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

  // User connection draw handle state
  const connectHandleRef = useRef<{ sourceFragmentId: string; x1: number; y1: number } | null>(null);
  const [connectPreview, setConnectPreview] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [connectDropTargetId, setConnectDropTargetId] = useState<string | null>(null);
  const [userConnectionsList, setUserConnectionsList] = useState<UserConnection[]>(() =>
    loadExplorationState(projectId)?.userConnections ?? []
  );

  // Cross-link modal state
  const [crossLinkSourceFragmentId, setCrossLinkSourceFragmentId] = useState<string | null>(null);
  const [explorationCrossLinks, setExplorationCrossLinks] = useState(() =>
    getCrossLinksForExploration(projectId)
  );

  // AI-pending user connections
  const pendingConnectionsRef = useRef<Map<string, { heuristicStrength: 1 | 2 | 3; badgeX: number; badgeY: number }>>(new Map());
  const [pendingConnectionIds, setPendingConnectionIds] = useState<Set<string>>(new Set());
  const [fadingLabelIds, setFadingLabelIds] = useState<Set<string>>(new Set());

  // Floating score badges (screen-space fixed overlays)
  const [scoreBadges, setScoreBadges] = useState<Array<{ id: string; delta: number; x: number; y: number }>>([]);

  // Canvas drop menu — canvas-space coords
  const [canvasDropMenu, setCanvasDropMenu] = useState<{
    x: number; y: number; sourceFragmentId: string;
  } | null>(null);

  // Prompt running state
  const [promptingFragmentIds, setPromptingFragmentIds] = useState<Set<string>>(new Set());

  // Slot command menu — screen coords
  const [commandMenu, setCommandMenu] = useState<CommandMenuTarget | null>(null);

  // Timeline highlight state
  const [highlightedFragmentId, setHighlightedFragmentId] = useState<string | null>(null);

  // Reset confirmation dialog
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Selected tether
  const [selectedTetherKey, setSelectedTetherKey] = useState<string | null>(null);

  // Connector context menu
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

  // Group drag
  const groupDragRef = useRef<{
    startMouseX: number;
    startMouseY: number;
    startPositions: Map<string, { x: number; y: number; type: 'fragment' | 'cluster' }>;
  } | null>(null);
  const [groupDragging, setGroupDragging] = useState(false);

  // Selection rect dragging ref
  const selectionDragging = useRef(false);

  // ─── Camera helpers ──────────────────────────────────────────────────────

  // Convert screen coords to canvas-space coords using current camera state
  const toCanvas = useCallback((clientX: number, clientY: number) => {
    const cam = cameraRef.current;
    const rect = wrapperRef.current?.getBoundingClientRect() ?? { left: 0, top: 0 };
    const { width, height } = sizeRef.current;
    const screenX = clientX - rect.left;
    const screenY = clientY - rect.top;
    const zoom = cam?.zoom ?? 0.7;
    const camX = cam?.position.x ?? 0;
    const camY = cam?.position.y ?? 0;
    return {
      x: camX + (screenX - width / 2) / zoom,
      y: (screenY - height / 2) / zoom - camY,
    };
  }, []);

  // Convert canvas-space coords to screen-space (for overlays drawn outside R3F)
  const canvasToScreen = useCallback((cx: number, cy: number) => {
    const cam = cameraRef.current;
    const { width, height } = sizeRef.current;
    const zoom = cam?.zoom ?? 0.7;
    const camX = cam?.position.x ?? 0;
    const camY = cam?.position.y ?? 0;
    return {
      x: width  / 2 + (cx - camX) * zoom,
      y: height / 2 + (cy + camY) * zoom,
    };
  }, []);

  // Animate/navigate camera to a CSS-transform offset (tx/ty = screen translation)
  const navigateCamera = useCallback((tx: number, ty: number, zoom: number) => {
    const cam = cameraRef.current;
    const { width, height } = sizeRef.current;
    if (!cam) return;
    cam.zoom = zoom;
    cam.position.x = (width / 2 - tx) / zoom;
    cam.position.y = -(height / 2 - ty) / zoom;
    cam.updateProjectionMatrix();
  }, []);

  // ─── Effects ─────────────────────────────────────────────────────────────

  // Alt key: text-select cursor on fragment cards
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Alt') el.classList.add('canvas-wrapper--alt'); };
    const onKeyUp   = (e: KeyboardEvent) => { if (e.key === 'Alt') el.classList.remove('canvas-wrapper--alt'); };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup',   onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup',   onKeyUp);
      el.classList.remove('canvas-wrapper--alt');
    };
  }, []);

  // Prevent accidental text selection during canvas drag
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

  // Passive wheel listener on wrapper
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

  // Reload user connections on tab switch
  useEffect(() => {
    setUserConnectionsList(loadExplorationState(projectId)?.userConnections ?? []);
    setExplorationCrossLinks(getCrossLinksForExploration(projectId));
  }, [projectId]);

  // Reload cross-links when any cross-link is added/updated
  useEffect(() => {
    const handler = () => setExplorationCrossLinks(getCrossLinksForExploration(projectId));
    window.addEventListener('webs-cross-links-changed', handler);
    return () => window.removeEventListener('webs-cross-links-changed', handler);
  }, [projectId]);

  // ─── Drag handlers ───────────────────────────────────────────────────────

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
      const zoom = cameraRef.current?.zoom ?? 0.7;

      if (groupDragRef.current) {
        const gd = groupDragRef.current;
        const dx = (e.clientX - gd.startMouseX) / zoom;
        const dy = (e.clientY - gd.startMouseY) / zoom;
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
        const rawDx = (e.clientX - rd.startMouseX) / zoom;
        const delta = rd.isLeft ? -rawDx : rawDx;
        const newWidth = Math.max(MIN_FRAGMENT_WIDTH, Math.min(MAX_FRAGMENT_WIDTH, rd.origWidth + delta));
        updateFragmentWidth(rd.fragmentId, newWidth);
        return;
      }
      if (selectionDragging.current) {
        const pt = toCanvas(e.clientX, e.clientY);
        updateRect(pt.x, pt.y);
        return;
      }
      updateDrag(e.clientX, e.clientY, zoom);
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
            const badgeId = crypto.randomUUID();
            setScoreBadges(prev => [...prev, { id: badgeId, delta: heuristicStrength * 10, x: e.clientX, y: e.clientY }]);
            setTimeout(() => setScoreBadges(prev => prev.filter(b => b.id !== badgeId)), 1000);
            pendingConnectionsRef.current.set(connectionId, { heuristicStrength, badgeX: e.clientX, badgeY: e.clientY });
            setPendingConnectionIds(prev => new Set(prev).add(connectionId));
            const sourceFragment = state.fragments.find(f => f.id === sourceFragmentId);
            const targetFragment = state.fragments.find(f => f.id === targetId);
            if (sourceFragment && targetFragment) {
              validateConnectionLabel(sourceFragment, targetFragment).then(aiResult => {
                const pending = pendingConnectionsRef.current.get(connectionId);
                pendingConnectionsRef.current.delete(connectionId);
                setPendingConnectionIds(prev => { const next = new Set(prev); next.delete(connectionId); return next; });
                if (!aiResult) {
                  updateUserConnectionAI(projectId, connectionId, { label: '', strength: heuristicStrength, rationale: '' });
                  setUserConnectionsList(loadExplorationState(projectId)?.userConnections ?? []);
                  return;
                }
                setFadingLabelIds(prev => new Set(prev).add(connectionId));
                setTimeout(() => {
                  const update = updateUserConnectionAI(projectId, connectionId, aiResult);
                  setUserConnectionsList(loadExplorationState(projectId)?.userConnections ?? []);
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
        const el = document.elementFromPoint(e.clientX, e.clientY);
        const fragEl = el?.closest('[data-fragment-id]');
        const targetId = fragEl?.getAttribute('data-fragment-id');
        if (targetId && targetId !== sourceFragmentId) {
          addConnector(sourceFragmentId, targetId);
        } else {
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
            const hitFrags = state.fragments.filter(f => {
              const fw = f.width ?? LAYOUT_WIDTHS[f.layout] ?? 320;
              const fh = 480;
              const left   = f.x - fw / 2;
              const right  = f.x + fw / 2;
              const top    = f.y - fh / 2;
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
    window.addEventListener('mouseup',   handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup',   handleMouseUp);
    };
  }, [updateDrag, endDrag, updateFragmentWidth, updateRect, finishRect, selectMany, state.fragments, state.clusters, addConnector, moveGroupElements, projectId, toCanvas]);

  // ─── Keyboard ────────────────────────────────────────────────────────────

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
        if (selectedTetherKey) {
          e.preventDefault();
          const fragId = selectedTetherKey.split('-').slice(1).join('-');
          unassignFromCluster(fragId);
          setSelectedTetherKey(null);
          return;
        }
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

  // ─── Canvas event handlers ───────────────────────────────────────────────

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('[data-fragment-id]')) return;
    if (activeTool === 'text') return;

    if (activeTool === 'select') {
      deselectAll();
      const pt = toCanvas(e.clientX, e.clientY);
      startRect(pt.x, pt.y);
      selectionDragging.current = true;
      return;
    }

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
      createdAtZoom: cameraRef.current?.zoom ?? 0.7,
      starred: false,
    });

    setEditingFragmentId(id);
    switchTo('select');
  };

  // ─── Feature handlers ────────────────────────────────────────────────────

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
      const cam = cameraRef.current;
      if (el && cam) {
        const currentZoom = cam.zoom;
        const newX = el.clientWidth  / 2 - midX * currentZoom;
        const newY = el.clientHeight / 2 - midY * currentZoom;
        navigateCamera(newX, newY, currentZoom);
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

  const handlePromptDrop = async (fragmentId: string, promptId: string) => {
    if (promptingFragmentIds.has(fragmentId)) return;
    const fragment = state.fragments.find(f => f.id === fragmentId);
    const prompt   = PROMPTS.find(p => p.id === promptId);
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
    pushUndo();
    const isLeft = handle === 'nw' || handle === 'w' || handle === 'sw';
    resizeDragRef.current = {
      fragmentId:  fragment.id,
      handle,
      startMouseX: e.clientX,
      origWidth:   fragment.width ?? LAYOUT_WIDTHS[fragment.layout] ?? 320,
      origX:       fragment.x,
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

  const handleNavigateToFragment = (fragmentId: string) => {
    const fragment = state.fragments.find(f => f.id === fragmentId);
    if (!fragment || !wrapperRef.current) return;
    const { clientWidth: w, clientHeight: h } = wrapperRef.current;
    const currentZoom = cameraRef.current?.zoom ?? 0.7;
    const newZoom = currentZoom < 0.4 ? 0.8 : currentZoom;
    const newX = w / 2 - fragment.x * newZoom;
    const newY = h / 2 - fragment.y * newZoom;
    navigateCamera(newX, newY, newZoom);
    setHighlightedFragmentId(fragmentId);
    setTimeout(() => setHighlightedFragmentId(null), 600);
  };

  const handleConnectorContextMenu = (e: React.MouseEvent, connectorId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setConnectorMenu({ connectorId, screenX: e.clientX, screenY: e.clientY });
  };

  const explorationDepthScore = userConnectionsList.reduce((sum, c) => sum + c.strength * 10, 0);

  const handleLinkToExploration = (fragmentId: string) => {
    setCrossLinkSourceFragmentId(fragmentId);
  };

  const handleCrossLinkConfirm = (targetExplorationId: string, targetFragmentId: string) => {
    if (!crossLinkSourceFragmentId) return;
    const link = {
      id:              crypto.randomUUID(),
      explorationAId:  projectId,
      fragmentAId:     crossLinkSourceFragmentId,
      explorationBId:  targetExplorationId,
      fragmentBId:     targetFragmentId,
      label:           '',
      createdAt:       Date.now(),
    };
    addCrossLink(link);
    setExplorationCrossLinks(getCrossLinksForExploration(projectId));

    if (getCrossLinks().length === 1 && !localStorage.getItem('webs_first_cross_link_shown')) {
      localStorage.setItem('webs_first_cross_link_shown', 'true');
      const overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(210,243,76,0.1);pointer-events:none;z-index:9999;';
      document.body.appendChild(overlay);
      overlay.animate(
        [{ opacity: 0 }, { opacity: 1 }, { opacity: 1 }, { opacity: 0 }],
        { duration: 1800, easing: 'ease-in-out', fill: 'forwards' }
      ).onfinish = () => overlay.remove();
    }

    const fragA = state.fragments.find(f => f.id === crossLinkSourceFragmentId);
    if (fragA) {
      const targetCanvas = loadCanvasState(targetExplorationId);
      const fragB = targetCanvas?.fragments.find(f => f.id === targetFragmentId);
      if (fragB) {
        const bodyA = fragA.slots.find(s => s.type === 'body')?.content ?? '';
        const bodyB = fragB.slots.find(s => s.type === 'body')?.content ?? '';
        validateCrossLink(
          { type: fragA.type, title: fragA.title, body: bodyA },
          { type: fragB.type, title: fragB.title, body: bodyB },
        ).then(result => {
          if (result?.label) updateCrossLinkLabel(link.id, result.label);
        }).catch(() => {});
      }
    }

    setCrossLinkSourceFragmentId(null);
  };

  const activeConnector = connectorMenu
    ? state.connectors.find(c => c.id === connectorMenu.connectorId)
    : null;

  const canvasClass = `canvas-wrapper canvas--${activeTool}-tool`;

  // ─── Cluster index map (for z-depth variation) ───────────────────────────
  const clusterIndexById = new Map(state.clusters.map((c, i) => [c.id, i]));

  // ─── Render ──────────────────────────────────────────────────────────────

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
      {/*
        ── R3F scene ──────────────────────────────────────────────────────────
        Everything lives here: background, connectors, clusters, fragments.
        No canvas-content CSS div. One coordinate system.
      */}
      <R3FCanvas
        orthographic
        camera={{ zoom: initialState.viewport.zoom || 0.7, position: [0, 0, 100], near: 0.1, far: 2000 }}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        gl={{ antialias: false, alpha: true }}
        dpr={1}
      >
        {/* Dot grid background (shader-based) */}
        <CanvasBackground />

        {/* Camera restore + LOD/zoom tracking */}
        <SceneSetup
          cameraRef={cameraRef}
          sizeRef={sizeRef}
          initialViewport={initialState.viewport}
          onLodChange={setLod}
          onZoomChange={setDisplayZoom}
          onViewportChange={updateViewport}
        />

        {/*
          Connectors: Three.js Lines + Html labels.
          Rendered at z=0 (below fragments).
          NOTE: Html inside R3F uses a DOM portal — pointer events work
          through the 'pointerEvents: auto' style on the Html component.
        */}
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

        {/*
          Cluster spawn points.
          Each cluster renders its label/marker as Html anchored to its canvas position.
          position={[x, -y, Z_LAYERS.clusters]}: y-flipped for Three.js y-up.
        */}
        {state.clusters.map(cluster => {
          if (cluster.isSeed) {
            const seedFrag  = state.fragments.find(f => f.clusterId === cluster.id);
            const context   = seedFrag?.slots.find(s => s.type === 'body')?.content ?? '';
            return (
              <group
                key={cluster.id}
                position={[cluster.x, -cluster.y, Z_LAYERS.fragments]}
              >
                <Html
                  transform={false}
                  occlude={false}
                  center={false}
                  style={{ pointerEvents: 'auto', userSelect: 'none' }}
                  zIndexRange={[100, 200]}
                >
                  <SeedFragment
                    query={state.query || cluster.label}
                    context={context}
                    x={cluster.x}
                    y={cluster.y}
                    onMouseDown={e => {
                      e.stopPropagation();
                      startDrag(cluster.id, 'cluster', e.clientX, e.clientY, cluster.x, cluster.y);
                    }}
                  />
                </Html>
              </group>
            );
          }

          return (
            <group
              key={cluster.id}
              position={[cluster.x, -cluster.y, Z_LAYERS.clusters]}
            >
              <Html
                transform={false}
                occlude={false}
                center={false}
                style={{ pointerEvents: 'auto', userSelect: 'none' }}
                zIndexRange={[50, 100]}
              >
                <Cluster
                  cluster={cluster}
                  lod={lod}
                  onDragStart={(id, mx, my, ox, oy) =>
                    startDrag(id, 'cluster', mx, my, ox, oy)
                  }
                />
              </Html>
            </group>
          );
        })}

        {/*
          Fragment cards: Html anchored to each fragment's canvas position.
          Fragment.tsx uses position:absolute — left:0,top:0 places it at
          the Html anchor (the Three.js group's projected screen position).
          Fragment is off-limits, so we pass style={{ left: 0, top: 0 }}.

          NOTE: Performance — Html creates one DOM portal per fragment.
          Fine for 12-15 visible fragments. Flag if count exceeds 50.
        */}
        {state.fragments
          .filter(f => {
            const cluster = state.clusters.find(c => c.id === f.clusterId);
            return !cluster?.isSeed;
          })
          .map(f => {
            const clusterIdx = clusterIndexById.get(f.clusterId) ?? 0;
            const fragZ = getFragmentZ(f, clusterIdx);
            const isSelected = selectedIds.has(f.id);
            const zIndex = isSelected
              ? Z_LAYERS.fragSelected
              : fragZ;

            return (
              <group key={f.id} position={[f.x, -f.y, zIndex]}>
                <Html
                  transform={false}
                  occlude={false}
                  center={false}
                  style={{ pointerEvents: 'auto', userSelect: 'none' }}
                  zIndexRange={isSelected ? [300, 400] : [100, 200]}
                >
                  <FragmentComponent
                    fragment={f}
                    lod={lod}
                    clusters={state.clusters}
                    onMouseDown={e => {
                      e.stopPropagation();
                      if (f.anchored) return;
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
                    onLinkToExploration={handleLinkToExploration}
                    depthScore={explorationDepthScore}
                    isDropTarget={connectDropTargetId === f.id}
                    onPromptDrop={handlePromptDrop}
                    onNavigateSlotHistory={navigateSlotHistory}
                    onEmptySlotDblClick={(fragmentId, slotType, x, y) =>
                      setCommandMenu({ fragmentId, slotType, x, y })
                    }
                    isPivoting={f.id === pivotingFragmentId}
                    pivotDisabled={pivotingFragmentId !== null && f.id !== pivotingFragmentId}
                    pivotError={pivotErrors[f.id] ?? null}
                    isSelected={isSelected}
                    isEditing={editingFragmentId === f.id}
                    onTitleChange={handleTitleChange}
                    onDoubleClick={handleFragmentDoubleClick}
                    onResizeStart={(handle, e) => handleResizeStart(f, handle, e)}
                    dotDragging={dotDraggingFragmentId === f.id}
                    isRunningPrompt={promptingFragmentIds.has(f.id)}
                    isHighlighted={highlightedFragmentId === f.id}
                    style={{ left: 0, top: 0 }}
                  />
                </Html>
              </group>
            );
          })}

        {/*
          Canvas drop menu — appears at the canvas position where user dropped
          a connector dot. Rendered as Html inside the scene so it follows pan.
          Callbacks use stored canvasDropMenu coords (not the x/y props passed
          back from CanvasCommandMenu, which are screen-space 0,0).
        */}
        {canvasDropMenu && (
          <group position={[canvasDropMenu.x, -canvasDropMenu.y, Z_LAYERS.fragSelected + 5]}>
            <Html
              transform={false}
              occlude={false}
              center={false}
              zIndexRange={[500, 600]}
              style={{ pointerEvents: 'auto' }}
            >
              <CanvasCommandMenu
                x={0}
                y={0}
                sourceFragmentId={canvasDropMenu.sourceFragmentId}
                onCreateFragment={(type: FragmentType) => {
                  const FALLBACK_CLUSTER = 'canvas-drops';
                  if (!state.clusters.some(c => c.id === FALLBACK_CLUSTER)) {
                    addCluster({ id: FALLBACK_CLUSTER, x: 0, y: 0, label: 'canvas drops', isSeed: false });
                  }
                  const newId = addEmptyFragment(type, canvasDropMenu.x, canvasDropMenu.y, FALLBACK_CLUSTER);
                  addConnector(canvasDropMenu.sourceFragmentId, newId);
                  setCanvasDropMenu(null);
                }}
                onCreateTextNote={() => {
                  const TEXT_NOTES_CLUSTER = 'text-notes';
                  if (!state.clusters.some(c => c.id === TEXT_NOTES_CLUSTER)) {
                    addCluster({ id: TEXT_NOTES_CLUSTER, x: 0, y: 0, label: 'notes', isSeed: false });
                  }
                  const newId = uuidv4();
                  addFragment({
                    id: newId,
                    clusterId: TEXT_NOTES_CLUSTER,
                    x: canvasDropMenu.x,
                    y: canvasDropMenu.y,
                    type: 'text-note',
                    layout: 'text-note',
                    title: '',
                    slots: [],
                    createdAtZoom: cameraRef.current?.zoom ?? 0.7,
                    starred: false,
                  });
                  addConnector(canvasDropMenu.sourceFragmentId, newId);
                  setEditingFragmentId(newId);
                  setCanvasDropMenu(null);
                }}
                onPivot={handlePivot}
                onCreateCluster={() => {
                  const newClusterId = uuidv4();
                  addCluster({ id: newClusterId, x: canvasDropMenu.x, y: canvasDropMenu.y, label: 'new cluster', isSeed: false });
                  setCanvasDropMenu(null);
                }}
                onClose={() => setCanvasDropMenu(null)}
              />
            </Html>
          </group>
        )}
      </R3FCanvas>

      {/*
        ── Screen-space overlays (outside R3F) ────────────────────────────────
        These elements need to be in DOM space and are not part of the 3D scene.
      */}

      {/* Selection rect — canvas-space coords converted to screen-space for rendering */}
      {selectionRect && (() => {
        const tl = canvasToScreen(
          Math.min(selectionRect.startX, selectionRect.endX),
          Math.min(selectionRect.startY, selectionRect.endY),
        );
        const br = canvasToScreen(
          Math.max(selectionRect.startX, selectionRect.endX),
          Math.max(selectionRect.startY, selectionRect.endY),
        );
        return (
          <div
            className="selection-rect"
            style={{
              position: 'absolute',
              left:   tl.x,
              top:    tl.y,
              width:  Math.max(0, br.x - tl.x),
              height: Math.max(0, br.y - tl.y),
            }}
          />
        );
      })()}

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

      {/* Connector context menu */}
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
        zoom={displayZoom}
        fragmentCount={state.fragments.length}
        clusterCount={state.clusters.length}
        hasLinks={explorationCrossLinks.length > 0}
      />

      {commandMenu && (
        <CommandMenu
          target={commandMenu}
          onSelect={handleCommandMenuSelect}
          onClose={() => setCommandMenu(null)}
        />
      )}

      {crossLinkSourceFragmentId && (() => {
        const sourceFragment = state.fragments.find(f => f.id === crossLinkSourceFragmentId);
        return sourceFragment ? (
          <CrossLinkModal
            sourceFragment={sourceFragment}
            sourceExplorationId={projectId}
            projects={projects}
            onConfirm={handleCrossLinkConfirm}
            onClose={() => setCrossLinkSourceFragmentId(null)}
          />
        ) : null;
      })()}

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
