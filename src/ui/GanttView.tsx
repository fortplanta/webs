import { useCallback, useEffect, useRef, useState } from 'react';
import '../styles/gantt.css';
import type { Fragment, FragmentType } from '../api/types';

const TYPE_COLORS: Record<FragmentType, string> = {
  person:      '#00E87B',
  concept:     '#FF6D00',
  thesis:      '#FF3B30',
  source:      '#00D4FF',
  event:       '#FF9F0A',
  era:         '#BF5AF2',
  domain:      '#1a1a1a',
  quote:       '#2563EB',
  spark:       '#FF9F0A',
  'text-note': '#1a1a1a',
};

const TYPE_ORDER: FragmentType[] = ['era', 'event', 'person', 'concept', 'thesis', 'source', 'domain', 'quote'];

const LABEL_WIDTH = 100;
const PAD_RATIO = 0.15;

// ─── Era parsing ───────────────────────────────────────────────

function parseEraRange(era: string): { start: number; end: number } {
  const s = era.trim().toLowerCase();

  // BCE: "300 BCE" → -300
  const bce = s.match(/(\d+)\s*b\.?c\.?e?\.?/);
  if (bce) { const y = -parseInt(bce[1]); return { start: y, end: y }; }

  // Range: "1839–1860" or "1839-1860"
  const range = s.match(/(\d{3,4})\s*[–\-]\s*(\d{3,4})/);
  if (range) return { start: parseInt(range[1]), end: parseInt(range[2]) };

  // Decade: "1960s"
  const decade = s.match(/(\d{4})s/);
  if (decade) { const y = parseInt(decade[1]); return { start: y, end: y + 10 }; }

  // Century: "16th century" → 1500–1600
  const century = s.match(/(\d+)(?:st|nd|rd|th)\s+century/);
  if (century) { const c = parseInt(century[1]); return { start: (c - 1) * 100, end: c * 100 }; }

  // Approximation: "c. 450"
  const approx = s.match(/c\.?\s*(\d+)/);
  if (approx) { const y = parseInt(approx[1]); return { start: y, end: y }; }

  // Single year
  const single = s.match(/(-?\d{3,4})/);
  if (single) { const y = parseInt(single[1]); return { start: y, end: y }; }

  return { start: 0, end: 0 };
}

function formatYear(y: number): string {
  if (y < 0) return `${Math.abs(y)} BCE`;
  return String(y);
}

function generateTicks(minYear: number, maxYear: number, scale: number): number[] {
  const range = maxYear - minYear;
  let interval: number;
  if (scale > 8)       interval = 1;
  else if (scale > 3)  interval = 5;
  else if (scale > 1)  interval = 10;
  else if (scale > 0.3) interval = 50;
  else if (scale > 0.1) interval = 100;
  else                  interval = 500;

  // Limit ticks to ~20 visible at once
  const approxVisible = range / interval * scale;
  if (approxVisible > 25) interval = Math.ceil(range * scale / 25 / interval) * interval;

  const start = Math.ceil(minYear / interval) * interval;
  const ticks: number[] = [];
  for (let y = start; y <= maxYear + interval; y += interval) {
    ticks.push(y);
  }
  return ticks;
}

// ─── Main component ────────────────────────────────────────────

interface GanttItem {
  fragmentId: string;
  title: string;
  type: FragmentType;
  start: number;
  end: number;
  isRange: boolean;
}

interface Props {
  fragments: Fragment[];
  onClose: () => void;
  onNavigateTo: (fragmentId: string) => void;
}

