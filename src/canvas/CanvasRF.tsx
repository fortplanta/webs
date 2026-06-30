import { useState, useCallback, useRef, useEffect } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  useViewport,
  useReactFlow,
  Handle,
  Position,
  addEdge,
  type NodeTypes,
  type Node,
  type Edge,
  type Connection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import '../styles/connections.css';
import '../styles/glow.css';
import '../styles/progress.css';
import { useCanvas, getLOD } from './useCanvas';
import SeedFragment from '../fragments/SeedFragment';
import FragmentComponent from '../fragments/Fragment';
import { useConnectionSystem, makeInitialProgressState, loadProgressState } from '../connections/useConnectionSystem';
import {
  evaluateConnectionTier,
  validateUserExplanation,
  findConnection,
  generateSuggestion,
  generateObviousLabel,
} from '../api/connections';
import type { Suggestion } from '../api/connections';
import { getGlowColors } from '../effects/FragmentGlow';
import ConnectionValidator from '../connections/ConnectionValidator';
import ConnectionResult from '../connections/ConnectionResult';
import ScoreIndicator from '../ui/ScoreIndicator';
import SuggestionCard from '../ui/SuggestionCard';
import type { CanvasState, Fragment, Cluster, ProjectMeta, ConnectionTier } from '../api/types';

// ── Custom node data types ────────────────────────────────────────────────────

interface SeedNodeData extends Record<string, unknown> {
  query: string;
  context: string;
}

interface FragmentNodeData extends Record<string, unknown> {
  fragment: Fragment;
  clusters: Cluster[];
  isGlowing?: boolean;
  glowDim?: boolean;
}

// ── Custom node components ────────────────────────────────────────────────────
// Defined outside CanvasRF — React Flow requires stable nodeTypes references.

function SeedNodeComponent({ data }: { data: SeedNodeData }) {
  return (
    <>
      <Handle type="target" position={Position.Top} style={{ opacity: 0, pointerEvents: 'none' }} />
      <SeedFragment
        query={data.query}
        context={data.context}
        x={0}
        y={0}
        onMouseDown={() => {}}
      />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0, pointerEvents: 'none' }} />
    </>
  );
}

function FragmentNodeComponent({ data }: { data: FragmentNodeData }) {
  const { zoom } = useViewport();
  const lod = getLOD(zoom);
  const glowColors = data.isGlowing ? getGlowColors(data.fragment.type) : null;

  return (
    <>
      <Handle type="target" position={Position.Top} style={{ opacity: 0, pointerEvents: 'none' }} />
      <div
        className={[
          data.isGlowing ? 'fragment-glow-active' : '',
          data.isGlowing && data.glowDim ? 'fragment-glow-active--dim' : '',
        ].filter(Boolean).join(' ') || undefined}
        style={glowColors ? {
          '--glow-color-primary':   glowColors.primary,
          '--glow-color-secondary': glowColors.secondary,
          '--glow-color-tertiary':  glowColors.tertiary,
          position: 'relative',
        } as React.CSSProperties : undefined}
      >
        <FragmentComponent
          fragment={data.fragment}
          lod={lod}
          clusters={data.clusters}
          onMouseDown={() => {}}
          onDelete={() => {}}
          onToggleStar={() => {}}
        />
      </div>
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0, pointerEvents: 'none' }} />
    </>
  );
}

// NodeTypes must be a stable object (defined outside component).
const NODE_TYPES: NodeTypes = {
  seed:     SeedNodeComponent,
  fragment: FragmentNodeComponent,
};

const EDGE_TYPES = {};

// ── Data builders ─────────────────────────────────────────────────────────────

function buildNodes(clusters: Cluster[], fragments: Fragment[], query: string): Node[] {
  const nodes: Node[] = [];

  for (const cluster of clusters) {
    if (cluster.isSeed) {
      const seedFrag = fragments.find(f => f.clusterId === cluster.id);
      const context  = seedFrag?.slots.find(s => s.type === 'body')?.content ?? '';
      nodes.push({
        id:       seedFrag?.id ?? cluster.id,
        type:     'seed',
        position: { x: cluster.x, y: cluster.y },
        data:     { query: query || cluster.label, context } satisfies SeedNodeData,
      });
    }
  }

  for (const fragment of fragments) {
    const cluster = clusters.find(c => c.id === fragment.clusterId);
    if (cluster?.isSeed) continue;
    nodes.push({
      id:       fragment.id,
      type:     'fragment',
      position: { x: fragment.x, y: fragment.y },
      data:     { fragment, clusters } satisfies FragmentNodeData,
    });
  }

  return nodes;
}

