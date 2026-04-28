import { useState, useCallback, useRef } from 'react';
import { CanvasState, Cluster, Fragment, Connector } from '../api/types';
import { zoom as zoomTokens } from '../tokens/tokens';

export type LOD = 'full' | 'compact' | 'macro';

export function getLOD(zoom: number): LOD {
  if (zoom > zoomTokens.lodFull) return 'full';
  if (zoom > zoomTokens.lodCompact) return 'compact';
  return 'macro';
}

export const TETHER_FULL_DISTANCE = 200;
export const TETHER_WEAK_DISTANCE = 600;

type DragState = {
  id: string;
  kind: 'fragment' | 'cluster';
  startMouseX: number;
  startMouseY: number;
  origX: number;
  origY: number;
} | null;

const MOCK_CLUSTERS: Cluster[] = [
  { id: 'seed', x: 0,    y: 0,    label: 'exploring colonialism',   isSeed: true  },
  { id: 'c1',  x: 700,  y: -80,  label: 'economic systems',        isSeed: false },
  { id: 'c2',  x: -650, y: 200,  label: 'key figures',             isSeed: false },
  { id: 'c3',  x: 100,  y: 750,  label: 'resistance movements',    isSeed: false },
  { id: 'c4',  x: -200, y: -700, label: 'long-term consequences',  isSeed: false },
];

const MOCK_FRAGMENTS: Fragment[] = [
  // seed
  { id: 's1',   clusterId: 'seed', x: 0,    y: 90,   type: 'concept', title: 'seed fragment',       layout: 'vertical-flow', slots: [], createdAtZoom: 0.7, starred: false },
  // c1
  { id: 'c1f1', clusterId: 'c1',  x: 620,  y: -130, type: 'concept', title: 'mercantilism',         layout: 'vertical-flow', slots: [], createdAtZoom: 0.7, starred: false },
  { id: 'c1f2', clusterId: 'c1',  x: 780,  y: -50,  type: 'thesis',  title: 'extraction logic',     layout: 'vertical-flow', slots: [], createdAtZoom: 0.7, starred: false },
  { id: 'c1f3', clusterId: 'c1',  x: 700,  y: 60,   type: 'source',  title: 'capital vol. 1',       layout: 'card-split',    slots: [], createdAtZoom: 0.7, starred: false },
  // c2
  { id: 'c2f1', clusterId: 'c2',  x: -730, y: 140,  type: 'person',  title: 'leopold II',           layout: 'image-hero',    slots: [], createdAtZoom: 0.7, starred: false },
  { id: 'c2f2', clusterId: 'c2',  x: -570, y: 260,  type: 'person',  title: 'frantz fanon',         layout: 'image-hero',    slots: [], createdAtZoom: 0.7, starred: false },
  // c3
  { id: 'c3f1', clusterId: 'c3',  x: -60,  y: 690,  type: 'event',   title: 'haitian revolution',   layout: 'timeline',      slots: [], createdAtZoom: 0.7, starred: false },
  { id: 'c3f2', clusterId: 'c3',  x: 100,  y: 820,  type: 'concept', title: 'decolonisation',       layout: 'vertical-flow', slots: [], createdAtZoom: 0.7, starred: false },
  { id: 'c3f3', clusterId: 'c3',  x: 260,  y: 710,  type: 'quote',   title: 'fanon on violence',    layout: 'quote-centered',slots: [], createdAtZoom: 0.7, starred: false },
  // c4
  { id: 'c4f1', clusterId: 'c4',  x: -350, y: -760, type: 'thesis',  title: 'resource curse',       layout: 'vertical-flow', slots: [], createdAtZoom: 0.7, starred: false },
  { id: 'c4f2', clusterId: 'c4',  x: -200, y: -640, type: 'era',     title: 'post-colonial era',    layout: 'vertical-flow', slots: [], createdAtZoom: 0.7, starred: false },
  { id: 'c4f3', clusterId: 'c4',  x: -50,  y: -730, type: 'concept', title: 'neo-colonialism',      layout: 'vertical-flow', slots: [], createdAtZoom: 0.7, starred: false },
  { id: 'c4f4', clusterId: 'c4',  x: -280, y: -820, type: 'source',  title: 'wretched of the earth',layout: 'card-split',    slots: [], createdAtZoom: 0.7, starred: false },
];

const MOCK_CONNECTORS: Connector[] = MOCK_FRAGMENTS.map(f => ({
  id: `tether-${f.id}`,
  sourceId: f.id,
  targetId: f.clusterId,
  type: 'tether' as const,
  label: '',
}));

const INITIAL_STATE: CanvasState = {
  clusters: MOCK_CLUSTERS,
  fragments: MOCK_FRAGMENTS,
  connectors: MOCK_CONNECTORS,
  viewport: { x: 0, y: 0, zoom: zoomTokens.initial },
  query: '',
  createdAt: 0,
};

export function useCanvas(initial: CanvasState = INITIAL_STATE) {
  const [state, setState] = useState<CanvasState>(initial);
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

  const addFragment = useCallback((fragment: Fragment) => {
    setState(prev => ({
      ...prev,
      fragments: [...prev.fragments, fragment],
      connectors: [...prev.connectors, {
        id: `tether-${fragment.id}`,
        sourceId: fragment.id,
        targetId: fragment.clusterId,
        type: 'tether' as const,
        label: '',
      }],
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
    addFragment,
    toggleStarFragment,
    removeFragment,
    loadState,
  };
}
