import { useState, useCallback, useRef, useEffect } from 'react';
import { CanvasState, Cluster, Fragment, Connector } from '../api/types';
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
} | null;

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

  const startDrag = useCallback((
    id: string,
    kind: 'fragment' | 'cluster',
    mouseX: number,
    mouseY: number,
    origX: number,
    origY: number,
  ) => {
    dragRef.current = { id, kind, startMouseX: mouseX, startMouseY: mouseY, origX, origY };
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
      setState(prev => ({
        ...prev,
        clusters: prev.clusters.map(c =>
          c.id === drag.id ? { ...c, x: newX, y: newY } : c
        ),
      }));
    }
  }, []);

  // targetFragmentId: if set and differs from dragged fragment, creates a standard connector
  const endDrag = useCallback((targetFragmentId?: string) => {
    const drag = dragRef.current;
    if (!drag) { return; }
    if (targetFragmentId && drag.kind === 'fragment' && targetFragmentId !== drag.id) {
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
    }
    dragRef.current = null;
  }, []);

  const isDragging = useCallback(() => dragRef.current !== null, []);

  const updateConnectorLabel = useCallback((id: string, label: string) => {
    setState(prev => ({
      ...prev,
      connectors: prev.connectors.map(c => c.id === id ? { ...c, label } : c),
    }));
  }, []);

  const deleteConnector = useCallback((id: string) => {
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

  const addCluster = useCallback((cluster: Cluster) => {
    setState(prev => ({ ...prev, clusters: [...prev.clusters, cluster] }));
  }, []);

  const addPivotCluster = useCallback((
    cluster: Cluster,
    fragments: Fragment[],
    interConnector: Connector,
  ) => {
    setState(prev => ({
      ...prev,
      clusters: [...prev.clusters, cluster],
      fragments: [...prev.fragments, ...fragments],
      connectors: [...prev.connectors, interConnector],
    }));
  }, []);

  const addFragment = useCallback((fragment: Fragment) => {
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
    setState(prev => ({
      ...prev,
      fragments: prev.fragments.filter(f => f.id !== fragmentId),
      connectors: prev.connectors.filter(
        c => c.sourceId !== fragmentId && c.targetId !== fragmentId
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
    updateConnectorLabel,
    deleteConnector,
    promoteConnector,
    addCluster,
    addPivotCluster,
    addFragment,
    toggleStarFragment,
    removeFragment,
    loadState,
    updateViewport,
  };
}
