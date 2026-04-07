/**
 * FloatingEdge — connects to the nearest point on each node's border
 * rather than fixed left/right handles. Supports labels + EdgeLabelRenderer.
 */
import { useInternalNode, getBezierPath, EdgeLabelRenderer, BaseEdge } from '@xyflow/react';

/** Find where the line from node-center toward `targetCenter` exits the node's rect border */
function getNodeBorderPoint(node, targetCenter) {
  const { x, y } = node.internals.positionAbsolute;
  const w  = node.measured?.width  ?? 160;
  const h  = node.measured?.height ?? 100;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const dx = targetCenter.x - cx;
  const dy = targetCenter.y - cy;

  if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) return { x: cx, y: cy };

  const scaleX = Math.abs(dx) > 0.001 ? (w / 2) / Math.abs(dx) : Infinity;
  const scaleY = Math.abs(dy) > 0.001 ? (h / 2) / Math.abs(dy) : Infinity;
  const scale  = Math.min(scaleX, scaleY);

  return { x: cx + dx * scale, y: cy + dy * scale };
}

export default function FloatingEdge({
  id, source, target, style, markerEnd, markerStart, label, data,
}) {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);

  if (!sourceNode?.internals?.positionAbsolute || !targetNode?.internals?.positionAbsolute) {
    return null;
  }

  const srcCenter = {
    x: sourceNode.internals.positionAbsolute.x + (sourceNode.measured?.width  ?? 160) / 2,
    y: sourceNode.internals.positionAbsolute.y + (sourceNode.measured?.height ?? 100) / 2,
  };
  const tgtCenter = {
    x: targetNode.internals.positionAbsolute.x + (targetNode.measured?.width  ?? 160) / 2,
    y: targetNode.internals.positionAbsolute.y + (targetNode.measured?.height ?? 100) / 2,
  };

  const srcBorder = getNodeBorderPoint(sourceNode, tgtCenter);
  const tgtBorder = getNodeBorderPoint(targetNode, srcCenter);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX: srcBorder.x,
    sourceY: srcBorder.y,
    targetX: tgtBorder.x,
    targetY: tgtBorder.y,
  });

  const displayLabel = label ?? data?.label;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={style}
        markerEnd={markerEnd}
        markerStart={markerStart}
      />
      {displayLabel && (
        <EdgeLabelRenderer>
          <div
            className="edge-label nodrag nopan"
            style={{ transform: `translate(-50%,-50%) translate(${labelX}px,${labelY}px)` }}
          >
            {displayLabel}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
