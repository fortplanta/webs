import { useState, useCallback } from 'react';
import { CanvasState, Cluster, Edge } from '../api/types';
import { zoom as zoomTokens } from '../tokens/tokens';

const EMPTY_STATE: CanvasState = {
  clusters: [],
  edges: [],
  viewport: { x: 0, y: 0, zoom: zoomTokens.initial },
  query: '',
  createdAt: 0,
};

export function useCanvas(initial: CanvasState = EMPTY_STATE) {
  const [state, setState] = useState<CanvasState>(initial);

  const setClusters = useCallback((clusters: Cluster[]) => {
    setState(prev => ({ ...prev, clusters }));
  }, []);

  const setEdges = useCallback((edges: Edge[]) => {
    setState(prev => ({ ...prev, edges }));
  }, []);

  const addCluster = useCallback((cluster: Cluster) => {
    setState(prev => ({ ...prev, clusters: [...prev.clusters, cluster] }));
  }, []);

  const addEdge = useCallback((edge: Edge) => {
    setState(prev => ({ ...prev, edges: [...prev.edges, edge] }));
  }, []);

  const removeEdge = useCallback((edgeId: string) => {
    setState(prev => ({ ...prev, edges: prev.edges.filter(e => e.id !== edgeId) }));
  }, []);

  const updateEdgeLabel = useCallback((edgeId: string, label: string) => {
    setState(prev => ({
      ...prev,
      edges: prev.edges.map(e => e.id === edgeId ? { ...e, label } : e),
    }));
  }, []);

  const toggleStarFragment = useCallback((fragmentId: string) => {
    setState(prev => ({
      ...prev,
      clusters: prev.clusters.map(c => ({
        ...c,
        fragments: c.fragments.map(f =>
          f.id === fragmentId ? { ...f, starred: !f.starred } : f
        ),
      })),
    }));
  }, []);

  const removeFragment = useCallback((fragmentId: string) => {
    setState(prev => ({
      ...prev,
      clusters: prev.clusters.map(c => ({
        ...c,
        fragments: c.fragments.filter(f => f.id !== fragmentId),
      })),
    }));
  }, []);

  const loadState = useCallback((newState: CanvasState) => {
    setState(newState);
  }, []);

  return {
    state,
    setState,
    setClusters,
    setEdges,
    addCluster,
    addEdge,
    removeEdge,
    updateEdgeLabel,
    toggleStarFragment,
    removeFragment,
    loadState,
  };
}
