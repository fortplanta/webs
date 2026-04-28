import { useState, useCallback, useRef } from 'react';
import { zoom as zoomTokens } from '../tokens/tokens';

export interface Transform {
  x: number;
  y: number;
  zoom: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function usePanZoom(initial: Transform = { x: 0, y: 0, zoom: zoomTokens.initial }) {
  const [transform, setTransform] = useState<Transform>(initial);
  const isPanning = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey) {
      // Pinch gesture (trackpad) or Ctrl+scroll (mouse) → zoom toward cursor
      setTransform(prev => {
        const delta = e.deltaY * zoomTokens.speed * -1;
        const newZoom = clamp(
          prev.zoom + delta * prev.zoom,
          zoomTokens.min,
          zoomTokens.max
        );
        const ratio = newZoom / prev.zoom;
        return {
          x: e.clientX - ratio * (e.clientX - prev.x),
          y: e.clientY - ratio * (e.clientY - prev.y),
          zoom: newZoom,
        };
      });
    } else {
      // Two-finger scroll (trackpad) or plain scroll (mouse) → pan
      setTransform(prev => ({
        ...prev,
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY,
      }));
    }
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    isPanning.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
  }, []);

  const onMouseUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  return { transform, setTransform, handleWheel, onMouseDown, onMouseMove, onMouseUp };
}
