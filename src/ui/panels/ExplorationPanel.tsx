import { useRef, useCallback } from 'react';

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

interface Props {
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

export default function ExplorationPanel({
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
}: Props) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleScratchpad = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onScratchpadChange(text), 1000);
  }, [onScratchpadChange]);

  return (
    <div className="exploration-panel">
      <p className="exploration-panel__wordmark">webs</p>
      <p className="exploration-panel__name">{explorationName || 'untitled'}</p>

      <div className="exploration-panel__section">
        <p className="exploration-panel__label">this exploration</p>
        <div className="exploration-panel__stats">
          <div className="exploration-panel__stat">
            <span className="exploration-panel__stat-key">fragments</span>
            <span className="exploration-panel__stat-value">{fragmentCount}</span>
          </div>
          <div className="exploration-panel__stat">
            <span className="exploration-panel__stat-key">clusters</span>
            <span className="exploration-panel__stat-value">{clusterCount}</span>
          </div>
          <div className="exploration-panel__stat">
            <span className="exploration-panel__stat-key">connections</span>
            <span className="exploration-panel__stat-value">{connectorCount}</span>
          </div>
          <div className="exploration-panel__stat">
            <span className="exploration-panel__stat-key">created</span>
            <span className="exploration-panel__stat-value">{relativeTime(createdAt)}</span>
          </div>
          <div className="exploration-panel__stat">
            <span className="exploration-panel__stat-key">modified</span>
            <span className="exploration-panel__stat-value">{relativeTime(updatedAt)}</span>
          </div>
        </div>
      </div>

      <div className="exploration-panel__section">
        <p className="exploration-panel__label">scratchpad</p>
        <textarea
          className="exploration-panel__scratchpad"
          defaultValue={scratchpad}
          onChange={handleScratchpad}
          placeholder="notes, thoughts, tangents…"
        />
      </div>

      <div className="exploration-panel__section">
        <div className="exploration-panel__actions">
          <button className="exploration-panel__btn exploration-panel__btn--primary" onClick={onNewExploration}>
            new exploration
          </button>
          <button className="exploration-panel__btn exploration-panel__btn--ghost" onClick={onOpenLibrary}>
            open library
          </button>
        </div>
      </div>
    </div>
  );
}
