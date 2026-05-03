import { ProjectMeta } from '../api/types';
import LibraryCard from './LibraryCard';

interface LibraryViewProps {
  projects: ProjectMeta[];
  openTabIds: string[];
  canAddTab: boolean;
  onOpen: (id: string, name: string) => void;
  onClose: () => void;
}

export default function LibraryView({
  projects,
  openTabIds,
  canAddTab,
  onOpen,
  onClose,
}: LibraryViewProps) {
  const count = projects.length;

  return (
    <div className="library">
      <div className="library__header">
        <div className="library__header-left">
          <h1 className="library__title">library</h1>
          <span className="library__count">
            {count} {count === 1 ? 'exploration' : 'explorations'}
          </span>
        </div>
        <button className="library__back" onClick={onClose}>
          ← back to canvas
        </button>
      </div>

      {count === 0 ? (
        <div className="library__empty">
          <p className="library__empty-heading">no explorations yet</p>
          <p className="library__empty-sub">start typing to explore something</p>
        </div>
      ) : (
        <div className="library__grid">
          {projects.map(project => (
            <LibraryCard
              key={project.id}
              project={project}
              atTabLimit={!canAddTab && !openTabIds.includes(project.id)}
              onOpen={() => onOpen(project.id, project.name)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