function buildEdges(connectors: CanvasState['connectors']): Edge[] {
  return connectors.map(c => ({
    id:     c.id,
    source: c.sourceId,
    target: c.targetId,
    label:  c.label || undefined,
    type:   'default',
  }));
}

// ── CanvasProps ───────────────────────────────────────────────────────────────

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

// ── CanvasRFInner — needs ReactFlowProvider context for useReactFlow ──────────

function CanvasRFInner({
  projectId,
  initialState,
  copiedFragment:   _copiedFragment,
  onFragmentCopy:   _onFragmentCopy,
  onFragmentPaste:  _onFragmentPaste,
  onNewExploration,
  ganttOpen:        _ganttOpen,
  onGanttOpen:      _onGanttOpen,
  onGanttClose:     _onGanttClose,
  projects:         _projects,
}: CanvasProps) {
  const { state, setState } = useCanvas(projectId, initialState);
  const { flowToScreenPosition } = useReactFlow();

  // Build initial RF nodes/edges once — RF owns positions after mount.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initNodes = useRef(buildNodes(initialState.clusters, initialState.fragments, initialState.query)).current;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initEdges = useRef(buildEdges(initialState.connectors)).current;

  const [nodes, setNodes, onNodesChange] = useNodesState(initNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initEdges);

  // ── Gamification state ──────────────────────────────────────────────────────

  const [connectionSysState, connectionSysActions] = useConnectionSystem(
    loadProgressState() ?? makeInitialProgressState()
  );

  const [pendingNonObvious, setPendingNonObvious] = useState<{
    sourceFragment: Fragment;
    targetFragment: Fragment;
    screenX: number;
    screenY: number;
    pendingEdge: Edge;
  } | null>(null);

  const [validating, setValidating] = useState(false);

  const [connectionResultState, setConnectionResultState] = useState<{
    tier: ConnectionTier;
    points: number;
    explanation: string;
    context?: string;
    screenX: number;
    screenY: number;
  } | null>(null);

  const [scoreIndicators, setScoreIndicators] = useState<Array<{
    id: string; points: number; screenX: number; screenY: number;
  }>>([]);

  const [suggestionState, setSuggestionState] = useState<Suggestion | null>(null);

  // ── Sync glow into node data ────────────────────────────────────────────────

  useEffect(() => {
    setNodes(prev => prev.map(node => {
      const isGlowing = connectionSysState.glowingFragmentIds.has(node.id);
      const glowDim   = connectionSysState.glowDimFragmentIds.has(node.id);
      const cur = node.data as FragmentNodeData;
      if (cur.isGlowing === isGlowing && cur.glowDim === glowDim) return node;
      return { ...node, data: { ...node.data, isGlowing, glowDim } };
    }));
  }, [connectionSysState.glowingFragmentIds, connectionSysState.glowDimFragmentIds, setNodes]);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const addScoreIndicator = useCallback((points: number, screenX: number, screenY: number) => {
    const id = `score-${Date.now()}-${Math.random()}`;
    setScoreIndicators(prev => [...prev, { id, points, screenX, screenY }]);
  }, []);

  const triggerSuggestion = useCallback(async () => {
    const tier2 = (state.connectors ?? [])
      .filter(c => c.tier === 'non-obvious-user')
      .map(c => {
        const src = state.fragments.find(f => f.id === c.sourceId);
        const tgt = state.fragments.find(f => f.id === c.targetId);
        return { sourceTitle: src?.title ?? '', targetTitle: tgt?.title ?? '', explanation: c.userExplanation ?? '' };
      });
    const suggestion = await generateSuggestion(tier2, state.fragments.map(f => f.title));
    setSuggestionState(suggestion);
  }, [state.connectors, state.fragments]);

  const persistConnector = useCallback((
    id: string, sourceId: string, targetId: string,
    label: string, tier: ConnectionTier, userExplanation?: string,
  ) => {
    setState(prev => ({
      ...prev,
      connectors: [
        ...(prev.connectors ?? []),
        { id, sourceId, targetId, label, tier, userExplanation },
      ],
    }));
  }, [setState]);

  // ── onConnect — fires when user draws an edge between two handles ───────────

  const onConnect = useCallback(async (connection: Connection) => {
    if (!connection.source || !connection.target) return;

    const sourceFragment = state.fragments.find(f => f.id === connection.source);
    const targetFragment = state.fragments.find(f => f.id === connection.target);
    if (!sourceFragment || !targetFragment) return;

    const connId   = `conn-${Date.now()}`;
    const newEdge: Edge = {
      id:     connId,
      source: connection.source,
      target: connection.target,
      type:   'default',
    };

    // Optimistically add edge (label filled in later)
    setEdges(eds => addEdge({ ...newEdge }, eds));

    const tier = await evaluateConnectionTier(sourceFragment, targetFragment);

    // Screen position: midpoint between the two nodes
    const srcNode = nodes.find(n => n.id === connection.source);
    const tgtNode = nodes.find(n => n.id === connection.target);
    const midFlow = {
      x: ((srcNode?.position.x ?? 0) + (tgtNode?.position.x ?? 0)) / 2,
      y: ((srcNode?.position.y ?? 0) + (tgtNode?.position.y ?? 0)) / 2,
    };
    const screenPos = flowToScreenPosition(midFlow);

    if (tier === 'obvious') {
      const label = await generateObviousLabel(sourceFragment, targetFragment);
      setEdges(eds => eds.map(e => e.id === connId ? { ...e, label } : e));
      persistConnector(connId, connection.source, connection.target, label, 'obvious');

      const pointsMin = 10, pointsMax = 30;
      const points = Math.round(pointsMin + Math.random() * (pointsMax - pointsMin));
      const { thresholdReached } = connectionSysActions.applyConnectionResult({
        tier: 'obvious', points,
        sourceFragmentId: connection.source,
        targetFragmentId: connection.target,
      });
      addScoreIndicator(points, screenPos.x, screenPos.y);
      if (thresholdReached) triggerSuggestion();
    } else {
      setPendingNonObvious({ sourceFragment, targetFragment, screenX: screenPos.x, screenY: screenPos.y, pendingEdge: newEdge });
    }
  }, [state.fragments, nodes, setEdges, flowToScreenPosition, connectionSysActions, persistConnector, addScoreIndicator, triggerSuggestion]);

  // ── ConnectionValidator handlers ────────────────────────────────────────────

  const handleValidatorSubmit = useCallback(async (explanation: string) => {
    if (!pendingNonObvious) return;
    setValidating(true);
    const { sourceFragment, targetFragment, screenX, screenY, pendingEdge } = pendingNonObvious;

    try {
      const result = await validateUserExplanation(sourceFragment, targetFragment, explanation);
      if (result.isValid) {
        setEdges(eds => eds.map(e =>
          e.id === pendingEdge.id ? { ...e, label: explanation.slice(0, 40) } : e
        ));
        persistConnector(pendingEdge.id, pendingEdge.source!, pendingEdge.target!, explanation.slice(0, 40), 'non-obvious-user', explanation);
        const { thresholdReached } = connectionSysActions.applyConnectionResult({
          tier: 'non-obvious-user', points: result.points,
          sourceFragmentId: pendingEdge.source!,
          targetFragmentId: pendingEdge.target!,
        });
        addScoreIndicator(result.points, screenX, screenY);
        setConnectionResultState({ tier: 'non-obvious-user', points: result.points, explanation: result.explanation, context: result.context, screenX, screenY });
        if (thresholdReached) triggerSuggestion();
      } else {
        // Invalid — remove the optimistic edge
        setEdges(eds => eds.filter(e => e.id !== pendingEdge.id));
        setConnectionResultState({ tier: 'non-obvious-user', points: 0, explanation: 'That connection didn\'t hold up. Try a different path.', screenX, screenY });
      }
    } finally {
      setValidating(false);
      setPendingNonObvious(null);
    }
  }, [pendingNonObvious, setEdges, persistConnector, connectionSysActions, addScoreIndicator, triggerSuggestion]);

  const handleFindConnection = useCallback(async () => {
    if (!pendingNonObvious) return;
    setValidating(true);
    const { sourceFragment, targetFragment, screenX, screenY, pendingEdge } = pendingNonObvious;

    try {
      const result = await findConnection(sourceFragment, targetFragment);
      if (result.found && result.explanation && result.points) {
        const label = result.explanation.slice(0, 40);
        setEdges(eds => eds.map(e => e.id === pendingEdge.id ? { ...e, label } : e));
        persistConnector(pendingEdge.id, pendingEdge.source!, pendingEdge.target!, label, 'non-obvious-claude');
        const { thresholdReached } = connectionSysActions.applyConnectionResult({
          tier: 'non-obvious-claude', points: result.points,
          sourceFragmentId: pendingEdge.source!,
          targetFragmentId: pendingEdge.target!,
        });
        addScoreIndicator(result.points, screenX, screenY);
        setConnectionResultState({ tier: 'non-obvious-claude', points: result.points, explanation: result.explanation, screenX, screenY });
        if (thresholdReached) triggerSuggestion();
      } else {
        setEdges(eds => eds.filter(e => e.id !== pendingEdge.id));
        setConnectionResultState({ tier: 'non-obvious-claude', points: 0, explanation: 'No clear connection found between these two fragments.', screenX, screenY });
      }
    } finally {
      setValidating(false);
      setPendingNonObvious(null);
    }
  }, [pendingNonObvious, setEdges, persistConnector, connectionSysActions, addScoreIndicator, triggerSuggestion]);

  const handleValidatorCancel = useCallback(() => {
    if (pendingNonObvious) {
      setEdges(eds => eds.filter(e => e.id !== pendingNonObvious.pendingEdge.id));
      setPendingNonObvious(null);
    }
  }, [pendingNonObvious, setEdges]);

  // ── Node drag sync ──────────────────────────────────────────────────────────

  const seedFragIdToClusterId = useRef(
    new Map(
      initialState.clusters
        .filter(c => c.isSeed)
        .map(c => {
          const sf = initialState.fragments.find(f => f.clusterId === c.id);
          return sf ? [sf.id, c.id] : null;
        })
        .filter((entry): entry is [string, string] => entry !== null)
    )
  ).current;

  const handleNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const clusterId = seedFragIdToClusterId.get(node.id);
      if (clusterId) {
        setState(prev => ({
          ...prev,
          clusters: prev.clusters.map(c =>
            c.id === clusterId ? { ...c, x: node.position.x, y: node.position.y } : c
          ),
        }));
      } else {
        setState(prev => ({
          ...prev,
          fragments: prev.fragments.map(f =>
            f.id === node.id ? { ...f, x: node.position.x, y: node.position.y } : f
          ),
        }));
      }
    },
    [seedFragIdToClusterId, setState],
  );

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        colorMode="dark"
        panOnDrag
        panOnScroll
        zoomOnPinch
        minZoom={0.2}
        maxZoom={4}
        fitView
        onNodeDragStop={handleNodeDragStop}
      >
        <Background />
        <Controls />
      </ReactFlow>

      {pendingNonObvious && (
        <ConnectionValidator
          sourceFragment={pendingNonObvious.sourceFragment}
          targetFragment={pendingNonObvious.targetFragment}
          screenX={pendingNonObvious.screenX}
          screenY={pendingNonObvious.screenY}
          isEvaluating={validating}
          onSubmitExplanation={handleValidatorSubmit}
          onFindConnection={handleFindConnection}
          onCancel={handleValidatorCancel}
        />
      )}

      {connectionResultState && (
        <ConnectionResult
          tier={connectionResultState.tier}
          points={connectionResultState.points}
          explanation={connectionResultState.explanation}
          context={connectionResultState.context}
          screenX={connectionResultState.screenX}
          screenY={connectionResultState.screenY}
          onDismiss={() => setConnectionResultState(null)}
        />
      )}

      {scoreIndicators.map(ind => (
        <ScoreIndicator
          key={ind.id}
          points={ind.points}
          screenX={ind.screenX}
          screenY={ind.screenY}
          onDone={() => setScoreIndicators(prev => prev.filter(s => s.id !== ind.id))}
        />
      ))}

      {suggestionState && (
        <SuggestionCard
          title={suggestionState.title}
          explanation={suggestionState.explanation}
          onNewExploration={() => {
            setSuggestionState(null);
            onNewExploration?.();
          }}
          onDismiss={() => setSuggestionState(null)}
        />
      )}
    </div>
  );
}

// ── CanvasRF — wraps in ReactFlowProvider so useReactFlow works inside ────────

export default function CanvasRF(props: CanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasRFInner {...props} />
    </ReactFlowProvider>
  );
}
