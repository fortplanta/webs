import { useRef, useLayoutEffect } from 'react';
import { FragmentSlot } from '../../api/types';
import SlotHistory from './SlotHistory';

export default function BodySlot({ slot }: { slot: FragmentSlot }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const maxHeightRef = useRef(0);

  useLayoutEffect(() => {
    if (!slot.history?.length) return;
    const el = containerRef.current;
    if (!el) return;
    const h = el.scrollHeight;
    if (h > maxHeightRef.current) maxHeightRef.current = h;
    el.style.minHeight = maxHeightRef.current + 'px';
  });

  if (!slot.content) return null;
  return (
    <div ref={containerRef} className="fragment-slot fragment-slot--body">
      <p data-text-content="true">{slot.content}</p>
      <SlotHistory slot={slot} slotType="body" />
    </div>
  );
}
