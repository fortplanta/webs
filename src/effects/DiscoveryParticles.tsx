// Ambient particle field: 200 tiny drifting points across the canvas.
// Gives the background depth and life in explored areas.

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const COUNT  = 200;
const BOUND  = 2000; // half-width of the canvas field in canvas units
const SPEED  = 0.2;  // canvas units per second
const Z_PARTICLES = -8; // just above background, below connectors

export default function DiscoveryParticles() {
  const geometryRef  = useRef<THREE.BufferGeometry>(null);
  const performanceMode = useRef(false);

  const { positions, velocities } = useMemo(() => {
    const positions  = new Float32Array(COUNT * 3);
    const velocities = new Float32Array(COUNT * 2); // vx, vy only
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * BOUND * 2;
      positions[i * 3 + 1] = (Math.random() - 0.5) * BOUND * 2;
      positions[i * 3 + 2] = Z_PARTICLES;
      const angle          = Math.random() * Math.PI * 2;
      const speed          = SPEED * (0.5 + Math.random() * 0.5);
      velocities[i * 2]    = Math.cos(angle) * speed;
      velocities[i * 2 + 1] = Math.sin(angle) * speed;
    }
    return { positions, velocities };
  }, []);

  useFrame((_, delta) => {
    if (performanceMode.current) return;
    const geo = geometryRef.current;
    if (!geo) return;

    const arr = geo.attributes.position.array as Float32Array;
    const dt  = Math.min(delta, 0.05);
    for (let i = 0; i < COUNT; i++) {
      arr[i * 3]     += velocities[i * 2]     * dt * 60;
      arr[i * 3 + 1] += velocities[i * 2 + 1] * dt * 60;
      // Wrap at boundary
      if (arr[i * 3]     >  BOUND) arr[i * 3]     = -BOUND;
      if (arr[i * 3]     < -BOUND) arr[i * 3]     =  BOUND;
      if (arr[i * 3 + 1] >  BOUND) arr[i * 3 + 1] = -BOUND;
      if (arr[i * 3 + 1] < -BOUND) arr[i * 3 + 1] =  BOUND;
    }
    geo.attributes.position.needsUpdate = true;
  });

  return (
    <points>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={COUNT}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#ffffff"
        size={1.5}
        transparent
        opacity={0.08}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation={false}
      />
    </points>
  );
}
