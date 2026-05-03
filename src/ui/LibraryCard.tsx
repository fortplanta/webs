import { ProjectMeta } from '../api/types';

function relativeTime(ms: number): string {
  if (!ms) return '—';
  const seconds = Math.floor((Date.now() - ms) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

interface LibraryCardProps {
  project: ProjectMeta;
  onOpen: () => void;
  atTabLimit: boolean;
}

export default function LibraryCard({ project, onOpen, atTabLimit }: LibraryCardProps) {
  const fragments = project.fragmentCount ?? 0;
  const clusters = project.clusterCount ?? 0;

  return (
    <button className="library-card" onClick={atTabLimit ? undefined : onOpen}>
      <div className="library-card__thumbnail" />
      <p className="library-card__title">{project.name}</p>
      <p className="library-card__meta">created {relativeTime(project.createdAt)}</p>
      <p className="library-card__meta">
        {fragments} {fragments === 1 ? 'fragment' : 'fragments'} · {clusters} {clusters === 1 ? 'cluster' : 'clusters'}
      </p>
      {atTabLimit ? (
        <p className="library-card__limit">close a tab to open this</p>
      ) : (
        <p className="library-card__open">open →</p>
      )}
    </button>
  );
}
