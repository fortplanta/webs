import { useCallback, useRef, useState, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  SelectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { v4 as uuidv4 } from 'uuid';

import AnchorNode from './nodes/AnchorNode';
import ContextNode from './nodes/ContextNode';
import GroupFrameNode from './nodes/GroupFrameNode';
import CSSInspector from './CSSInspector';
import DebugPanel from './DebugPanel';
import { CATEGORY_BY_KEY, STORAGE_KEYS } from '../constants';
import { expandAnchor, radialPositions, generateCards } from '../lib/expand';
import { explainTerms } from '../lib/explainTerms';

const nodeTypes = {
  anchorNode: AnchorNode,
  contextNode: ContextNode,
  groupFrame: GroupFrameNode,
};

// ── Persistence helpers ──────────────────────────────────────────────────────
function loadCanvas() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CANVAS);
    return raw ? JSON.parse(raw) : { nodes: [], edges: [] };
  } catch { return { nodes: [], edges: [] }; }
}
function saveCanvas(nodes, edges) {
  try {
    localStorage.setItem(STORAGE_KEYS.CANVAS, JSON.stringify({ nodes, edges }));
  } catch (e) { console.warn('Canvas save failed:', e); }
}
function getUsage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USAGE);
    const today = new Date().toISOString().slice(0, 10);
    if (!raw) return { date: today, count: 0 };
    const parsed = JSON.parse(raw);
    return parsed.date !== today ? { date: today, count: 0 } : parsed;
  } catch { return { date: new Date().toISOString().slice(0, 10), count: 0 }; }
}
function saveUsage(usage) { localStorage.setItem(STORAGE_KEYS.USAGE, JSON.stringify(usage)); }

// ── Edge style helpers ───────────────────────────────────────────────────────
function edgeColor(s) {
  return s === 'strong' ? 'var(--color-strong)' : s === 'moderate' ? 'var(--color-moderate)' : 'var(--color-weak)';
}
function edgeWidth(s) { return s === 'strong' ? 2.5 : s === 'moderate' ? 2 : 1.5; }

// ── Group bounds ─────────────────────────────────────────────────────────────
function computeGroupBounds(memberNodes, padding = 56) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  memberNodes.forEach(n => {
    const w = n.measured?.width ?? (n.type === 'anchorNode' ? 240 : 180);
    const h = n.measured?.height ?? (n.type === 'anchorNode' ? 120 : 100);
    minX = Math.min(minX, n.position.x);
    minY = Math.min(minY, n.position.y);
    maxX = Math.max(maxX, n.position.x + w);
    maxY = Math.max(maxY, n.position.y + h);
  });
  return { x: minX - padding, y: minY - padding, width: maxX - minX + padding * 2, height: maxY - minY + padding * 2 };
}

