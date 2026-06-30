import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import '../styles/progress.css';

interface Props {
  points: number;
  screenX: number;
  screenY: number;
  onDone: () => void;
}

export default function ScoreIndicator({ points, screenX, screenY, onDone }: Props) {
  const isLarge = points >= 50;

  useEffect(() => {
    const t = setTimeout(onDone, 2000);
    return () => clearTimeout(t);
  }, [onDone]);

  const content = (
    <div
      className={`score-indicator${isLarge ? ' score-indicator--large' : ''}`}
      style={{
        left: screenX,
        top:  screenY,
        transform: 'translate(-50%, -50%)',
      }}
    >
      +{points}
    </div>
  );

  return createPortal(content, document.body);
}
