// R3F component — renders a glowing connector line (triple-layer additive blend).
// Used inside Connector.tsx when connector.isGlowing is true.
// Animates the middle glow layer opacity via useFrame.

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';

interface Props {
  points: [number, number, number][];
  color: string;
  dim?: boolean;
}

export default function ConnectionGlow({ points, color, dim = false }: Props) {
  const midRef = useRef<{ material?: { opacity: number } }>({});
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    const t = (Math.sin(timeRef.current * (Math.PI * 2) / 2.5) + 1) / 2; // 0-1 at 2.5s cycle
    const opacity = dim
      ? 0.08 + t * 0.12  // 0.08 → 0.20
      : 0.15 + t * 0.20; // 0.15 → 0.35
    if (midRef.current.material) {
      midRef.current.material.opacity = opacity;
    }
  });

  const outerOpacity = dim ? 0.05 : 0.08;
  const coreOpacity  = dim ? 0.6  : 1.0;

  return (
    <>
      {/* Outer glow */}
      <Line
        points={points}
        color={color}
        lineWidth={12}
        opacity={outerOpacity}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        position={[0, 0, 0]}
      />
      {/* Mid glow — opacity animated via useFrame */}
      <Line
        ref={midRef as React.RefObject<never>}
        points={points}
        color={color}
        lineWidth={5}
        opacity={0.20}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        position={[0, 0, 0]}
      />
      {/* Core */}
      <Line
        points={points}
        color={color}
        lineWidth={1.5}
        opacity={coreOpacity}
        transparent
        position={[0, 0, 0]}
      />
    </>
  );
}
