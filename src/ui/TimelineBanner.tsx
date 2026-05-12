import '../styles/timeline.css';
import { Fragment, FragmentType } from '../api/types';

const TYPE_COLORS: Record<FragmentType, string> = {
  person:    '#00E87B',
  concept:   '#FF6D00',
  thesis:    '#FF3B30',
  source:    '#00D4FF',
  event:     '#FF9F0A',
  era:       '#BF5AF2',
  domain:    '#1a1a1a',
  quote:     '#2563EB',
  spark:     '#FF9F0A',
  'text-note': '#1a1a1a',
};

// Parse era string to a sortable integer year.
// Handles: "1066", "1789–1799", "300 BCE", "1960s", "c. 450"
function parseEraYear(era: string): number {
  const s = era.trim().toLowerCase();
  // BCE / BC — take the first number and negate
  const bce = s.match(/(\d+)\s*b\.?c\.?e?\.?/);
  if (bce) return -parseInt(bce[1], 10);
  // Decade: "1960s" → 1960
  const decade = s.match(/(\d{4})s/);
  if (decade) return parseInt(decade[1], 10);
  // Range: take the start year
  const range = s.match(/(\d{3,4})/);
  if (range) return parseInt(range[1], 10);
  return 0;
}

interface TimelineEvent {
  fragmentId: string;
  era: string;
  year: number;
  title: string;
  type: FragmentType;
}

interface Props {
  fragments: Fragment[];
  onNavigateTo: (fragmentId: string) => void;
}

export default function TimelineBanner({ fragments, onNavigateTo }: Props) {
  const events: TimelineEvent[] = fragments
    .filter(f => f.historicalEra)
    .map(f => ({
      fragmentId: f.id,
      era: f.historicalEra!,
      year: parseEraYear(f.historicalEra!),
      title: f.title,
      type: f.type,
    }))
    .sort((a, b) => a.year - b.year);

  if (events.length === 0) return null;

  return (
    <div className="timeline-banner">
      {events.map(ev => (
        <div
          key={ev.fragmentId}
          className="timeline-event"
          onClick={() => onNavigateTo(ev.fragmentId)}
        >
          <span
            className="timeline-event__dot"
            style={{ background: TYPE_COLORS[ev.type] ?? '#000' }}
          />
          <span className="timeline-event__era">{ev.era}</span>
          <span className="timeline-event__title">{ev.title}</span>
        </div>
      ))}
    </div>
  );
}
