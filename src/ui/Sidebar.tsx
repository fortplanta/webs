import '../styles/sidebar.css';

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

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  explorationName: string;
  fragmentCount: number;
  clusterCount: number;
  connectorCount: number;
  createdAt: number;
  updatedAt: number;
  onOpenLibrary: () => void;
  onNewExploration: () => void;
}

export default function Sidebar({
  isOpen,
  onToggle,
  explorationName,
  fragmentCount,
  clusterCount,
  connectorCount,
  createdAt,
  updatedAt,
  onOpenLibrary,
  onNewExploration,
}: SidebarProps) {
  return (
    <div className={`sidebar${isOpen ? '' : ' sidebar--collapsed'}`}>
      <button
        className="sidebar__toggle"
        onClick={onToggle}
        title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        {isOpen ? '‹' : '›'}
      </button>

      <div className="sidebar__inner">
        {/* Section 1: Identity */}
        <div className="sidebar__section sidebar__section--identity">
          <p className="sidebar__wordmark">webs</p>
          <p className="sidebar__exploration-name">
            {explorationName || 'untitled'}
          </p>
          <button className="sidebar__button sidebar__button--secondary" onClick={onOpenLibrary}>
            open library
          </button>
        </div>

        {/* Section 2: Stats */}
        <div className="sidebar__section">
          <p className="sidebar__label">this exploration</p>
          <div className="sidebar__stats">
            <div className="sidebar__stat">
              <span className="sidebar__stat-key">fragments</span>
              <span className="sidebar__stat-value">{fragmentCount}</span>
            </div>
            <div className="sidebar__stat">
              <span className="sidebar__stat-key">clusters</span>
              <span className="sidebar__stat-value">{clusterCount}</span>
            </div>
            <div className="sidebar__stat">
              <span className="sidebar__stat-key">connections</span>
              <span className="sidebar__stat-value">{connectorCount}</span>
            </div>
            <div className="sidebar__stat">
              <span className="sidebar__stat-key">created</span>
              <span className="sidebar__stat-value">{relativeTime(createdAt)}</span>
            </div>
            <div className="sidebar__stat">
              <span className="sidebar__stat-key">modified</span>
              <span className="sidebar__stat-value">{relativeTime(updatedAt)}</span>
            </div>
          </div>
        </div>

        {/* Section 3: Actions */}
        <div className="sidebar__section sidebar__section--actions">
          <button className="sidebar__button" onClick={onNewExploration}>
            new exploration
          </button>
          <button
            className="sidebar__button sidebar__button--secondary"
            disabled
            title="coming soon"
          >
            export
          </button>
        </div>
      </div>
    </div>
  );
}
