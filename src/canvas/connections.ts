import { Fragment, Connector, UserConnection, FragmentConnectionState, ExplorationConnectionState } from '../api/types';
import { loadCanvasState } from '../storage/storage';

const explorationKey = (id: string) => `webs_exploration_${id}`;

export function loadExplorationState(explorationId: string): ExplorationConnectionState | null {
  try {
    const raw = localStorage.getItem(explorationKey(explorationId));
    if (!raw) return null;
    return JSON.parse(raw) as ExplorationConnectionState;
  } catch {
    return null;
  }
}

function saveExplorationState(explorationId: string, state: ExplorationConnectionState): void {
  try {
    localStorage.setItem(explorationKey(explorationId), JSON.stringify(state));
  } catch { /* fire-and-forget */ }
}

// Build a blank ExplorationConnectionState from a fragment list.
function buildInitialState(fragments: Fragment[]): ExplorationConnectionState {
  const fragmentStates: Record<string, FragmentConnectionState> = {};
  fragments.forEach(f => {
    fragmentStates[f.id] = { connected: false, connectionCount: 0 };
  });
  return { userConnections: [], depthScore: 0, fragmentStates };
}

// Called once after generateCanvas() resolves. Persists the blank exploration state.
export function initExplorationState(explorationId: string, fragments: Fragment[]): void {
  const state = buildInitialState(fragments);
  saveExplorationState(explorationId, state);
}

// Pure function. Returns 1–3.
// Priority:
//   same cluster → 1
//   different cluster, same type → 2
//   different cluster, different type → 3
//   pre-existing AI edge between their clusters → cap at 2
//   either fragment is "thesis" → +1 capped at 3
export function calculateConnectionStrength(
  sourceFragment: Fragment,
  targetFragment: Fragment,
  existingEdges: Connector[],
): 1 | 2 | 3 {
  let strength: number;

  if (sourceFragment.clusterId === targetFragment.clusterId) {
    strength = 1;
  } else if (sourceFragment.type === targetFragment.type) {
    strength = 2;
  } else {
    strength = 3;
  }

  // Cap at 2 when an AI-generated cluster edge already connects their clusters.
  const crossClusterEdgeExists = existingEdges.some(e =>
    (e.sourceId === sourceFragment.clusterId && e.targetId === targetFragment.clusterId) ||
    (e.sourceId === targetFragment.clusterId && e.targetId === sourceFragment.clusterId)
  );
  if (crossClusterEdgeExists && strength > 2) {
    strength = 2;
  }

  // Thesis bonus applied after cap.
  if (sourceFragment.type === 'thesis' || targetFragment.type === 'thesis') {
    strength = Math.min(3, strength + 1);
  }

  return strength as 1 | 2 | 3;
}

// Pure function. Sum of strength * 10 across all connections.
export function depthScoreFromConnections(userConnections: UserConnection[]): number {
  return userConnections.reduce((sum, c) => sum + c.strength * 10, 0);
}

export function addUserConnection(
  explorationId: string,
  sourceFragmentId: string,
  targetFragmentId: string,
): { id: string; strength: 1 | 2 | 3 } | null {
  const canvasState = loadCanvasState(explorationId);
  if (!canvasState) return null;

  const sourceFragment = canvasState.fragments.find(f => f.id === sourceFragmentId);
  const targetFragment = canvasState.fragments.find(f => f.id === targetFragmentId);
  if (!sourceFragment || !targetFragment) return null;

  const state = loadExplorationState(explorationId) ?? buildInitialState(canvasState.fragments);

  const strength = calculateConnectionStrength(sourceFragment, targetFragment, canvasState.connectors);

  const connection: UserConnection = {
    id: crypto.randomUUID(),
    sourceFragmentId,
    targetFragmentId,
    label: '',
    strength,
    createdAt: Date.now(),
  };

  state.userConnections.push(connection);

  const src = state.fragmentStates[sourceFragmentId];
  if (src) { src.connected = true; src.connectionCount++; }

  const tgt = state.fragmentStates[targetFragmentId];
  if (tgt) { tgt.connected = true; tgt.connectionCount++; }

  state.depthScore = depthScoreFromConnections(state.userConnections);

  saveExplorationState(explorationId, state);
  return { id: connection.id, strength };
}

export function updateUserConnectionAI(
  explorationId: string,
  connectionId: string,
  update: { label: string; strength: 1 | 2 | 3; rationale: string },
): { prevStrength: 1 | 2 | 3 } | null {
  const state = loadExplorationState(explorationId);
  if (!state) return null;

  const conn = state.userConnections.find(c => c.id === connectionId);
  if (!conn) return null;

  const prevStrength = conn.strength as 1 | 2 | 3;
  conn.label = update.label;
  conn.strength = update.strength;
  conn.rationale = update.rationale;

  state.depthScore = depthScoreFromConnections(state.userConnections);
  saveExplorationState(explorationId, state);

  return { prevStrength };
}

export function removeUserConnection(explorationId: string, connectionId: string): void {
  const state = loadExplorationState(explorationId);
  if (!state) return;

  const idx = state.userConnections.findIndex(c => c.id === connectionId);
  if (idx === -1) return;

  const removed = state.userConnections[idx];
  state.userConnections.splice(idx, 1);

  // Recompute fragmentStates from remaining connections.
  Object.keys(state.fragmentStates).forEach(id => {
    state.fragmentStates[id] = { connected: false, connectionCount: 0 };
  });
  state.userConnections.forEach(c => {
    const src = state.fragmentStates[c.sourceFragmentId];
    if (src) { src.connected = true; src.connectionCount++; }
    const tgt = state.fragmentStates[c.targetFragmentId];
    if (tgt) { tgt.connected = true; tgt.connectionCount++; }
  });

  // Keep fragmentStates for any fragment not in userConnections but was connected via removed.
  // Already handled above: we zero-reset then replay.
  void removed;

  state.depthScore = depthScoreFromConnections(state.userConnections);

  saveExplorationState(explorationId, state);
}
