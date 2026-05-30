import { useCallback, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  useViewport,
  Handle,
  Position,
  type NodeTypes,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useCanvas, getLOD } from './useCanvas';
import SeedFragment from '../fragments/SeedFragment';
import FragmentComponent from '../fragments/Fragment';
import type { CanvasState, Fragment, Cluster, ProjectMeta } from '../api/types';

// ── Custom node data types ────────────────────────────────────────────────────

interface SeedNodeData extends Record<string, unknown> {
  query: string;
  context: string;
}

interface FragmentNodeData extends Record<string, unknown> {
  fragment: Fragment;
  clusters: Cluster[];
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
  return (
    <>
      <Handle type="target" position={Position.Top} style={{ opacity: 0, pointerEvents: 'none' }} />
      <FragmentComponent
        fragment={data.fragment}
        lod={lod}
        clusters={data.clusters}
        onMouseDown={() => {}}
        onDelete={() => {}}
        onToggleStar={() => {}}
      />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0, pointerEvents: 'none' }} />
    </>
  );
}

// NodeTypes and EdgeTypes must be stable objects (defined outside component).
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
      // Seed node: use the seed fragment's ID so connectors referencing it resolve.
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
    if (cluster?.isSeed) continue; // rendered via seed node above
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

// ── CanvasRF ──────────────────────────────────────────────────────────────────

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

export default function CanvasRF({
  projectId,
  initialState,
  copiedFragment:   _copiedFragment,
  onFragmentCopy:   _onFragmentCopy,
  onFragmentPaste:  _onFragmentPaste,
  onNewExploration: _onNewExploration,
  ganttOpen:        _ganttOpen,
  onGanttOpen:      _onGanttOpen,
  onGanttClose:     _onGanttClose,
  projects:         _projects,
}: CanvasProps) {
  const { state, setState } = useCanvas(projectId, initialState);

  // Build initial RF nodes/edges from initialState once — RF then owns positions.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initNodes = useRef(buildNodes(initialState.clusters, initialState.fragments, initialState.query)).current;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initEdges = useRef(buildEdges(initialState.connectors)).current;

  const [nodes, , onNodesChange] = useNodesState(initNodes);
  const [edges, , onEdgesChange] = useEdgesState(initEdges);

  // Track seed fragment IDs so we know which dragged nodes are actually cluster-owned.
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

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
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
    </div>
  );
}
