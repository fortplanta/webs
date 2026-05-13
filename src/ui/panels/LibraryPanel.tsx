import { ProjectMeta } from '../../api/types';

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
  return `${Math.floor(days / 30)}mo ago`;
}

interface Props {
  projects: ProjectMeta[];
  openTabIds: string[];
  canAddTab: boolean;
  onOpen: (id: string, name: string) => void;
  onViewAll: () => void;
}

export default function LibraryPanel({ projects, openTabIds, canAddTab, onOpen, onViewAll }: Props) {
  return (
    <div className="library-panel">
      <div className="library-panel__view-all">
        <button className="library-panel__view-all-link" onClick={onViewAll}>
          view all →
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="library-panel__empty">no explorations yet</div>
      ) : (
        projects.map(p => {
          const isOpen = openTabIds.includes(p.id);
          const disabled = !canAddTab && !isOpen;
          return (
            <button
              key={p.id}
              className="library-panel__item"
              onClick={() => !disabled && onOpen(p.id, p.name)}
              disabled={disabled}
              style={{ width: '100%', textAlign: 'left', cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.4 : 1 }}
            >
              <span className="library-panel__item-name">{p.name || 'untitled'}</span>
              <span className="library-panel__item-meta">
                {p.fragmentCount ?? 0} fragments · {relativeTime(p.updatedAt)}
              </span>
            </button>
          );
        })
      )}
    </div>
  );
}
