import { useCallback, useRef } from 'react';
import type * as THREE from 'three';

const MIN_ZOOM = 0.05;
const MAX_ZOOM = 4;
const ZOOM_SPEED = 0.006;

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}

// Kept for useCanvas viewport persistence compatibility
export interface Transform {
  x: number;
  y: number;
  zoom: number;
}

export function usePanZoom(
  cameraRef: React.RefObject<THREE.OrthographicCamera | null>,
  sizeRef: React.RefObject<{ width: number; height: number }>,
  wrapperRef: React.RefObject<HTMLDivElement | null>
) {
  const isPanning = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const cam = cameraRef.current;
    if (!cam) return;

    if (e.ctrlKey) {
      // Pinch / ctrl+scroll → zoom toward cursor
      const delta = e.deltaY * ZOOM_SPEED * -1;
      const newZoom = clamp(cam.zoom + delta * cam.zoom, MIN_ZOOM, MAX_ZOOM);
      const { width, height } = sizeRef.current;
      const rect = wrapperRef.current?.getBoundingClientRect() ??
        { left: 0, top: 0, width, height };
      // Normalized cursor offset from viewport center (-0.5 to 0.5)
      const mx = (e.clientX - rect.left) / width - 0.5;
      const my = (e.clientY - rect.top) / height - 0.5;
      // World position under cursor before zoom (y inverted in Three.js)
      const worldX = cam.position.x + mx * (width / cam.zoom);
      const worldY = cam.position.y - my * (height / cam.zoom);
      // Adjust camera so that world point stays under cursor after zoom
      cam.position.x = worldX - mx * (width / newZoom);
      cam.position.y = worldY + my * (height / newZoom);
      cam.zoom = newZoom;
      cam.updateProjectionMatrix();
    } else {
      // Two-finger scroll / plain scroll → pan
      cam.position.x += e.deltaX / cam.zoom;
      cam.position.y -= e.deltaY / cam.zoom;
    }
  }, [cameraRef, sizeRef, wrapperRef]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    isPanning.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning.current) return;
    const cam = cameraRef.current;
    if (!cam) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    cam.position.x -= dx / cam.zoom;
    cam.position.y += dy / cam.zoom;
  }, [cameraRef]);

  const onMouseUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  return { handleWheel, onMouseDown, onMouseMove, onMouseUp };
}
