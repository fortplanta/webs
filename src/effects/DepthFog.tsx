// Fog constants and pure utility functions.
// Applied as CSS on Html wrapper divs, updated imperatively in useFrame (FragmentNode).

import * as THREE from 'three';

export const FOG_START = 300; // canvas units from camera — fog begins here
export const FOG_FULL  = 700; // canvas units — maximum fog at this distance

// Camera position in canvas space (y-flipped from Three.js convention).
export function camToCanvas(cam: THREE.OrthographicCamera): { x: number; y: number } {
  return { x: cam.position.x, y: -cam.position.y };
}

// Returns 0 (no fog) → 1 (full fog) based on fragment distance from camera.
export function computeFragmentFog(
  fragmentX: number, fragmentY: number,
  camCanvasX: number, camCanvasY: number,
): number {
  const dist = Math.sqrt(
    (fragmentX - camCanvasX) ** 2 +
    (fragmentY - camCanvasY) ** 2,
  );
  return Math.min(1, Math.max(0, (dist - FOG_START) / (FOG_FULL - FOG_START)));
}

// Returns CSS opacity and filter values for a fragment based on fog amount and discovery state.
export function fogStyle(fogAmount: number, isDiscovered: boolean): { opacity: number; filter: string } {
  if (!isDiscovered) {
    return { opacity: 0.08, filter: 'blur(3px)' };
  }
  const opacity = 1 - fogAmount * 0.75; // 1.0 at clear → 0.25 at full fog
  const blur    = fogAmount * 1.5;       // 0px at clear → 1.5px at full fog
  return {
    opacity,
    filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : 'none',
  };
}
