import { useCallback, useRef, useState, useEffect, useMemo } from 'react';
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
  ConnectionMode,
  MarkerType,
  EdgeLabelRenderer,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { v4 as uuidv4 } from 'uuid';
import { Modal, Input, Typography } from 'antd';

import AnchorNode      from './nodes/AnchorNode';
import ContextNode     from './nodes/ContextNode';
import GroupFrameNode  from './nodes/GroupFrameNode';
import MediaNode       from './nodes/MediaNode';
import FloatingEdge    from './edges/FloatingEdge';
import ProximityEdge   from './edges/ProximityEdge';
import CSSInspector    from './CSSInspector';
import DebugPanel      from './DebugPanel';
import ViewPanel       from './ViewPanel';
import StickyNode      from './nodes/StickyNode';
import { CATEGORY_BY_KEY, STORAGE_KEYS } from '../constants';
import { expandAnchor, radialPositions, generateCards } from '../lib/expand';
import { explainTerms } from '../lib/explainTerms';
import { fetchNodeImage } from '../lib/fetchNodeImage';
import heic2any from 'heic2any';

const { Text } = Typography;

const nodeTypes = {
  anchorNode:  AnchorNode,
  contextNode: ContextNode,
  groupFrame:  GroupFrameNode,
  mediaNode:   MediaNode,
  stickyNode:  StickyNode,
};

const edgeTypes = {
  floating:  FloatingEdge,
  proximity: ProximityEdge,
};

/** Minimum bounding-box edge distance between two rectangles */
function rectEdgeDist(ax, ay, aw, ah, bx, by, bw, bh) {
  const dx = Math.max(0, Math.max(ax, bx) - Math.min(ax + aw, bx + bw));
  const dy = Math.max(0, Math.max(ay, by) - Math.min(ay + ah, by + bh));
  return Math.sqrt(dx * dx + dy * dy);
}

const PROXIMITY_THRESHOLD = 80; // px, flow coordinates

// ── Persistence helpers ──────────────────────────────────────────────────────
function loadCanvas() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CANVAS);
    return raw ? JSON.parse(raw) : { nodes: [], edges: [] };
  } catch { return { nodes: [], edges: [] }; }
}
function saveCanvas(nodes, edges) {
  try { localStorage.setItem(STORAGE_KEYS.CANVAS, JSON.stringify({ nodes, edges })); }
  catch (e) { console.warn('Canvas save failed:', e); }
}
function getUsage() {
  try {
    const raw   = localStorage.getItem(STORAGE_KEYS.USAGE);
    const today = new Date().toISOString().slice(0, 10);
    if (!raw) return { date: today, count: 0 };
    const p     = JSON.parse(raw);
    return p.date !== today ? { date: today, count: 0 } : p;
  } catch { return { date: new Date().toISOString().slice(0, 10), count: 0 }; }
}
function saveUsage(u) { localStorage.setItem(STORAGE_KEYS.USAGE, JSON.stringify(u)); }

// ── Edge helpers ─────────────────────────────────────────────────────────────
function edgeColor(s) {
  return s === 'strong' ? 'rgba(255,255,255,0.40)' : s === 'moderate' ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.10)';
}
function edgeWidth(s) { return s === 'strong' ? 1.5 : s === 'moderate' ? 1 : 1; }

function buildMarker(markerKey) {
  if (markerKey === 'none') return undefined;
  return {
    type:  markerKey === 'arrowclosed' ? MarkerType.ArrowClosed : MarkerType.Arrow,
    width: 16, height: 16,
    color: 'var(--color-weak)',
  };
}

// ── Group bounds ─────────────────────────────────────────────────────────────
function computeGroupBounds(memberNodes, padding = 56) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  memberNodes.forEach(n => {
    const w = n.measured?.width  ?? (n.type === 'anchorNode' ? 240 : 180);
    const h = n.measured?.height ?? (n.type === 'anchorNode' ? 120 : 100);
    minX = Math.min(minX, n.position.x);       minY = Math.min(minY, n.position.y);
    maxX = Math.max(maxX, n.position.x + w);   maxY = Math.max(maxY, n.position.y + h);
  });
  return { x: minX - padding, y: minY - padding, width: maxX - minX + padding * 2, height: maxY - minY + padding * 2 };
}

