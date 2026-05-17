// Ghost particle cluster for undiscovered fragments.
// Renders ~20 point sprites at the fragment's canvas position, pulsing softly.
// Resolves (fades out) as the fragment crosses into the explored radius.

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Fragment } from '../api/types';

const FRAG_COLORS: Record<string, string> = {
  person:  '#00E87B',
  concept: '#FF6D00',
  thesis:  '#FF3B30',
  source:  '#00D4FF',
  event:   '#FF9F0A',
  era:     '#BF5AF2',
  domain:  '#555555',
  quote:   '#2563EB',
};

const POINT_COUNT = 20;
const SCATTER_RADIUS = 80; // canvas units

interface Props {
  fragment: Fragment;
  fragmentZ: number;
  // resolving: true when the fragment just crossed into explored radius (triggers fade-out)
  resolving?: boolean;
}

export default function SemanticEcho({ fragment, fragmentZ, resolving = false }: Props) {
  const materialRef   = useRef<THREE.PointsMaterial>(null);
  const geometryRef   = useRef<THREE.BufferGeometry>(null);
  const startTimeRef  = useRef<number | null>(null);
  const resolveStart  = useRef<number | null>(null);

  // Unique random phase per fragment so echoes pulse out-of-sync
  const pulsePeriod = useMemo(() => 2800 + Math.random() * 800, []);
  const color       = FRAG_COLORS[fragment.type] ?? '#ffffff';

  // Point positions: scattered around the fragment in canvas space.
  // Three.js y is negated (y-up convention).
  const positions = useMemo(() => {
    const arr = new Float32Array(POINT_COUNT * 3);
    for (let i = 0; i < POINT_COUNT; i++) {
      arr[i * 3]     = fragment.x + (Math.random() - 0.5) * SCATTER_RADIUS * 2;
      arr[i * 3 + 1] = -fragment.y + (Math.random() - 0.5) * SCATTER_RADIUS * 2;
      arr[i * 3 + 2] = fragmentZ - 1; // just below the fragment card
    }
    return arr;
  }, [fragment.id, fragment.x, fragment.y, fragmentZ]); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame(({ clock }) => {
    if (!materialRef.current) return;

    const t = clock.getElapsedTime() * 1000;
    if (startTimeRef.current === null) startTimeRef.current = t;

    if (resolving) {
      if (resolveStart.current === null) resolveStart.current = t;
      const elapsed = t - resolveStart.current;
      const progress = Math.min(1, elapsed / 800);
      materialRef.current.opacity = 0.08 * (1 - progress);
      return;
    }

    // Slow sine pulse between 0.04 and 0.12 opacity
    const phase = ((t - startTimeRef.current) % pulsePeriod) / pulsePeriod;
    const opacity = 0.04 + 0.08 * (0.5 + 0.5 * Math.sin(phase * Math.PI * 2));
    materialRef.current.opacity = opacity;
  });

  return (
    <points>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={POINT_COUNT}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        color={color}
        size={3}
        transparent
        opacity={0.08}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation={false}
      />
    </points>
  );
}
