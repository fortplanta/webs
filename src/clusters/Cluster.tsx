import type { Cluster as ClusterType } from '../api/types';

interface Props {
  cluster: ClusterType;
  onDragStart: (id: string, mouseX: number, mouseY: number, origX: number, origY: number) => void;
}

export default function Cluster({ cluster, onDragStart }: Props) {
  return (
    <div
      className={`cluster-spawn${cluster.isSeed ? ' cluster-spawn--seed' : ''}`}
      style={{ left: cluster.x, top: cluster.y }}
      onMouseDown={(e) => {
        e.stopPropagation();
        onDragStart(cluster.id, e.clientX, e.clientY, cluster.x, cluster.y);
      }}
    >
      <span className="cluster-spawn__label">{cluster.label}</span>
    </div>
  );
}
