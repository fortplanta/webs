import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const DOT_SPACING = 24;
const Z_BACKGROUND = -10;

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Draws a regular dot grid in screen space. uOffset tracks canvas origin
// so dots stay stationary as the camera pans — same logic as the old SVG version.
const fragmentShader = `
  uniform vec2 uOffset;
  uniform float uSpacing;
  uniform vec3 uDotColor;
  uniform vec2 uViewportSize;
  varying vec2 vUv;

  void main() {
    // UV (0,0) is bottom-left in Three.js; flip Y to match screen convention
    vec2 screenPos = vec2(vUv.x, 1.0 - vUv.y) * uViewportSize;
    vec2 grid = mod(screenPos - uOffset, uSpacing);
    float dist = length(grid - vec2(uSpacing * 0.5));
    float alpha = 1.0 - smoothstep(0.2, 0.8, dist);
    gl_FragColor = vec4(uDotColor, alpha);
  }
`;

export default function CanvasBackground() {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const { camera, size } = useThree();

  const uniforms = useMemo(() => ({
    uOffset:       { value: new THREE.Vector2(0, 0) },
    uSpacing:      { value: DOT_SPACING },
    uDotColor:     { value: new THREE.Color(0.784, 0.784, 0.784) }, // matches --color-canvas-dot
    uViewportSize: { value: new THREE.Vector2(size.width, size.height) },
  }), []); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame(() => {
    const cam = camera as THREE.OrthographicCamera;
    const mesh = meshRef.current;
    const mat = matRef.current;
    if (!mesh || !mat) return;

    // Keep the plane centered on the camera, scaled to cover the full frustum
    const w = size.width / cam.zoom;
    const h = size.height / cam.zoom;
    mesh.position.set(cam.position.x, cam.position.y, Z_BACKGROUND);
    mesh.scale.set(w, h, 1);

    // Replicate the SVG offset formula so dots appear stationary while panning
    const spacing = DOT_SPACING * cam.zoom;
    const tx = size.width / 2 - cam.position.x * cam.zoom;
    const ty = size.height / 2 + cam.position.y * cam.zoom;
    const ox = ((tx % spacing) + spacing) % spacing;
    const oy = ((ty % spacing) + spacing) % spacing;

    mat.uniforms.uOffset.value.set(ox, oy);
    mat.uniforms.uSpacing.value = spacing;
    mat.uniforms.uViewportSize.value.set(size.width, size.height);
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}
