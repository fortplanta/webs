import { useEffect, useRef } from 'react';
import { usePanZoom } from './usePanZoom';
import CanvasBackground from './CanvasBackground';

export default function Canvas() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { transform, handleWheel, onMouseDown, onMouseMove, onMouseUp } = usePanZoom();

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  return (
    <div
      ref={wrapperRef}
      className="canvas-wrapper"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      <CanvasBackground transform={transform} />
      <div
        className="canvas-content"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.zoom})`,
        }}
      />
    </div>
  );
}
