import type { LOD } from '../canvas/useCanvas';

export default function ClusterLabel({ title, lod }: { title: string; lod: LOD }) {
  return (
    <div className={`cluster-label cluster-label--${lod}`}>
      {title}
    </div>
  );
}