export default function Canvas({
  apiKey, onCardsGenerated, importedState,
  activePanel, onPanelClose, onRegisterAddNote, onUsageChange,
}) {
  const saved = importedState || loadCanvas();
  const [nodes, setNodes, onNodesChange] = useNodesState(saved.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(saved.edges);

  const [contextMenu, setContextMenu]   = useState(null);
  const [addDialog, setAddDialog]       = useState(false);
  const [addForm, setAddForm]           = useState({ title: '', body: '', flowPos: null });
  const [usage, setUsage]               = useState(getUsage);

  // Edge / canvas config
  const [edgeType,     setEdgeType]     = useState('smoothstep');
  const [markerType,   setMarkerType]   = useState('none');
  const [animateEdges, setAnimateEdges] = useState(false);
  const [bgVariant,    setBgVariant]    = useState(BackgroundVariant.Dots);
  const [snapToGrid,   setSnapToGrid]   = useState(false);
  const [showMiniMap,  setShowMiniMap]  = useState(true);

  // Tool mode: 'pointer' | 'text'
  const [toolMode, setToolMode] = useState('pointer');

  // Proximity connect
  const [proximityTargetId, setProximityTargetId] = useState(null);

  // Add-node-on-edge-drop
  const [dropConnect, setDropConnect] = useState(null); // { flowPos, fromNodeId, fromHandle }

  // Edge label editing
  const [editingEdge, setEditingEdge] = useState(null); // { id, label }

  const reactFlowWrapper = useRef(null);
  const [rfInstance, setRfInstance]   = useState(null);
  const nodesRef     = useRef(nodes);
  const edgesRef     = useRef(edges);
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => { edgesRef.current = edges; }, [edges]);

  // Stable refs — updated each render so stale closures in node.data always call current versions
  const toggleStarRef         = useRef(null);
  const expandNodeRef         = useRef(null);
  const openContextMenuRef    = useRef(null);
  const revealContextNodeRef  = useRef(null);
  const edgeTypeRef           = useRef(edgeType);
  const markerTypeRef         = useRef(markerType);
  const animateEdgesRef       = useRef(animateEdges);
  const proximityTargetIdRef  = useRef(proximityTargetId);
  const clipboardRef            = useRef([]);
  const copySelectedRef         = useRef(null);
  const pasteNodesRef           = useRef(null);
  const groupSelectedNodesRef   = useRef(null);
  const ungroupSelectedRef      = useRef(null);

  useEffect(() => { edgeTypeRef.current          = edgeType;          }, [edgeType]);
  useEffect(() => { markerTypeRef.current         = markerType;        }, [markerType]);
  useEffect(() => { animateEdgesRef.current       = animateEdges;      }, [animateEdges]);
  useEffect(() => { proximityTargetIdRef.current  = proximityTargetId; }, [proximityTargetId]);

  // Persist on change
  useEffect(() => { saveCanvas(nodes, edges); }, [nodes, edges]);

  // Register add-note trigger for sidebar
  useEffect(() => {
    onRegisterAddNote?.(() => {
      setAddForm({ title: '', body: '', flowPos: null });
      setAddDialog(true);
    });
  }, [onRegisterAddNote]);

  // Click-away to close active panel
  useEffect(() => {
    if (!activePanel) return;
    function onDown(e) {
      const panel   = document.querySelector('[data-panel]');
      const sidebar = document.querySelector('.sidebar');
      if (panel && !panel.contains(e.target) && (!sidebar || !sidebar.contains(e.target))) {
        if (e.target.classList.contains('css-picker-overlay')) return;
        onPanelClose?.();
      }
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [activePanel, onPanelClose]);

  // ── Re-attach callbacks to nodes loaded from localStorage ────────────────
  // Functions are stripped when serialised to JSON; re-inject them on mount.
  // Also computes inGroup from group membership so label bg works for old nodes.
  useEffect(() => {
    setNodes(ns => {
      const groupMemberIds = new Set(
        ns.filter(n => n.type === 'groupFrame').flatMap(n => n.data?.memberIds ?? [])
      );
      return ns.map(n => {
        const inGroup = groupMemberIds.has(n.id);
        if (n.type === 'anchorNode') {
          return { ...n, data: { ...n.data, inGroup, ...makeAnchorCallbacks(n.id) } };
        }
        if (n.type === 'contextNode') {
          const item = {
            key:                n.data.category,
            title:              n.data.title,
            summary:            n.data.summary,
            connectionStrength: n.data.connectionStrength,
          };
          return { ...n, data: { ...n.data, inGroup, ...makeContextCallbacks(n.id, n.data.anchorId, item) } };
        }
        if (n.type === 'stickyNode') {
          return { ...n, data: {
            ...n.data,
            onTextChange: (text) => setNodes(prev => prev.map(nd => nd.id === n.id ? { ...nd, data: { ...nd.data, text } } : nd)),
            onDelete: () => setNodes(prev => prev.filter(nd => nd.id !== n.id)),
          }};
        }
        if (n.type === 'mediaNode') {
          return { ...n, data: {
            ...n.data,
            onDelete: () => setNodes(prev => prev.filter(nd => nd.id !== n.id)),
          }};
        }
        return n;
      });
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Migrate edges stored with root `label` prop → move into `data.label`
  // (avoids ReactFlow built-in edge types rendering their own white label box)
  useEffect(() => {
    setEdges(es => es.map(e => {
      if (e.label && !e.data?.label) {
        const { label, ...rest } = e;
        return { ...rest, data: { ...rest.data, label } };
      }
      if (e.label === '' || e.label === undefined) {
        const { label, ...rest } = e;
        return rest;
      }
      return e;
    }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Apply proximity-target CSS class to proximity node
  useEffect(() => {
    setNodes(ns => ns.map(n => {
      if (n.type === 'groupFrame') return n;
      const want = n.id === proximityTargetId ? 'proximity-target' : '';
      if ((n.className ?? '') === want) return n;
      return { ...n, className: want };
    }));
  }, [proximityTargetId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Edge factory ─────────────────────────────────────────────────────────
  function makeEdge(sourceId, targetId, strength = 'weak') {
    const et    = edgeTypeRef.current;
    const mk    = markerTypeRef.current;
    const anim  = animateEdgesRef.current;
    const marker = buildMarker(mk);
    return {
      id:        `${sourceId}->${targetId}`,
      source:    sourceId,
      target:    targetId,
      type:      et,
      animated:  anim,
      markerEnd: marker,
      data:      { label: '' },
      style: {
        stroke:      edgeColor(strength),
        strokeWidth: edgeWidth(strength),
        opacity:     0.5,
      },
    };
  }

  // ── Callback factories (via stable refs so stale closures call current fns) ──
  function makeAnchorCallbacks(id) {
    return {
      onExpand:      () => expandNodeRef.current?.(id),
      onContextMenu: (e) => { e.preventDefault(); openContextMenuRef.current?.(e, id, 'anchorNode'); },
      onToggleStar:  () => toggleStarRef.current?.(id),
    };
  }
  function makeContextCallbacks(id, anchorId, item) {
    return {
      onReveal:      () => revealContextNodeRef.current?.(id, anchorId, item),
      onContextMenu: (e) => { e.preventDefault(); openContextMenuRef.current?.(e, id, 'contextNode'); },
      onToggleStar:  () => toggleStarRef.current?.(id),
    };
  }

  // ── Add sticky note ──────────────────────────────────────────────────────
  function addStickyNode(flowPos) {
    const id = uuidv4();
    setNodes(ns => [...ns, {
      id,
      type: 'stickyNode',
      position: flowPos,
      style: { width: 200, minHeight: 100 },
      data: {
        text: '',
        onTextChange: (text) => setNodes(n => n.map(nd => nd.id === id ? { ...nd, data: { ...nd.data, text } } : nd)),
        onDelete: () => setNodes(n => n.filter(nd => nd.id !== id)),
      },
    }]);
  }

  // ── Add anchor node ──────────────────────────────────────────────────────
  function addAnchorNode(title, body, flowPos, autoConnectFromId = null) {
    const id       = uuidv4();
    const position = flowPos ?? (rfInstance
      ? rfInstance.screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
      : { x: 200 + Math.random() * 200, y: 200 + Math.random() * 200 });

    const newNode = {
      id,
      type: 'anchorNode',
      position,
      data: { title, body, contextNodes: [], loading: false, starred: false, ...makeAnchorCallbacks(id) },
    };

    setNodes(ns => [...ns, newNode]);

    if (autoConnectFromId) {
      setEdges(es => [...es, makeEdge(autoConnectFromId, id, 'weak')]);
    }
  }

  // ── Expand anchor via AI ─────────────────────────────────────────────────
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

      const results  = await expandAnchor(apiKey, anchor.data.title, anchor.data.body);
      const newUsage = { date: currentUsage.date, count: currentUsage.count + 1 };
      saveUsage(newUsage);
      setUsage(newUsage);
      onUsageChange?.(newUsage.count);

      const positions      = radialPositions(anchor.position, results.length, 320);
      const contextNodeIds = [];
      const newNodes       = [];
      const newEdges       = [];

      results.forEach((item, i) => {
        const ctxId = uuidv4();
        contextNodeIds.push(ctxId);
        newNodes.push({
          id:   ctxId,
          type: 'contextNode',
          position: positions[i],
          data: {
            category:           item.key,
            title:              item.title,
            summary:            item.summary,
            connectionStrength: item.connectionStrength,
            revealed:           false,
            anchorId,
            starred:            false,
            termDefinitions:    {},
            nodeImage:          null,
            ...makeContextCallbacks(ctxId, anchorId, item),
          },
        });
        newEdges.push(makeEdge(anchorId, ctxId, item.connectionStrength));
      });

      setNodes(ns => [
        ...ns.map(n =>
          n.id === anchorId
            ? { ...n, data: { ...n.data, loading: false, contextNodes: contextNodeIds } }
            : n
        ),
        ...newNodes,
      ]);
      setEdges(es => [...es, ...newEdges]);

      // Pre-fetch images in the background so they're cached before the user reveals nodes
      results.forEach((item, i) => {
        const ctxId = contextNodeIds[i];
        fetchNodeImage(item.title).then(src => {
          if (src) {
            setNodes(ns => ns.map(n =>
              n.id === ctxId ? { ...n, data: { ...n.data, nodeImage: src } } : n
            ));
          }
        }).catch(() => {});
      });

    } catch (err) {
      console.error('Expand failed:', err);
      alert(`Expansion failed: ${err.message}`);
      setNodes(ns => ns.map(n =>
        n.id === anchorId ? { ...n, data: { ...n.data, loading: false } } : n
      ));
    }
  }

  // ── Reveal context node ──────────────────────────────────────────────────
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
    const cat    = CATEGORY_BY_KEY[item.key];

    if (anchor && apiKey) {
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
            anchorTitle:   anchor.data.title,
            category:      item.key,
            categoryLabel: cat?.label || item.key,
            dueDate:       new Date().toISOString(),
            interval:      0,
          })));
        }
      }).catch(() => {});
    }
  }

  // ── Toggle star ──────────────────────────────────────────────────────────
  function toggleStar(nodeId) {
    setNodes(ns => ns.map(n =>
      n.id === nodeId ? { ...n, data: { ...n.data, starred: !n.data.starred } } : n
    ));
    setContextMenu(null);
  }

  // ── Toggle group collapse ────────────────────────────────────────────────
  function toggleGroupCollapse(groupId) {
    setNodes(ns => {
      const group = ns.find(n => n.id === groupId);
      if (!group) return ns;
      const nowCollapsed = !group.data.collapsed;
      const memberIds    = new Set(group.data.memberIds);
      return ns.map(n => {
        if (n.id === groupId) return { ...n, data: { ...n.data, collapsed: nowCollapsed } };
        if (memberIds.has(n.id) && n.type === 'contextNode') return { ...n, hidden: nowCollapsed };
        return n;
      });
    });
  }

  // ── Group / Ungroup selected nodes ───────────────────────────────────────
  function groupSelectedNodes() {
    const sel = nodesRef.current.filter(n => n.selected && n.type !== 'groupFrame');
    if (sel.length < 2) return;
    const groupId   = uuidv4();
    const memberIds = sel.map(n => n.id);
    const bounds    = computeGroupBounds(sel);
    const anchor    = sel.find(n => n.type === 'anchorNode');
    const groupNode = {
      id:         groupId,
      type:       'groupFrame',
      position:   { x: bounds.x, y: bounds.y },
      style:      { width: bounds.width, height: bounds.height },
      selectable: false,
      draggable:  false,
      zIndex:     -1,
      data: {
        label:            anchor?.data?.title ?? '',
        memberIds,
        collapsed:        false,
        onToggleCollapse: () => toggleGroupCollapse(groupId),
      },
    };
    setNodes(ns => [
      groupNode,
      ...ns.map(n => memberIds.includes(n.id) ? { ...n, data: { ...n.data, inGroup: true } } : n),
    ]);
  }

  function ungroupSelected() {
    const selIds        = new Set(nodesRef.current.filter(n => n.selected).map(n => n.id));
    const groupsToRemove = nodesRef.current.filter(n =>
      n.type === 'groupFrame' &&
      (selIds.has(n.id) || (n.data.memberIds ?? []).some(id => selIds.has(id)))
    );
    if (groupsToRemove.length === 0) return;
    const removeGroupIds   = new Set(groupsToRemove.map(g => g.id));
    const unGroupMemberIds = new Set(groupsToRemove.flatMap(g => g.data.memberIds ?? []));
    setNodes(ns => ns
      .filter(n => !removeGroupIds.has(n.id))
      .map(n => unGroupMemberIds.has(n.id) ? { ...n, data: { ...n.data, inGroup: false } } : n)
    );
  }

  // ── Context menu ─────────────────────────────────────────────────────────
  function openContextMenu(e, nodeId, nodeType) {
    setContextMenu({ x: e.clientX, y: e.clientY, nodeId, nodeType });
  }

  function deleteNode(nodeId) {
    const node     = nodesRef.current.find(n => n.id === nodeId);
    const toDelete = new Set([nodeId]);
    if (node?.data?.contextNodes) node.data.contextNodes.forEach(id => toDelete.add(id));
    const gf = nodesRef.current.find(n => n.type === 'groupFrame' && n.data.memberIds?.includes(nodeId));
    if (gf) toDelete.add(gf.id);
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

  // ── Collision detection (reads from ns, not stale param) ─────────────────
  const handleCollision = useCallback((draggedId) => {
    setNodes(ns => {
      const dragged = ns.find(n => n.id === draggedId);
      if (!dragged || dragged.type === 'groupFrame') return ns;

      const dw = dragged.measured?.width  ?? 220;
      const dh = dragged.measured?.height ?? 110;

      const colliding = ns.filter(n => {
        if (n.id === draggedId || n.type === 'groupFrame' || n.hidden) return false;
        const nw = n.measured?.width  ?? 220;
        const nh = n.measured?.height ?? 110;
        return !(
          dragged.position.x + dw + 8 < n.position.x ||
          dragged.position.x          > n.position.x + nw + 8 ||
          dragged.position.y + dh + 8 < n.position.y ||
          dragged.position.y          > n.position.y + nh + 8
        );
      });
      if (colliding.length === 0) return ns;

      let px = dragged.position.x, py = dragged.position.y;
      colliding.forEach(other => {
        const nw = other.measured?.width  ?? 220;
        const nh = other.measured?.height ?? 110;
        const cx1 = px + dw / 2, cy1 = py + dh / 2;
        const cx2 = other.position.x + nw / 2, cy2 = other.position.y + nh / 2;
        const dx  = cx1 - cx2, dy = cy1 - cy2;
        const mag = Math.sqrt(dx * dx + dy * dy) || 1;
        px += (dx / mag) * 36;
        py += (dy / mag) * 36;
      });
      return ns.map(n => n.id === draggedId ? { ...n, position: { x: px, y: py } } : n);
    });
  }, []);

  // ── Group bounds update ──────────────────────────────────────────────────
  const updateGroupBounds = useCallback((movedId) => {
    setNodes(ns => {
      const group   = ns.find(n => n.type === 'groupFrame' && n.data.memberIds?.includes(movedId));
      if (!group) return ns;
      const members = ns.filter(n => group.data.memberIds.includes(n.id) && n.type !== 'groupFrame');
      if (members.length === 0) return ns;
      const bounds  = computeGroupBounds(members);
      return ns.map(n => n.id === group.id
        ? { ...n, position: { x: bounds.x, y: bounds.y }, style: { width: bounds.width, height: bounds.height } }
        : n
      );
    });
  }, []);

  // ── Proximity connect ────────────────────────────────────────────────────
  const onNodeDrag = useCallback((e, draggedNode) => {
    if (draggedNode.type === 'groupFrame') return;
    const dw = draggedNode.measured?.width  ?? 220;
    const dh = draggedNode.measured?.height ?? 110;
    const dc = { x: draggedNode.position.x + dw / 2, y: draggedNode.position.y + dh / 2 };

    let closestId   = null;
    let closestDist = PROXIMITY_THRESHOLD;

    nodesRef.current.forEach(n => {
      if (n.id === draggedNode.id || n.type === 'groupFrame' || n.hidden) return;
      const nw = n.measured?.width  ?? 220;
      const nh = n.measured?.height ?? 110;
      const nc = { x: n.position.x + nw / 2, y: n.position.y + nh / 2 };
      const d  = Math.hypot(dc.x - nc.x, dc.y - nc.y);
      if (d < closestDist) { closestDist = d; closestId = n.id; }
    });

    if (closestId !== proximityTargetIdRef.current) {
      setProximityTargetId(closestId);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onNodeDragStop = useCallback((e, draggedNode) => {
    handleCollision(draggedNode.id);
    updateGroupBounds(draggedNode.id);

    // Auto-connect on proximity
    const targetId = proximityTargetIdRef.current;
    if (targetId && draggedNode.type !== 'groupFrame') {
      const alreadyConnected = edgesRef.current.some(
        ed => (ed.source === draggedNode.id && ed.target === targetId) ||
              (ed.source === targetId && ed.target === draggedNode.id)
      );
      if (!alreadyConnected) {
        setEdges(es => [...es, makeEdge(draggedNode.id, targetId, 'weak')]);
      }
    }
    setProximityTargetId(null);
  }, [handleCollision, updateGroupBounds]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Copy / Paste ─────────────────────────────────────────────────────────
  function copySelected() {
    const sel = nodesRef.current.filter(n => n.selected && n.type === 'anchorNode');
    if (sel.length === 0) return;
    clipboardRef.current = sel.map(n => ({ title: n.data.title, body: n.data.body, position: { ...n.position } }));
  }
  function pasteNodes() {
    if (clipboardRef.current.length === 0) return;
    setNodes(ns => [...ns, ...clipboardRef.current.map(cn => {
      const id = uuidv4();
      return {
        id, type: 'anchorNode',
        position: { x: cn.position.x + 40, y: cn.position.y + 40 },
        data: { title: cn.title, body: cn.body, contextNodes: [], loading: false, starred: false, ...makeAnchorCallbacks(id) },
      };
    })]);
  }
  copySelectedRef.current       = copySelected;
  pasteNodesRef.current         = pasteNodes;
  groupSelectedNodesRef.current = groupSelectedNodes;
  ungroupSelectedRef.current    = ungroupSelected;

  // ── Keyboard shortcuts ───────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e) {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key === 'c') { e.preventDefault(); copySelectedRef.current?.(); }
      if (meta && e.key === 'v') { e.preventDefault(); pasteNodesRef.current?.(); }
      if (meta && !e.shiftKey && e.key === 'g') { e.preventDefault(); groupSelectedNodesRef.current?.(); }
      if (meta &&  e.shiftKey && e.key === 'G') { e.preventDefault(); ungroupSelectedRef.current?.(); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ── Connect ──────────────────────────────────────────────────────────────
  const onConnect = useCallback(params => {
    setEdges(es => addEdge(makeEdge(params.source, params.target, 'weak'), es));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Add-node on edge drop ────────────────────────────────────────────────
  const onConnectEnd = useCallback((event, connectionState) => {
    if (connectionState.isValid || !rfInstance) return;
    const { clientX, clientY } = 'touches' in event ? event.touches[0] : event;
    const flowPos = rfInstance.screenToFlowPosition({ x: clientX, y: clientY });
    setDropConnect({
      flowPos,
      fromNodeId: connectionState.fromNode?.id ?? null,
    });
    setAddForm({ title: '', body: '', flowPos });
    setAddDialog(true);
  }, [rfInstance]);

  // ── Edge type / animate apply-to-all ────────────────────────────────────
  function applyEdgeTypeToAll(type) {
    setEdgeType(type);
    setEdges(es => es.map(e => ({ ...e, type })));
  }
  function applyMarkerToAll(mk) {
    setMarkerType(mk);
    const marker = buildMarker(mk);
    setEdges(es => es.map(e => ({ ...e, markerEnd: marker })));
  }
  function applyAnimateToAll(anim) {
    setAnimateEdges(anim);
    setEdges(es => es.map(e => ({ ...e, animated: anim })));
  }

  // ── Edge label editing (inline, no modal) ───────────────────────────────
  function onEdgeDoubleClick(e, edge) {
    e.stopPropagation();
    // Ensure the edge has a data.label field before editing
    if (!edge.data?.label && edge.data?.label !== '') {
      setEdges(es => es.map(e2 => e2.id === edge.id ? { ...e2, data: { ...e2.data, label: '' } } : e2));
    }
    setEditingEdge({ id: edge.id, label: edge.data?.label ?? '' });
  }
  function saveEdgeLabel(label) {
    if (!editingEdge) return;
    const trimmed = label.trim();
    setEdges(es => es.map(e =>
      e.id === editingEdge.id ? { ...e, data: { ...e.data, label: trimmed || undefined } } : e
    ));
    setEditingEdge(null);
  }

  // ── Edge label renderer — inline editable, all edge types ───────────────
  function EdgeLabels() {
    // Show edges that have a real label, or the one currently being edited
    const visible = edges.filter(e => e.data?.label || editingEdge?.id === e.id);
    return (
      <EdgeLabelRenderer>
        {visible.map(edge => {
          const src = nodesRef.current.find(n => n.id === edge.source);
          const tgt = nodesRef.current.find(n => n.id === edge.target);
          if (!src || !tgt) return null;
          const x = (src.position.x + (src.measured?.width ?? 200) / 2 + tgt.position.x + (tgt.measured?.width ?? 200) / 2) / 2;
          const y = (src.position.y + (src.measured?.height ?? 100) / 2 + tgt.position.y + (tgt.measured?.height ?? 100) / 2) / 2;
          const isEditing = editingEdge?.id === edge.id;
          return (
            <div
              key={edge.id}
              className={`edge-label nodrag nopan${isEditing ? ' editing' : ''}`}
              style={{ transform: `translate(-50%,-50%) translate(${x}px,${y}px)` }}
            >
              {isEditing ? (
                <input
                  className="edge-label__input"
                  autoFocus
                  value={editingEdge.label}
                  placeholder="Label…"
                  onChange={ev => setEditingEdge(prev => prev ? { ...prev, label: ev.target.value } : null)}
                  onBlur={() => saveEdgeLabel(editingEdge.label)}
                  onKeyDown={ev => {
                    if (ev.key === 'Enter')  { ev.stopPropagation(); saveEdgeLabel(editingEdge.label); }
                    if (ev.key === 'Escape') { ev.stopPropagation(); setEditingEdge(null); }
                  }}
                  onClick={ev => ev.stopPropagation()}
                />
              ) : (
                <span
                  onDoubleClick={ev => {
                    ev.stopPropagation();
                    setEditingEdge({ id: edge.id, label: edge.data?.label ?? '' });
                  }}
                >
                  {edge.data?.label}
                </span>
              )}
            </div>
          );
        })}
      </EdgeLabelRenderer>
    );
  }

  // ── File drag-and-drop ───────────────────────────────────────────────────
  const onDragOver = useCallback((e) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes('Files')) e.dataTransfer.dropEffect = 'copy';
  }, []);
  const onDrop = useCallback((e) => {
    e.preventDefault();
    if (!rfInstance) return;

    const isHeic = f => /\.(heic|heif)$/i.test(f.name) || f.type === 'image/heic' || f.type === 'image/heif';
    const isVideo = f => f.type.startsWith('video/') || /\.(mp4|webm|mov|avi)$/i.test(f.name);
    const isImage = f => f.type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff?)$/i.test(f.name);

    const files = Array.from(e.dataTransfer.files).filter(f => isImage(f) || isVideo(f) || isHeic(f));
    if (files.length === 0) return;
    const dropPos = rfInstance.screenToFlowPosition({ x: e.clientX, y: e.clientY });

    function placeNode(src, file, idx, mediaType) {
      const id = uuidv4();
      setNodes(ns => [...ns, {
        id, type: 'mediaNode',
        position: { x: dropPos.x + idx * 24, y: dropPos.y + idx * 24 },
        style: { width: 320, height: mediaType === 'video' ? 200 : undefined },
        data: {
          src, name: file.name,
          mediaType,
          onDelete: () => setNodes(n => n.filter(nd => nd.id !== id)),
        },
      }]);
    }

    files.forEach((file, i) => {
      if (isHeic(file)) {
        // Convert HEIC → JPEG client-side
        heic2any({ blob: file, toType: 'image/jpeg', quality: 0.88 })
          .then(result => {
            const blob = Array.isArray(result) ? result[0] : result;
            const reader = new FileReader();
            reader.onload = ev => placeNode(ev.target.result, file, i, 'image');
            reader.readAsDataURL(blob);
          })
          .catch(() => {
            // Conversion failed — place placeholder
            placeNode(null, file, i, 'image');
          });
      } else {
        const reader = new FileReader();
        reader.onload = ev => placeNode(ev.target.result, file, i, isVideo(file) ? 'video' : 'image');
        reader.readAsDataURL(file);
      }
    });
  }, [rfInstance]);

  // ── Keep stable-refs current each render ────────────────────────────────
  toggleStarRef.current        = toggleStar;
  expandNodeRef.current        = expandNode;
  openContextMenuRef.current   = openContextMenu;
  revealContextNodeRef.current = revealContextNode;

  const selectedNodes = nodes.filter(n => n.selected && n.type !== 'groupFrame');

  // ── Proximity edges (media nodes → nearest node, rendered in SVG layer behind cards) ──
  const PROX_THRESHOLD = 500;
  const proximityEdges = useMemo(() => {
    const mediaNodes = nodes.filter(n => n.type === 'mediaNode' && !n.hidden);
    const candidates  = nodes.filter(n => n.type !== 'mediaNode' && n.type !== 'groupFrame' && !n.hidden);
    const result = [];
    mediaNodes.forEach(media => {
      const mw = media.measured?.width  ?? 320;
      const mh = media.measured?.height ?? 200;
      let closest = null, minDist = PROX_THRESHOLD;
      candidates.forEach(c => {
        const cw = c.measured?.width  ?? 320;
        const ch = c.measured?.height ?? 200;
        const d  = rectEdgeDist(media.position.x, media.position.y, mw, mh, c.position.x, c.position.y, cw, ch);
        if (d < minDist) { minDist = d; closest = c; }
      });
      if (!closest) return;
      const opacity = (0.07 + (1 - minDist / PROX_THRESHOLD) * 0.18).toFixed(3);
      result.push({
        id: `prox-${media.id}-${closest.id}`,
        source: media.id, target: closest.id,
        type: 'proximity',
        selectable: false, deletable: false, focusable: false,
        style: { stroke: `rgba(255,255,255,${opacity})` },
      });
    });
    return result;
  }, [nodes]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── V / T keyboard shortcuts ─────────────────────────────────────────────
  useEffect(() => {
    function onKey(e) {
      // Skip if typing in an input/editable element
      if (e.target instanceof Element && e.target.closest('input, textarea, [contenteditable]')) return;
      if (e.key === 'v' || e.key === 'V') setToolMode('pointer');
      if (e.key === 't' || e.key === 'T') setToolMode(m => m === 'text' ? 'pointer' : 'text');
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div
      className="canvas-wrapper"
      ref={reactFlowWrapper}
      data-tool={toolMode}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDoubleClick={e => {
        // In text mode, single click already created a sticky — nothing to do on double-click
        if (toolMode === 'text') return;
        // Only trigger on bare canvas clicks — not on nodes or UI elements
        if (!rfInstance || e.target.closest('.react-flow__node, .react-flow__controls, .view-panel, .ant-modal')) return;
        const flowPos = rfInstance.screenToFlowPosition({ x: e.clientX, y: e.clientY });
        setAddForm({ title: '', body: '', flowPos });
        setAddDialog(true);
      }}
      onClick={e => {
        // Text tool: single click on bare canvas creates a sticky
        if (toolMode !== 'text') return;
        if (!rfInstance || e.target.closest('.react-flow__node, .react-flow__controls, .view-panel, .ant-modal, .canvas-tool-strip')) return;
        const flowPos = rfInstance.screenToFlowPosition({ x: e.clientX, y: e.clientY });
        addStickyNode(flowPos);
        setToolMode('pointer'); // revert to pointer after placing
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={[...edges, ...proximityEdges]}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={changes => {
          // Ignore proximity edge changes — they're computed, not stored
          onEdgesChange(changes.filter(c => !c.id?.startsWith('prox-')));
        }}
        onConnect={onConnect}
        onConnectEnd={onConnectEnd}
        onInit={setRfInstance}
        onPaneClick={() => { setContextMenu(null); setProximityTargetId(null); }}
        onPaneContextMenu={e => {
          e.preventDefault();
          if (!rfInstance) return;
          const flowPos = rfInstance.screenToFlowPosition({ x: e.clientX, y: e.clientY });
          setContextMenu({ x: e.clientX, y: e.clientY, nodeId: null, nodeType: 'pane', flowPos });
        }}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        onEdgeDoubleClick={onEdgeDoubleClick}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.08}
        maxZoom={2.5}
        deleteKeyCode={['Delete', 'Backspace']}
        selectionMode={SelectionMode.Partial}
        selectionOnDrag={true}
        panOnDrag={[1, 2]}
        panOnScroll={true}
        multiSelectionKeyCode="Shift"
        connectionMode={ConnectionMode.Loose}
        connectionRadius={40}
        snapToGrid={snapToGrid}
        snapGrid={[16, 16]}
      >
        {bgVariant !== null && (
          <Background
            variant={bgVariant}
            gap={24}
            size={bgVariant === BackgroundVariant.Dots ? 1.5 : 1}
            color={bgVariant === BackgroundVariant.Dots ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.07)'}
          />
        )}
        <Controls />
        {showMiniMap && (
          <MiniMap
            nodeStrokeWidth={0}
            nodeColor={n =>
              n.type === 'anchorNode'  ? 'rgba(29,111,216,0.4)'  :
              n.type === 'groupFrame'  ? 'transparent'           :
              n.type === 'mediaNode'   ? 'rgba(100,100,100,0.3)' :
              'rgba(100,100,100,0.2)'
            }
          />
        )}
        <ViewPanel
          edgeType={edgeType}         onEdgeTypeChange={applyEdgeTypeToAll}
          animateEdges={animateEdges} onAnimateToggle={() => applyAnimateToAll(!animateEdges)}
          bgVariant={bgVariant}       onBgVariantChange={setBgVariant}
          snapToGrid={snapToGrid}     onSnapToggle={() => setSnapToGrid(v => !v)}
          showMiniMap={showMiniMap}   onMiniMapToggle={() => setShowMiniMap(v => !v)}
          onFitView={() => rfInstance?.fitView({ padding: 0.3 })}
        />
        <EdgeLabels />
      </ReactFlow>

      {/* ── Canvas tool strip ── */}
      <div className="canvas-tool-strip">
        <button
          className={`canvas-tool-strip__btn${toolMode === 'pointer' ? ' active' : ''}`}
          title="Select / Move (V)"
          onClick={() => setToolMode('pointer')}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 1l9 5.5-4 1.5L5.5 12 2 1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
          </svg>
        </button>
        <button
          className={`canvas-tool-strip__btn${toolMode === 'text' ? ' active' : ''}`}
          title="Sticky note (T) — click canvas to place"
          onClick={() => setToolMode(m => m === 'text' ? 'pointer' : 'text')}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="2" y="2" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1.2"/>
            <line x1="4.5" y1="5" x2="9.5" y2="5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            <line x1="4.5" y1="7.5" x2="7.5" y2="7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* ── Add note dialog ── */}
      <Modal
        title="Add a note"
        open={addDialog}
        onCancel={() => {
          setAddDialog(false);
          setDropConnect(null);
          setAddForm({ title: '', body: '', flowPos: null });
        }}
        onOk={() => {
          if (!addForm.title.trim()) return;
          addAnchorNode(addForm.title.trim(), addForm.body.trim(), addForm.flowPos, dropConnect?.fromNodeId ?? null);
          setAddDialog(false);
          setDropConnect(null);
          setAddForm({ title: '', body: '', flowPos: null });
        }}
        okText="Add note"
        cancelText="Cancel"
        okButtonProps={{ disabled: !addForm.title.trim() }}
        width={440}
        destroyOnHidden
      >
        {dropConnect?.fromNodeId && (
          <Text type="secondary" style={{ display: 'block', marginBottom: 8, fontSize: 11 }}>
            ⤷ Will auto-connect from the source node
          </Text>
        )}
        <Text type="secondary" style={{ display: 'block', marginBottom: 16, fontSize: 12, lineHeight: 1.55 }}>
          Write about anything — a concept, question, person, event. Webs will
          expand it across 14 dimensions of context.
        </Text>
        <Input
          placeholder="What are you curious about?"
          value={addForm.title}
          onChange={e => setAddForm(f => ({ ...f, title: e.target.value }))}
          autoFocus
          onPressEnter={() => {
            if (!addForm.title.trim()) return;
            addAnchorNode(addForm.title.trim(), addForm.body.trim(), addForm.flowPos, dropConnect?.fromNodeId ?? null);
            setAddDialog(false);
            setDropConnect(null);
            setAddForm({ title: '', body: '', flowPos: null });
          }}
          style={{ marginBottom: 12 }}
        />
        <Input.TextArea
          placeholder="Optional context — what you already know, what you're wondering…"
          value={addForm.body}
          onChange={e => setAddForm(f => ({ ...f, body: e.target.value }))}
          autoSize={{ minRows: 3, maxRows: 6 }}
        />
      </Modal>

      {/* ── Context menu ── */}
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
                const node      = nodesRef.current.find(n => n.id === contextMenu.nodeId);
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

      {/* ── CSS Inspector ── */}
      {activePanel === 'css' && <CSSInspector onClose={onPanelClose} />}

      {/* ── Debug Panel ── */}
      {activePanel === 'debug' && (
        <DebugPanel nodes={nodes} edges={edges} selectedNodes={selectedNodes} onClose={onPanelClose} />
      )}
    </div>
  );
}
