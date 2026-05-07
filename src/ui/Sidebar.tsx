import '../styles/sidebar.css';
import '../styles/panels.css';
import { useRef, useCallback } from 'react';
import { Button } from '../nd/atoms/Button/Button';

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
  scratchpad: string;
  onScratchpadChange: (text: string) => void;
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
  scratchpad,
  onScratchpadChange,
  onOpenLibrary,
  onNewExploration,
}: SidebarProps) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleScratchpad = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onScratchpadChange(text), 1000);
  }, [onScratchpadChange]);

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
          <Button variant="ghost" size="sm" onClick={onOpenLibrary}>
            open library
          </Button>
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

        {/* Section 3: Scratchpad */}
        <div className="sidebar__section">
          <p className="sidebar__label">scratchpad</p>
          <div className="scratchpad">
            <textarea
              className="scratchpad__textarea"
              defaultValue={scratchpad}
              onChange={handleScratchpad}
              placeholder="notes, thoughts, tangents…"
            />
          </div>
        </div>

        {/* Section 4: Actions */}
        <div className="sidebar__section sidebar__section--actions">
          <Button variant="primary" size="sm" onClick={onNewExploration}>
            new exploration
          </Button>
          <Button variant="ghost" size="sm" disabled title="coming soon">
            export
          </Button>
        </div>
      </div>
    </div>
  );
}
