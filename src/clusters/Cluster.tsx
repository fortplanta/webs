import type { Cluster as ClusterType } from '../api/types';
import type { LOD } from '../canvas/useCanvas';

interface Props {
  cluster: ClusterType;
  lod?: LOD;
  onDragStart: (id: string, mouseX: number, mouseY: number, origX: number, origY: number) => void;
}

export default function Cluster({ cluster, lod = 'full', onDragStart }: Props) {
  // Seed clusters are rendered as SeedFragment — skip here
  if (cluster.isSeed) return null;

  const atMacro = lod === 'macro' || lod === 'compact';

  return (
    <div
      className="cluster-spawn"
      onMouseDown={(e) => {
        e.stopPropagation();
        onDragStart(cluster.id, e.clientX, e.clientY, cluster.x, cluster.y);
      }}
    >
      <div className="cluster-spawn__marker" />
      <span
        className="cluster-spawn__name"
        style={{ opacity: atMacro ? 0.5 : undefined }}
        data-always-visible={atMacro || undefined}
      >
        {cluster.label}
      </span>
    </div>
  );
}
