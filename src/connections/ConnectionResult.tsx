import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { ConnectionTier } from '../api/types';
import '../styles/connections.css';

const TIER_LABEL: Record<ConnectionTier, string> = {
  'obvious':            'obvious connection',
  'non-obvious-user':   'non-obvious connection',
  'non-obvious-claude': 'claude-found connection',
};

interface Props {
  tier: ConnectionTier;
  points: number;
  explanation: string;
  context?: string;
  screenX: number;
  screenY: number;
  onDismiss: () => void;
}

export default function ConnectionResult({
  tier,
  points,
  explanation,
  context,
  screenX,
  screenY,
  onDismiss,
}: Props) {
  // Auto-close after 6s
  useEffect(() => {
    const t = setTimeout(onDismiss, 6000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onDismiss(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onDismiss]);

  const panelWidth  = 320;
  const panelHeight = 200;
  const left = Math.min(Math.max(screenX - panelWidth / 2, 12), window.innerWidth  - panelWidth  - 12);
  const top  = Math.min(Math.max(screenY - panelHeight / 2, 12), window.innerHeight - panelHeight - 12);

  const content = (
    <div
      className="connection-result"
      style={{ left, top }}
      onClick={onDismiss}
      onMouseDown={e => e.stopPropagation()}
    >
      <div className="connection-result__tier">
        <span className="connection-result__tier-star">✦</span>
        {TIER_LABEL[tier]}
      </div>
      <div className="connection-result__explanation">{explanation}</div>
      {context && (
        <div className="connection-result__context">{context}</div>
      )}
      <div className="connection-result__points">+{points}</div>
    </div>
  );

  return createPortal(content, document.body);
}
