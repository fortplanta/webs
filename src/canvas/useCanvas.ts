import { useState, useCallback, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { CanvasState, Cluster, Fragment, Connector, ConnectorRenderType, AccordionSlot, FragmentType, LayoutType, SlotType, SlotVersion } from '../api/types';
import { zoom as zoomTokens } from '../tokens/tokens';
import { saveCanvasState } from '../storage/storage';
import { INITIAL_STATE } from '../api/mock';

export type LOD = 'full' | 'compact' | 'macro';

export function getLOD(zoom: number): LOD {
  if (zoom > zoomTokens.lodFull) return 'full';
  if (zoom > zoomTokens.lodCompact) return 'compact';
  return 'macro';
}

export { INITIAL_STATE };

export const EMPTY_CANVAS_STATE: CanvasState = {
  clusters: [],
  fragments: [],
  connectors: [],
  viewport: { x: 0, y: 0, zoom: zoomTokens.initial },
  query: '',
  createdAt: 0,
};

type DragState = {
  id: string;
  kind: 'fragment' | 'cluster';
  startMouseX: number;
  startMouseY: number;
  origX: number;
  origY: number;
  preDragSnapshot: CanvasState;
} | null;

const MAX_UNDO = 50;

export function useCanvas(projectId: string, initial: CanvasState = EMPTY_CANVAS_STATE) {
  // Filter out legacy tether/weak connectors that may exist in saved state
  const filteredInitial: CanvasState = {
    ...initial,
    connectors: initial.connectors.filter(
      c => c.type === 'standard' || c.type === 'strong'
    ),
  };
  const [state, setState] = useState<CanvasState>(filteredInitial);
  const dragRef = useRef<DragState>(null);

  // Synchronous ref to current state — safe to read inside any callback
  const stateRef = useRef<CanvasState>(filteredInitial);
  stateRef.current = state; // updated every render before any callbacks run

  const undoStack = useRef<CanvasState[]>([]);

  // Stable — reads refs only, no deps needed
  const pushUndo = useCallback(() => {
    undoStack.current = [...undoStack.current.slice(-(MAX_UNDO - 1)), stateRef.current];
  }, []);

  const undo = useCallback(() => {
    const prev = undoStack.current[undoStack.current.length - 1];
    if (!prev) return;
    undoStack.current = undoStack.current.slice(0, -1);
    // Restore content but preserve current viewport
    setState(cur => ({ ...prev, viewport: cur.viewport }));
  }, []);

  const startDrag = useCallback((
    id: string,
    kind: 'fragment' | 'cluster',
    mouseX: number,
    mouseY: number,
    origX: number,
    origY: number,
  ) => {
    dragRef.current = {
      id, kind,
      startMouseX: mouseX, startMouseY: mouseY,
      origX, origY,
      preDragSnapshot: stateRef.current,
    };
  }, []);

  const updateDrag = useCallback((mouseX: number, mouseY: number, zoom: number) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = (mouseX - drag.startMouseX) / zoom;
    const dy = (mouseY - drag.startMouseY) / zoom;
    const newX = drag.origX + dx;
    const newY = drag.origY + dy;
    if (drag.kind === 'fragment') {
      setState(prev => ({
        ...prev,
        fragments: prev.fragments.map(f =>
          f.id === drag.id ? { ...f, x: newX, y: newY } : f
        ),
      }));
    } else {
      // When dragging a cluster, co-move any anchored child fragments
      setState(prev => {
        const cluster = prev.clusters.find(c => c.id === drag.id);
        if (!cluster) return prev;
        const oldX = cluster.x;
        const oldY = cluster.y;
        const ddx = newX - oldX;
        const ddy = newY - oldY;
        return {
          ...prev,
          clusters: prev.clusters.map(c =>
            c.id === drag.id ? { ...c, x: newX, y: newY } : c
          ),
          fragments: prev.fragments.map(f =>
            f.clusterId === drag.id && f.anchored
              ? { ...f, x: f.x + ddx, y: f.y + ddy }
              : f
          ),
        };
      });
    }
  }, []);

  // targetFragmentId: if set and differs from dragged fragment, creates a connector
  const endDrag = useCallback((targetFragmentId?: string) => {
    const drag = dragRef.current;
    if (!drag) return;

    if (targetFragmentId && drag.kind === 'fragment' && targetFragmentId !== drag.id) {
      // Drop-to-connect: use pre-drag snapshot as undo point
      undoStack.current = [...undoStack.current.slice(-(MAX_UNDO - 1)), drag.preDragSnapshot];
      setState(prev => ({
        ...prev,
        fragments: prev.fragments.map(f =>
          f.id === drag.id ? { ...f, x: drag.origX, y: drag.origY } : f
        ),
        connectors: [...prev.connectors, {
          id: `conn-${Date.now()}`,
          sourceId: drag.id,
          targetId: targetFragmentId,
          type: 'standard' as const,
          label: '',
        }],
      }));
    } else {
      // Plain move: push undo only if position meaningfully changed
      const curItem = drag.kind === 'fragment'
        ? stateRef.current.fragments.find(f => f.id === drag.id)
        : stateRef.current.clusters.find(c => c.id === drag.id);
      if (curItem && (Math.abs(curItem.x - drag.origX) > 2 || Math.abs(curItem.y - drag.origY) > 2)) {
        undoStack.current = [...undoStack.current.slice(-(MAX_UNDO - 1)), drag.preDragSnapshot];
      }
    }
    dragRef.current = null;
  }, []);

  const isDragging = useCallback(() => dragRef.current !== null, []);

  const updateFragmentWidth = useCallback((id: string, width: number) => {
    setState(prev => ({
      ...prev,
      fragments: prev.fragments.map(f => f.id === id ? { ...f, width } : f),
    }));
  }, []);

  const updateFragmentTitle = useCallback((id: string, title: string) => {
    setState(prev => ({
      ...prev,
      fragments: prev.fragments.map(f => f.id === id ? { ...f, title } : f),
    }));
  }, []);

  const updateConnectorLabel = useCallback((id: string, label: string) => {
    setState(prev => ({
      ...prev,
      connectors: prev.connectors.map(c => c.id === id ? { ...c, label } : c),
    }));
  }, []);

  const deleteConnector = useCallback((id: string) => {
    undoStack.current = [...undoStack.current.slice(-(MAX_UNDO - 1)), stateRef.current];
    setState(prev => ({
      ...prev,
      connectors: prev.connectors.filter(c => c.id !== id),
    }));
  }, []);

  const promoteConnector = useCallback((id: string, type: 'standard' | 'strong') => {
    setState(prev => ({
      ...prev,
      connectors: prev.connectors.map(c => c.id === id ? { ...c, type } : c),
    }));
  }, []);

  const updateConnectorRenderType = useCallback((id: string, renderType: ConnectorRenderType) => {
    setState(prev => ({
      ...prev,
      connectors: prev.connectors.map(c => c.id === id ? { ...c, renderType } : c),
    }));
  }, []);

  const addCluster = useCallback((cluster: Cluster) => {
    setState(prev => ({ ...prev, clusters: [...prev.clusters, cluster] }));
  }, []);

  const addPivotCluster = useCallback((
    cluster: Cluster,
    fragments: Fragment[],
    interConnector: Connector,
  ) => {
    undoStack.current = [...undoStack.current.slice(-(MAX_UNDO - 1)), stateRef.current];
    setState(prev => ({
      ...prev,
      clusters: [...prev.clusters, cluster],
      fragments: [...prev.fragments, ...fragments],
      connectors: [...prev.connectors, interConnector],
    }));
  }, []);

  const addFragment = useCallback((fragment: Fragment) => {
    undoStack.current = [...undoStack.current.slice(-(MAX_UNDO - 1)), stateRef.current];
    setState(prev => ({
      ...prev,
      fragments: [...prev.fragments, fragment],
    }));
  }, []);

  const toggleStarFragment = useCallback((fragmentId: string) => {
    setState(prev => ({
      ...prev,
      fragments: prev.fragments.map(f =>
        f.id === fragmentId ? { ...f, starred: !f.starred } : f
      ),
    }));
  }, []);

  const removeFragment = useCallback((fragmentId: string) => {
    undoStack.current = [...undoStack.current.slice(-(MAX_UNDO - 1)), stateRef.current];
    setState(prev => ({
      ...prev,
      fragments: prev.fragments.filter(f => f.id !== fragmentId),
      connectors: prev.connectors.filter(
        c => c.sourceId !== fragmentId && c.targetId !== fragmentId
      ),
    }));
  }, []);

  const duplicateFragment = useCallback((fragmentId: string) => {
    const src = stateRef.current.fragments.find(f => f.id === fragmentId);
    if (!src) return;
    undoStack.current = [...undoStack.current.slice(-(MAX_UNDO - 1)), stateRef.current];
    setState(prev => ({
      ...prev,
      fragments: [...prev.fragments, { ...src, id: uuidv4(), x: src.x + 24, y: src.y + 24 }],
    }));
  }, []);

  const pinFragment = useCallback((fragmentId: string) => {
    setState(prev => ({
      ...prev,
      fragments: prev.fragments.map(f =>
        f.id === fragmentId ? { ...f, pinned: !f.pinned } : f
      ),
    }));
  }, []);

  const moveFragmentToCluster = useCallback((fragmentId: string, clusterId: string) => {
    undoStack.current = [...undoStack.current.slice(-(MAX_UNDO - 1)), stateRef.current];
    setState(prev => ({
      ...prev,
      fragments: prev.fragments.map(f =>
        f.id === fragmentId ? { ...f, clusterId } : f
      ),
    }));
  }, []);

  // Session 20: atomically move any mix of fragments and cluster spawns in one render
  const moveGroupElements = useCallback((
    updates: Array<{ id: string; type: 'fragment' | 'cluster'; x: number; y: number }>
  ) => {
    const fragMap = new Map(updates.filter(u => u.type === 'fragment').map(u => [u.id, u]));
    const clusterMap = new Map(updates.filter(u => u.type === 'cluster').map(u => [u.id, u]));
    setState(prev => ({
      ...prev,
      fragments: prev.fragments.map(f => { const u = fragMap.get(f.id); return u ? { ...f, x: u.x, y: u.y } : f; }),
      clusters: prev.clusters.map(c => { const u = clusterMap.get(c.id); return u ? { ...c, x: u.x, y: u.y } : c; }),
    }));
  }, []);

  // Session 20: remove a cluster spawn and all its child fragments + their connectors
  const removeCluster = useCallback((clusterId: string) => {
    undoStack.current = [...undoStack.current.slice(-(MAX_UNDO - 1)), stateRef.current];
    setState(prev => {
      const childFragIds = new Set(prev.fragments.filter(f => f.clusterId === clusterId).map(f => f.id));
      return {
        ...prev,
        clusters: prev.clusters.filter(c => c.id !== clusterId),
        fragments: prev.fragments.filter(f => f.clusterId !== clusterId),
        connectors: prev.connectors.filter(c => !childFragIds.has(c.sourceId) && !childFragIds.has(c.targetId)),
      };
    });
  }, []);

  const addConnector = useCallback((sourceId: string, targetId: string) => {
    undoStack.current = [...undoStack.current.slice(-(MAX_UNDO - 1)), stateRef.current];
    const id = `conn-${uuidv4()}`;
    setState(prev => ({
      ...prev,
      connectors: [...prev.connectors, { id, sourceId, targetId, type: 'standard', label: '' }],
    }));
    return id;
  }, []);

  const addAccordionSlot = useCallback((fragmentId: string, slot: AccordionSlot) => {
    setState(prev => ({
      ...prev,
      fragments: prev.fragments.map(f => {
        if (f.id !== fragmentId) return f;
        const existing = f.accordions ?? [];
        return { ...f, accordions: [slot, ...existing] };
      }),
    }));
  }, []);

  // Session 17: update a fragment slot with full history tracking
  const updateFragmentSlot = useCallback((
    fragmentId: string,
    slotType: SlotType,
    content: string | undefined,
    items: string[] | undefined,
    promptId?: string,
  ) => {
    setState(prev => ({
      ...prev,
      fragments: prev.fragments.map(f => {
        if (f.id !== fragmentId) return f;
        const MAX_HISTORY = 10;
        const existingSlot = f.slots.find(s => s.type === slotType);
        const version: SlotVersion = {
          content: existingSlot?.content,
          items: existingSlot?.items,
          promptId: existingSlot?.history?.[existingSlot.historyIndex ?? (existingSlot.history?.length ?? 1) - 1]?.promptId,
          producedAt: Date.now(),
        };
        const prevHistory = existingSlot?.history ?? [];
        const newHistory = [...prevHistory.slice(-(MAX_HISTORY - 1)), version];

        let newSlots = f.slots.filter(s => s.type !== slotType);
        newSlots = [...newSlots, {
          type: slotType,
          content,
          items,
          history: newHistory,
          historyIndex: newHistory.length,
        }];

        const newEmptySlots = (f.emptySlots ?? []).filter(t => t !== slotType);

        return { ...f, slots: newSlots, emptySlots: newEmptySlots };
      }),
    }));
  // promptId recorded in history version above
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Session 17: navigate slot history
  const navigateSlotHistory = useCallback((
    fragmentId: string,
    slotType: SlotType,
    direction: 'back' | 'forward',
  ) => {
    setState(prev => ({
      ...prev,
      fragments: prev.fragments.map(f => {
        if (f.id !== fragmentId) return f;
        const slot = f.slots.find(s => s.type === slotType);
        if (!slot || !slot.history || slot.history.length === 0) return f;

        const currentIndex = slot.historyIndex ?? slot.history.length;
        const maxIndex = slot.history.length;
        const newIndex = direction === 'back'
          ? Math.max(0, currentIndex - 1)
          : Math.min(maxIndex, currentIndex + 1);

        if (newIndex === currentIndex) return f;

        const version = newIndex < slot.history.length
          ? slot.history[newIndex]
          : { content: slot.content, items: slot.items };

        const newSlots = f.slots.map(s =>
          s.type !== slotType ? s : {
            ...s,
            content: version.content,
            items: version.items,
            historyIndex: newIndex,
          }
        );

        return { ...f, slots: newSlots };
      }),
    }));
  }, []);

  const addEmptyFragment = useCallback((type: FragmentType, x: number, y: number, clusterId: string): string => {
    const LAYOUT_FOR_TYPE: Record<FragmentType, LayoutType> = {
      person: 'image-hero', concept: 'vertical-flow', thesis: 'vertical-flow',
      quote: 'quote-centered', source: 'card-split', event: 'timeline',
      era: 'vertical-flow', domain: 'vertical-flow', spark: 'vertical-flow',
      'text-note': 'text-note',
    };
    const id = uuidv4();
    undoStack.current = [...undoStack.current.slice(-(MAX_UNDO - 1)), stateRef.current];
    setState(prev => ({
      ...prev,
      fragments: [...prev.fragments, {
        id, clusterId, x, y, type,
        layout: LAYOUT_FOR_TYPE[type],
        title: type,
        slots: [],
        createdAtZoom: 0.7,
        starred: false,
      }],
    }));
    return id;
  }, []);

  const resetToInitialPositions = useCallback(() => {
    undoStack.current = [...undoStack.current.slice(-(MAX_UNDO - 1)), stateRef.current];
    setState(prev => ({
      ...prev,
      fragments: prev.fragments.map(f =>
        f.initialX !== undefined && f.initialY !== undefined
          ? { ...f, x: f.initialX, y: f.initialY }
          : f
      ),
      clusters: prev.clusters.map(c =>
        c.initialX !== undefined && c.initialY !== undefined
          ? { ...c, x: c.initialX, y: c.initialY }
          : c
      ),
    }));
  }, []);

  const anchorFragment = useCallback((fragmentId: string) => {
    setState(prev => {
      const fragment = prev.fragments.find(f => f.id === fragmentId);
      const cluster = fragment ? prev.clusters.find(c => c.id === fragment.clusterId) : null;
      if (!fragment || !cluster) return prev;
      return {
        ...prev,
        fragments: prev.fragments.map(f =>
          f.id === fragmentId
            ? { ...f, anchored: true, anchorOffsetX: f.x - cluster.x, anchorOffsetY: f.y - cluster.y }
            : f
        ),
      };
    });
  }, []);

  const unanchorFragment = useCallback((fragmentId: string) => {
    setState(prev => ({
      ...prev,
      fragments: prev.fragments.map(f =>
        f.id === fragmentId ? { ...f, anchored: false } : f
      ),
    }));
  }, []);

  const unassignFromCluster = useCallback((fragmentId: string) => {
    undoStack.current = [...undoStack.current.slice(-(MAX_UNDO - 1)), stateRef.current];
    setState(prev => ({
      ...prev,
      fragments: prev.fragments.map(f =>
        f.id === fragmentId ? { ...f, clusterId: '' } : f
      ),
    }));
  }, []);

  const loadState = useCallback((newState: CanvasState) => {
    setState(newState);
  }, []);

  const updateViewport = useCallback((viewport: { x: number; y: number; zoom: number }) => {
    setState(prev => ({ ...prev, viewport }));
  }, []);

  // Debounced auto-save to localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      saveCanvasState(projectId, state);
    }, 1000);
    return () => clearTimeout(timer);
  }, [state, projectId]);

  return {
    state,
    setState,
    startDrag,
    updateDrag,
    endDrag,
    isDragging,
    updateFragmentWidth,
    updateFragmentTitle,
    updateConnectorLabel,
    updateConnectorRenderType,
    deleteConnector,
    promoteConnector,
    addCluster,
    addPivotCluster,
    addFragment,
    addEmptyFragment,
    addConnector,
    addAccordionSlot,
    updateFragmentSlot,
    navigateSlotHistory,
    toggleStarFragment,
    removeFragment,
    duplicateFragment,
    pinFragment,
    moveFragmentToCluster,
    moveGroupElements,
    removeCluster,
    resetToInitialPositions,
    anchorFragment,
    unanchorFragment,
    unassignFromCluster,
    loadState,
    updateViewport,
    pushUndo,
    undo,
  };
}
