import type { ProgressState } from '../api/types';
import '../styles/progress.css';

interface Props {
  progressState: ProgressState;
}

export default function ProgressBar({ progressState }: Props) {
  const { current, threshold } = progressState;
  const pct = Math.min(100, (current / threshold) * 100);
  const nearFull = pct >= 75;

  return (
    <div className="progress-bar-section">
      <div className="progress-bar-label">
        <span>exploration depth</span>
        <span>{current} / {threshold}</span>
      </div>
      <div className="progress-bar-track">
        <div
          className={`progress-bar-fill${nearFull ? ' progress-bar-fill--near-full' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