export default function Canvas({ apiKey, onCardsGenerated, importedState, showDebug, showCSS, onRegisterAddNote, onUsageChange }) {
  const saved = importedState || loadCanvas();
  const [nodes, setNodes, onNodesChange] = useNodesState(saved.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(saved.edges);
  const [contextMenu, setContextMenu] = useState(null); // { x, y, nodeId, nodeType, flowPos? }
  const [addDialog, setAddDialog] = useState(false);
  const [addForm, setAddForm] = useState({ title: '', body: '', flowPos: null });
  const [usage, setUsage] = useState(getUsage);
  const reactFlowWrapper = useRef(null);
  const [rfInstance, setRfInstance] = useState(null);
  const nodesRef = useRef(nodes);
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  const clipboardRef = useRef([]);
  const copySelectedRef = useRef(null);
  const pasteNodesRef = useRef(null);

  // Persist on change
  useEffect(() => { saveCanvas(nodes, edges); }, [nodes, edges]);

  // Register the "add note" trigger for the sidebar button
  useEffect(() => {
    if (onRegisterAddNote) {
      onRegisterAddNote(() => {
        setAddForm({ title: '', body: '', flowPos: null });
        setAddDialog(true);
      });
    }
  }, [onRegisterAddNote]);

  // ── Callback factories ───────────────────────────────────────────────────
  function makeAnchorCallbacks(id) {
    return {
      onExpand: () => expandNode(id),
      onContextMenu: (e) => { e.preventDefault(); openContextMenu(e, id, 'anchorNode'); },
      onToggleStar: () => toggleStar(id),
    };
  }
  function makeContextCallbacks(id, anchorId, item) {
    return {
      onReveal: () => revealContextNode(id, anchorId, item),
      onContextMenu: (e) => { e.preventDefault(); openContextMenu(e, id, 'contextNode'); },
      onToggleStar: () => toggleStar(id),
    };
  }

  // ── Add anchor node ───────────────────────────────────────────────────────
  function addAnchorNode(title, body, flowPos) {
    const id = uuidv4();
    const position = flowPos ?? (rfInstance
      ? rfInstance.screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
      : { x: 200 + Math.random() * 200, y: 200 + Math.random() * 200 });

    setNodes(ns => [...ns, {
      id,
      type: 'anchorNode',
      position,
      data: { title, body, contextNodes: [], loading: false, starred: false, ...makeAnchorCallbacks(id) },
    }]);
  }

  // ── Expand anchor via AI ──────────────────────────────────────────────────
  async function expandNode(anchorId) {
    const currentUsage = getUsage();
    if (currentUsage.count >= 10) {
      alert("You've reached today's limit of 10 expansions. Come back tomorrow!");
      return;
    }
    setNodes(ns => ns.map(n =>
      n.id === anchorId ? { ...n, data: { ...n.data, loading: true } } : n
    ));

    try {
      const anchor = nodesRef.current.find(n => n.id === anchorId);
      if (!anchor) return;

      const results = await expandAnchor(apiKey, anchor.data.title, anchor.data.body);
      const newUsage = { date: currentUsage.date, count: currentUsage.count + 1 };
      saveUsage(newUsage);
      setUsage(newUsage);
      onUsageChange?.(newUsage.count);

      const positions = radialPositions(anchor.position, results.length, 320);
      const contextNodeIds = [];
      const newNodes = [];
      const newEdges = [];

      results.forEach((item, i) => {
        const contextId = uuidv4();
        contextNodeIds.push(contextId);
        newNodes.push({
          id: contextId,
          type: 'contextNode',
          position: positions[i],
          data: {
            category: item.key,
            title: item.title,
            summary: item.summary,
            connectionStrength: item.connectionStrength,
            revealed: false,
            anchorId,
            starred: false,
            termDefinitions: {},
            ...makeContextCallbacks(contextId, anchorId, item),
          },
        });
        newEdges.push({
          id: `${anchorId}->${contextId}`,
          source: anchorId,
          target: contextId,
          style: { stroke: edgeColor(item.connectionStrength), strokeWidth: edgeWidth(item.connectionStrength), opacity: 0.5 },
        });
      });

      // Build group frame around anchor + context nodes
      const groupId = uuidv4();
      const allMemberPositions = [anchor.position, ...positions];
      const estBounds = computeGroupBounds(
        allMemberPositions.map((p, i) => ({ position: p, type: i === 0 ? 'anchorNode' : 'contextNode', measured: null }))
      );
      const groupNode = {
        id: groupId,
        type: 'groupFrame',
        position: { x: estBounds.x, y: estBounds.y },
        style: { width: estBounds.width, height: estBounds.height },
        selectable: false,
        draggable: false,
        zIndex: -1,
        data: {
          label: anchor.data.title,
          memberIds: [anchorId, ...contextNodeIds],
          collapsed: false,
          onToggleCollapse: () => toggleGroupCollapse(groupId),
        },
      };

      setNodes(ns => [
        groupNode,
        ...ns.map(n =>
          n.id === anchorId
            ? { ...n, data: { ...n.data, loading: false, contextNodes: contextNodeIds, groupId } }
            : n
        ),
        ...newNodes,
      ]);
      setEdges(es => [...es, ...newEdges]);

    } catch (err) {
      console.error('Expand failed:', err);
      alert(`Expansion failed: ${err.message}`);
      setNodes(ns => ns.map(n =>
        n.id === anchorId ? { ...n, data: { ...n.data, loading: false } } : n
      ));
    }
  }

  // ── Reveal context node ────────────────────────────────────────────────────
  async function revealContextNode(contextId, anchorId, item) {
    setNodes(ns => ns.map(n =>
      n.id === contextId ? { ...n, data: { ...n.data, revealed: true } } : n
    ));
    setEdges(es => es.map(e =>
      e.id === `${anchorId}->${contextId}`
        ? { ...e, style: { ...e.style, opacity: 1 } }
        : e
    ));

    const anchor = nodesRef.current.find(n => n.id === anchorId);
    if (anchor && apiKey) {
      const cat = CATEGORY_BY_KEY[item.key];
      // Card generation + term explanation in parallel, both silent fail
      Promise.all([
        generateCards(apiKey, anchor.data.title, item.title, item.summary, cat?.label || item.key),
        explainTerms(apiKey, item.summary),
      ]).then(([cards, termDefs]) => {
        if (Object.keys(termDefs).length > 0) {
          setNodes(ns => ns.map(n =>
            n.id === contextId ? { ...n, data: { ...n.data, termDefinitions: termDefs } } : n
          ));
        }
        if (cards.length > 0) {
          onCardsGenerated?.(cards.map(c => ({
            ...c, id: uuidv4(),
            anchorTitle: anchor.data.title,
            category: item.key,
            categoryLabel: cat?.label || item.key,
            dueDate: new Date().toISOString(),
            interval: 0,
          })));
        }
      }).catch(() => {});
    }
  }

  // ── Toggle star ────────────────────────────────────────────────────────────
  function toggleStar(nodeId) {
    setNodes(ns => ns.map(n =>
      n.id === nodeId ? { ...n, data: { ...n.data, starred: !n.data.starred } } : n
    ));
    setContextMenu(null);
  }

  // ── Toggle group collapse ─────────────────────────────────────────────────
  function toggleGroupCollapse(groupId) {
    setNodes(ns => {
      const group = ns.find(n => n.id === groupId);
      if (!group) return ns;
      const nowCollapsed = !group.data.collapsed;
      const memberIds = new Set(group.data.memberIds);
      return ns.map(n => {
        if (n.id === groupId) return { ...n, data: { ...n.data, collapsed: nowCollapsed } };
        if (memberIds.has(n.id) && n.type === 'contextNode') return { ...n, hidden: nowCollapsed };
        return n;
      });
    });
  }

  // ── Context menu ───────────────────────────────────────────────────────────
  function openContextMenu(e, nodeId, nodeType) {
    setContextMenu({ x: e.clientX, y: e.clientY, nodeId, nodeType });
  }

  function deleteNode(nodeId) {
    const node = nodesRef.current.find(n => n.id === nodeId);
    const toDelete = new Set([nodeId]);
    // If deleting an anchor, also delete its context nodes and group frame
    if (node?.data?.contextNodes) node.data.contextNodes.forEach(id => toDelete.add(id));
    const groupFrame = nodesRef.current.find(n => n.type === 'groupFrame' && n.data.memberIds?.includes(nodeId));
    if (groupFrame) toDelete.add(groupFrame.id);
    setNodes(ns => ns.filter(n => !toDelete.has(n.id)));
    setEdges(es => es.filter(e => !toDelete.has(e.source) && !toDelete.has(e.target)));
    setContextMenu(null);
  }

  function duplicateNode(nodeId) {
    const node = nodesRef.current.find(n => n.id === nodeId);
    if (!node || node.type !== 'anchorNode') return;
    const id = uuidv4();
    setNodes(ns => [...ns, {
      id,
      type: 'anchorNode',
      position: { x: node.position.x + 40, y: node.position.y + 40 },
      data: { title: node.data.title, body: node.data.body, contextNodes: [], loading: false, starred: false, ...makeAnchorCallbacks(id) },
    }]);
    setContextMenu(null);
  }

  // ── Collision detection ───────────────────────────────────────────────────
  const handleCollision = useCallback((draggedNode) => {
    if (draggedNode.type === 'groupFrame') return;
    setNodes(ns => {
      const colliding = ns.filter(n => {
        if (n.id === draggedNode.id || n.type === 'groupFrame' || n.hidden) return false;
        const dw = draggedNode.measured?.width ?? 200, dh = draggedNode.measured?.height ?? 110;
        const nw = n.measured?.width ?? 200, nh = n.measured?.height ?? 110;
        const overlap = !(
          draggedNode.position.x + dw + 4 < n.position.x ||
          draggedNode.position.x > n.position.x + nw + 4 ||
          draggedNode.position.y + dh + 4 < n.position.y ||
          draggedNode.position.y > n.position.y + nh + 4
        );
        return overlap;
      });
      if (colliding.length === 0) return ns;

      let px = draggedNode.position.x, py = draggedNode.position.y;
      colliding.forEach(other => {
        const dw = draggedNode.measured?.width ?? 200, dh = draggedNode.measured?.height ?? 110;
        const nw = other.measured?.width ?? 200, nh = other.measured?.height ?? 110;
        const cx1 = px + dw / 2, cy1 = py + dh / 2;
        const cx2 = other.position.x + nw / 2, cy2 = other.position.y + nh / 2;
        const dx = cx1 - cx2, dy = cy1 - cy2;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        px += (dx / dist) * 24;
        py += (dy / dist) * 24;
      });
      return ns.map(n => n.id === draggedNode.id ? { ...n, position: { x: px, y: py } } : n);
    });
  }, []);

  // ── Update group frame bounds after drag ──────────────────────────────────
  const updateGroupBounds = useCallback((movedNodeId) => {
    setNodes(ns => {
      const group = ns.find(n => n.type === 'groupFrame' && n.data.memberIds?.includes(movedNodeId));
      if (!group) return ns;
      const members = ns.filter(n => group.data.memberIds.includes(n.id) && n.type !== 'groupFrame');
      if (members.length === 0) return ns;
      const bounds = computeGroupBounds(members);
      return ns.map(n => n.id === group.id
        ? { ...n, position: { x: bounds.x, y: bounds.y }, style: { width: bounds.width, height: bounds.height } }
        : n
      );
    });
  }, []);

  const onNodeDragStop = useCallback((e, draggedNode) => {
    handleCollision(draggedNode);
    updateGroupBounds(draggedNode.id);
  }, [handleCollision, updateGroupBounds]);

  // ── Copy / Paste ──────────────────────────────────────────────────────────
  function copySelected() {
    const selected = nodesRef.current.filter(n => n.selected && n.type === 'anchorNode');
    if (selected.length === 0) return;
    clipboardRef.current = selected.map(n => ({
      title: n.data.title,
      body: n.data.body,
      position: { ...n.position },
    }));
  }

  function pasteNodes() {
    if (clipboardRef.current.length === 0) return;
    const offset = 40;
    const newNodes = clipboardRef.current.map(cn => {
      const id = uuidv4();
      return {
        id,
        type: 'anchorNode',
        position: { x: cn.position.x + offset, y: cn.position.y + offset },
        data: { title: cn.title, body: cn.body, contextNodes: [], loading: false, starred: false, ...makeAnchorCallbacks(id) },
      };
    });
    setNodes(ns => [...ns, ...newNodes]);
  }

  // Keep refs current so the keyboard listener always calls the latest version
  copySelectedRef.current = copySelected;
  pasteNodesRef.current = pasteNodes;

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e) {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key === 'c') { e.preventDefault(); copySelectedRef.current?.(); }
      if (meta && e.key === 'v') { e.preventDefault(); pasteNodesRef.current?.(); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const onConnect = useCallback(params => {
    setEdges(es => addEdge({
      ...params,
      style: { stroke: edgeColor('weak'), strokeWidth: edgeWidth('weak') },
    }, es));
  }, []);

  const limitReached = usage.count >= 10;
  const selectedNodes = nodes.filter(n => n.selected && n.type !== 'groupFrame');

  return (
    <div className="canvas-wrapper" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={setRfInstance}
        onPaneClick={() => setContextMenu(null)}
        onPaneContextMenu={e => {
          e.preventDefault();
          if (!rfInstance) return;
          const flowPos = rfInstance.screenToFlowPosition({ x: e.clientX, y: e.clientY });
          setContextMenu({ x: e.clientX, y: e.clientY, nodeId: null, nodeType: 'pane', flowPos });
        }}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.08}
        maxZoom={2.5}
        deleteKeyCode="Delete"
        selectionMode={SelectionMode.Partial}
        selectionKeyCode="Shift"
        multiSelectionKeyCode="Shift"
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="rgba(255,255,255,0.04)" />
        <Controls />
        <MiniMap
          nodeStrokeWidth={0}
          nodeColor={n => n.type === 'anchorNode' ? 'rgba(59,130,246,0.5)' : n.type === 'groupFrame' ? 'transparent' : 'rgba(255,255,255,0.1)'}
        />
      </ReactFlow>

      {/* Add note dialog */}
      {addDialog && (
        <div className="add-node-overlay" onClick={() => setAddDialog(false)}>
          <div className="add-node-dialog" onClick={e => e.stopPropagation()}>
            <h2>Add a note</h2>
            <p>Write about anything — a concept, question, person, event. Webs will expand it across 14 dimensions of context.</p>
            <input
              placeholder="What are you curious about?"
              value={addForm.title}
              onChange={e => setAddForm(f => ({ ...f, title: e.target.value }))}
              autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter' && addForm.title.trim()) {
                  addAnchorNode(addForm.title.trim(), addForm.body.trim(), addForm.flowPos);
                  setAddDialog(false);
                  setAddForm({ title: '', body: '', flowPos: null });
                }
              }}
            />
            <textarea
              placeholder="Optional context — what you already know, what you're wondering…"
              value={addForm.body}
              onChange={e => setAddForm(f => ({ ...f, body: e.target.value }))}
            />
            <div className="add-node-dialog__actions">
              <button className="btn" onClick={() => setAddDialog(false)}>Cancel</button>
              <button
                className="btn btn-primary"
                disabled={!addForm.title.trim()}
                onClick={() => {
                  addAnchorNode(addForm.title.trim(), addForm.body.trim(), addForm.flowPos);
                  setAddDialog(false);
                  setAddForm({ title: '', body: '', flowPos: null });
                }}
              >
                Add note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Context menu */}
      {contextMenu && (
        <div
          className="context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={e => e.stopPropagation()}
        >
          {contextMenu.nodeType === 'pane' ? (
            <>
              <button className="context-item" onClick={() => {
                setAddForm({ title: '', body: '', flowPos: contextMenu.flowPos });
                setAddDialog(true);
                setContextMenu(null);
              }}>
                Add note here
              </button>
              {clipboardRef.current.length > 0 && (
                <button className="context-item" onClick={() => { pasteNodes(); setContextMenu(null); }}>
                  Paste <span className="context-item__shortcut">⌘V</span>
                </button>
              )}
            </>
          ) : (
            <>
              <div className="context-header">Node</div>
              {(() => {
                const node = nodesRef.current.find(n => n.id === contextMenu.nodeId);
                const isStarred = node?.data?.starred;
                return (
                  <>
                    <button
                      className={`context-item${isStarred ? ' active' : ''}`}
                      onClick={() => toggleStar(contextMenu.nodeId)}
                    >
                      {isStarred ? '★ Unstar' : '☆ Star node'}
                    </button>
                    {contextMenu.nodeType === 'anchorNode' && (
                      <>
                        <button className="context-item" onClick={() => duplicateNode(contextMenu.nodeId)}>
                          Duplicate <span className="context-item__shortcut">⌘D</span>
                        </button>
                        <button className="context-item" onClick={() => { copySelected(); setContextMenu(null); }}>
                          Copy <span className="context-item__shortcut">⌘C</span>
                        </button>
                      </>
                    )}
                    <div className="context-sep" />
                    <button className="context-item danger" onClick={() => deleteNode(contextMenu.nodeId)}>
                      Delete
                    </button>
                  </>
                );
              })()}
            </>
          )}
        </div>
      )}


      {/* CSS Inspector */}
      {showCSS && <CSSInspector onClose={() => {}} />}

      {/* Debug Panel */}
      {showDebug && (
        <DebugPanel
          nodes={nodes}
          edges={edges}
          selectedNodes={selectedNodes}
          onClose={() => {}}
        />
      )}
    </div>
  );
}
