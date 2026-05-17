// Diffuse color light bleed for undiscovered / peripheral fragments.
// A large, low-opacity additive circle rendered behind the fragment.
// Pulses slowly and amplifies when camera moves toward it.

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

const BLEED_RADIUS = 120; // canvas units — radius of the bleed circle

interface Props {
  fragment: Fragment;
  fragmentZ: number;
  // intensity: 0–1 multiplier (amplified when camera approaches)
  intensity?: number;
}

export default function ColorBleed({ fragment, fragmentZ, intensity = 1 }: Props) {
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const meshRef     = useRef<THREE.Mesh>(null);

  // Unique random pulse period and phase offset per fragment
  const pulsePeriod = useMemo(() => (3000 + Math.random() * 1500) / 1000, []);
  const phaseOffset = useMemo(() => Math.random() * Math.PI * 2, []);
  const color       = FRAG_COLORS[fragment.type] ?? '#ffffff';

  const prevCamX = useRef(0);
  const prevCamY = useRef(0);

  useFrame(({ clock, camera }) => {
    if (!materialRef.current || !meshRef.current) return;

    const t     = clock.getElapsedTime();
    const phase = (t % pulsePeriod) / pulsePeriod;
    const pulse = 0.5 + 0.5 * Math.sin(phase * Math.PI * 2 + phaseOffset);

    // Approach amplification: dot product of camera velocity with direction to fragment
    const camX  = camera.position.x;
    const camY  = -camera.position.y; // canvas space
    const velX  = camX - prevCamX.current;
    const velY  = camY - prevCamY.current;
    prevCamX.current = camX;
    prevCamY.current = camY;

    const toFragX = fragment.x - camX;
    const toFragY = fragment.y - camY;
    const toFragLen = Math.sqrt(toFragX * toFragX + toFragY * toFragY);
    let approachFactor = 1;
    if (toFragLen > 0.001) {
      const dot = (velX * toFragX + velY * toFragY) / toFragLen;
      if (dot > 0) approachFactor = 1.5;
    }

    const baseOpacity = 0.06 + 0.06 * pulse;
    materialRef.current.opacity = Math.min(0.25, baseOpacity * intensity * approachFactor);

    // Scale pulse: 0.9–1.1× radius
    const scale = 0.9 + 0.2 * pulse;
    meshRef.current.scale.set(scale, scale, 1);
  });

  return (
    <mesh
      ref={meshRef}
      position={[fragment.x, -fragment.y, fragmentZ - 2]}
    >
      <circleGeometry args={[BLEED_RADIUS, 32]} />
      <meshBasicMaterial
        ref={materialRef}
        color={color}
        transparent
        opacity={0.06}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
