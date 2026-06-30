import { useState, useRef, useEffect, useMemo } from 'react';
import { Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import type { Connector } from '../api/types';
import { getBezierPoints3D, getMidpoint } from './bezier';
import ConnectionGlow from '../effects/ConnectionGlow';

// ─── Z layers (mirrored from Canvas) ─────────────────────────────────────────
const Z_CONNECTOR = 0;
const Z_LABEL     = 1;

// ─── Connector type → hex color (matches webs-tokens.css) ────────────────────
export const FRAG_COLOR_HEX: Record<string, string> = {
  person:  '#00E87B',
  concept: '#FF6D00',
  thesis:  '#FF3B30',
  source:  '#00D4FF',
  event:   '#FF9F0A',
  era:     '#BF5AF2',
  domain:  '#1a1a1a',
  quote:   '#2563EB',
};

interface Props {
  connector: Connector;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  scope: 'intra' | 'inter';
  sourceColor?: string;
  isGlowing?: boolean;
  glowDim?: boolean;
  onLabelChange: (id: string, label: string) => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
}

export default function ConnectorLine({
  connector, x1, y1, x2, y2, scope, sourceColor,
  isGlowing = false, glowDim = false,
  onLabelChange, onContextMenu,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const points = useMemo(
    () => getBezierPoints3D(x1, y1, x2, y2, scope),
    [x1, y1, x2, y2, scope],
  );

  const { mx, my } = getMidpoint(x1, y1, x2, y2);
  const isStrong = connector.type === 'strong';
  const isInter  = scope === 'inter';
  const color    = sourceColor ?? '#333333';
  const opacity  = isInter ? 0.45 : 0.55;
  const lineWidth = isInter ? 2 : 1.5;

  const startEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditValue(connector.label ?? '');
    setEditing(true);
  };

  const confirm = () => {
    onLabelChange(connector.id, editValue.trim());
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); confirm(); }
    if (e.key === 'Escape') setEditing(false);
  };

  const handleCtx = (e: React.MouseEvent) => {
    e.stopPropagation();
    onContextMenu(e, connector.id);
  };

  return (
    <>
      {/* ── Connector line(s) ── */}
      {isGlowing ? (
        <ConnectionGlow points={points} color={color} dim={glowDim} />
      ) : isStrong ? (
        <>
          {/* Glow layer — additive blending */}
          <Line
            points={points}
            color={color}
            lineWidth={8}
            opacity={0.15}
            transparent
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            position={[0, 0, Z_CONNECTOR]}
          />
          {/* Core line */}
          <Line
            points={points}
            color={color}
            lineWidth={2}
            opacity={1}
            transparent
            position={[0, 0, Z_CONNECTOR]}
          />
        </>
      ) : (
        <Line
          points={points}
          color={color}
          lineWidth={lineWidth}
          opacity={opacity}
          transparent
          position={[0, 0, Z_CONNECTOR]}
        />
      )}

      {/* ── Label + context-menu hit area at bezier midpoint ── */}
      <group position={[mx, -my, Z_LABEL]}>
        <Html
          transform={false}
          occlude={false}
          center
          zIndexRange={[50, 100]}
          style={{ pointerEvents: 'auto', userSelect: 'none' }}
        >
          <div
            className="connector-label-fo"
            onClick={startEdit}
            onContextMenu={handleCtx}
          >
            {editing ? (
              <input
                ref={inputRef}
                className="connector-label-fo__input"
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={confirm}
                onClick={e => e.stopPropagation()}
              />
            ) : connector.label ? (
              <span className="connector-label-fo__pill">{connector.label}</span>
            ) : (
              /* Empty hit target — lets user right-click near midpoint */
              <span
                className="connector-label-fo__empty"
                style={{ display: 'block', width: 20, height: 20 }}
              />
            )}
          </div>
        </Html>
      </group>
    </>
  );
}
