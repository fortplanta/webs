import { useRef, useCallback, useEffect } from 'react';
import ProgressBar from '../ProgressBar';
import type { ProgressState } from '../../api/types';

const MILESTONE_THRESHOLDS = [100, 200, 300];
const MILESTONE_LABELS: Record<number, string> = {
  100: 'First Cluster',
  200: 'Half Web',
  300: 'Full Chemistry',
};

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
  totalClusters: number;
  connectorCount: number;
  depthScore: number;
  userConnectionCount: number;
  maxConnections: number;
  clustersLit: number;
  milestonesReached: number[];
  createdAt: number;
  updatedAt: number;
  scratchpad: string;
  onScratchpadChange: (text: string) => void;
  onOpenLibrary: () => void;
  onNewExploration: () => void;
  progressState?: ProgressState;
}

export default function ExplorationPanel({
  explorationName,
  fragmentCount,
  clusterCount,
  totalClusters,
  depthScore,
  userConnectionCount,
  maxConnections,
  clustersLit,
  milestonesReached,
  createdAt,
  updatedAt,
  scratchpad,
  onScratchpadChange,
  onOpenLibrary,
  onNewExploration,
  progressState,
}: Props) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fillRef = useRef<HTMLDivElement | null>(null);
  const dotRefs = useRef<Record<number, HTMLSpanElement | null>>({});
  const prevMilestonesRef = useRef<number[]>(milestonesReached);

  const handleScratchpad = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onScratchpadChange(text), 1000);
  }, [onScratchpadChange]);

  // Flash progress bar lime-green when score reaches 300.
  const prevScoreRef = useRef(depthScore);
  useEffect(() => {
    const prev = prevScoreRef.current;
    prevScoreRef.current = depthScore;
    if (prev < 300 && depthScore >= 300 && fillRef.current) {
      fillRef.current.animate([
        { background: 'var(--fg-strong)' },
        { background: '#d2f34c' },
        { background: 'var(--fg-strong)' },
      ], { duration: 600, easing: 'ease-in-out' });
    }
  }, [depthScore]);

  // Fire milestone dot animation exactly once when a threshold is newly crossed.
  useEffect(() => {
    const prev = prevMilestonesRef.current;
    const newlyReached = milestonesReached.filter(t => !prev.includes(t));
    for (const threshold of newlyReached) {
      const dot = dotRefs.current[threshold];
      if (dot) {
        dot.animate([
          { transform: 'scale(1)', background: 'rgba(0,0,0,0.15)' },
          { transform: 'scale(1.4)', background: '#0f172a' },
          { transform: 'scale(1)', background: '#0f172a' },
        ], { duration: 400, easing: 'cubic-bezier(0.34,1.56,0.64,1)', fill: 'forwards' });
      }
    }
    prevMilestonesRef.current = milestonesReached;
  }, [milestonesReached]);

  const progressPct = Math.min((depthScore / 300) * 100, 100);

  return (
    <div className="exploration-panel">
      <p className="exploration-panel__wordmark">webs</p>
      <p className="exploration-panel__name">{explorationName || 'untitled'}</p>

      <div className="exploration-panel__section">
        <p className="exploration-panel__label">this exploration</p>

        <div className="exploration-panel__depth-score">
          {depthScore}
        </div>

        <div className="depth-progress-track">
          <div
            ref={fillRef}
            className="depth-progress-fill"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="exploration-panel__stats">
          <div className="exploration-panel__stat">
            <span className="exploration-panel__stat-key">connections</span>
            <span className="exploration-panel__stat-value">{userConnectionCount} / {maxConnections}</span>
          </div>
          <div className="exploration-panel__stat">
            <span className="exploration-panel__stat-key">clusters lit</span>
            <span className="exploration-panel__stat-value">{clustersLit} / {totalClusters}</span>
          </div>
          <div className="exploration-panel__stat">
            <span className="exploration-panel__stat-key">fragments</span>
            <span className="exploration-panel__stat-value">{fragmentCount}</span>
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
        <p className="exploration-panel__label">milestones</p>
        <div className="exploration-panel__milestones">
          {MILESTONE_THRESHOLDS.map(threshold => {
            const reached = milestonesReached.includes(threshold);
            return (
              <div key={threshold} className="exploration-panel__milestone">
                <span
                  ref={el => { dotRefs.current[threshold] = el; }}
                  className={`exploration-panel__milestone-dot${reached ? ' exploration-panel__milestone-dot--reached' : ''}`}
                />
                <span className="exploration-panel__milestone-label">{MILESTONE_LABELS[threshold]}</span>
                <span className="exploration-panel__milestone-pts">{threshold} pts</span>
              </div>
            );
          })}
        </div>
      </div>

      {progressState && (
        <div className="exploration-panel__section">
          <ProgressBar progressState={progressState} />
        </div>
      )}

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