export default function GanttView({ fragments, onClose, onNavigateTo }: Props) {
  const [scale, setScale] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; item: GanttItem } | null>(null);

  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startOffset: number } | null>(null);

  // Build gantt items from fragments with historicalEra
  const items: GanttItem[] = fragments
    .filter(f => f.historicalEra)
    .map(f => {
      const { start, end } = parseEraRange(f.historicalEra!);
      return { fragmentId: f.id, title: f.title, type: f.type, start, end, isRange: end !== start };
    });

  // Compute time bounds with padding
  const years = items.flatMap(i => [i.start, i.end]);
  const rawMin = years.length ? Math.min(...years) : 0;
  const rawMax = years.length ? Math.max(...years) : 100;
  const pad = Math.max((rawMax - rawMin) * PAD_RATIO, 10);
  const minYear = rawMin - pad;
  const maxYear = rawMax + pad;
  const yearSpan = maxYear - minYear;

  // Group items by type
  const rowTypes = TYPE_ORDER.filter(t => items.some(i => i.type === t));

  // Compute pixel position — uses track width minus label width
  const trackWidth = (trackRef.current?.clientWidth ?? 800) - LABEL_WIDTH;

  const yearToX = useCallback((year: number) => {
    return ((year - minYear) / yearSpan) * trackWidth * scale + offsetX;
  }, [minYear, yearSpan, trackWidth, scale, offsetX]);

  // ─── Wheel zoom ────────────────────────────────────────────
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const mouseX = e.clientX - rect.left - LABEL_WIDTH;
      const delta = -e.deltaY * 0.001 * scale;
      const newScale = Math.max(0.05, Math.min(20, scale + delta));
      const ratio = newScale / scale;
      setScale(newScale);
      setOffsetX(mouseX - ratio * (mouseX - offsetX));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [scale, offsetX]);

  // ─── Pan drag ──────────────────────────────────────────────
  const handleMouseDown = (e: React.MouseEvent) => {
    dragRef.current = { startX: e.clientX, startOffset: offsetX };
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      setOffsetX(dragRef.current.startOffset + dx);
    };
    const onMouseUp = () => { dragRef.current = null; };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  const ticks = generateTicks(minYear, maxYear, scale);

  const handleItemClick = (item: GanttItem) => {
    onNavigateTo(item.fragmentId);
    onClose();
  };

  if (items.length === 0) {
    return (
      <div className="gantt-view">
        <button className="gantt-back-btn" onClick={onClose}>← back to canvas</button>
        <div className="gantt-empty">
          <span className="gantt-empty__text">no timeline data yet</span>
          <span className="gantt-empty__text" style={{ fontSize: 'var(--font-size-meta)', opacity: 0.5 }}>
            fragments with historical eras will appear here
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="gantt-view">
      <button className="gantt-back-btn" onClick={onClose}>← back to canvas</button>

      <div className="gantt-header">
        <span className="gantt-header__title">timeline</span>
      </div>

      <div className="gantt-body" ref={trackRef}>
        {/* Time axis */}
        <div className="gantt-axis" onMouseDown={handleMouseDown}>
          {ticks.map(tick => {
            const x = yearToX(tick) + LABEL_WIDTH;
            if (x < LABEL_WIDTH || x > (trackRef.current?.clientWidth ?? 800)) return null;
            return (
              <div key={tick} className="gantt-tick" style={{ left: x }}>
                <span className="gantt-tick__label">{formatYear(tick)}</span>
                <div className="gantt-tick__line" />
              </div>
            );
          })}
        </div>

        {/* Rows */}
        <div className="gantt-rows" onMouseDown={handleMouseDown}>
          {rowTypes.map(type => {
            const rowItems = items.filter(i => i.type === type);
            const color = TYPE_COLORS[type];
            return (
              <div key={type} className="gantt-row">
                <div className="gantt-row__label">{type}</div>
                <div className="gantt-row__track">
                  {rowItems.map(item => {
                    const x = yearToX(item.start);
                    const endX = yearToX(item.end);
                    const width = item.isRange ? Math.max(endX - x, 24) : undefined;
                    return (
                      <div
                        key={item.fragmentId}
                        className={`gantt-item gantt-item--${item.isRange ? 'range' : 'point'}`}
                        style={{
                          left: x,
                          width: width ?? 'auto',
                          background: `${color}cc`,
                        }}
                        onClick={() => handleItemClick(item)}
                        onMouseEnter={e => setTooltip({ x: e.clientX, y: e.clientY, item })}
                        onMouseLeave={() => setTooltip(null)}
                        onMouseMove={e => setTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null)}
                      >
                        <span className="gantt-item__label">{item.title}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="gantt-item__tooltip"
          style={{ left: tooltip.x + 8, top: tooltip.y }}
        >
          <strong>{tooltip.item.title}</strong>
          {' · '}
          {tooltip.item.isRange
            ? `${formatYear(tooltip.item.start)}–${formatYear(tooltip.item.end)}`
            : formatYear(tooltip.item.start)}
        </div>
      )}
    </div>
  );
}
