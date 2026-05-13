import { useEffect, useState } from 'react';
import '../styles/skeleton.css';
import { Spinner } from '../nd/atoms/Spinner/Spinner';
import { Button } from '../nd/atoms/Button/Button';
import SkeletonFragment from '../fragments/SkeletonFragment';

const LOADING_MESSAGES = [
  "mapping the territory...",
  "finding the connections...",
  "surfacing what matters...",
  "building your exploration...",
  "almost there...",
];

// Approximate positions for 5 skeleton fragments scattered around the center
const SKELETON_POSITIONS = [
  { x: 0,    y: 0    },
  { x: 500,  y: -180 },
  { x: -500, y: -200 },
  { x: 520,  y: 220  },
  { x: -480, y: 250  },
];

interface LoadingCanvasProps {
  query: string;
  error?: string | null;
  onRetry?: () => void;
}

export default function LoadingCanvas({ query, error, onRetry }: LoadingCanvasProps) {
  const [messageIdx, setMessageIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (error) return;
    const msgTimer = setInterval(() => {
      setMessageIdx(i => (i + 1) % LOADING_MESSAGES.length);
    }, 2500);
    return () => clearInterval(msgTimer);
  }, [error]);

  useEffect(() => {
    if (error) return;
    const start = Date.now();
    const tick = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(tick);
  }, [error]);

  if (error) {
    return (
      <div className="loading-canvas">
        <span className="loading-canvas__query">{query.toLowerCase()}</span>
        <div className="loading-canvas__error">
          <span>{error}</span>
          {onRetry && (
            <Button variant="secondary" size="sm" onClick={onRetry}>
              try again
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="loading-skeleton-canvas">
      {/* Skeleton fragments scattered on canvas */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 0,
        height: 0,
      }}>
        {SKELETON_POSITIONS.map((pos, i) => (
          <SkeletonFragment key={i} x={pos.x} y={pos.y} />
        ))}
      </div>

      {/* Helper text + timer overlay */}
      <div className="loading-helper">
        <span className="loading-helper__message">{LOADING_MESSAGES[messageIdx]}</span>
        <span className="loading-helper__timer">{elapsed}s</span>
        <Spinner variant="strip" width={200} />
      </div>
    </div>
  );
}
