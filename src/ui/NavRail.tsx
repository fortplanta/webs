import '../styles/nav-rail.css';

export type NavPanel = 'exploration' | 'prompts' | 'library';

interface Props {
  activePanel: NavPanel | null;
  onToggle: (panel: NavPanel) => void;
  ganttOpen?: boolean;
  onGanttToggle?: () => void;
}

export default function NavRail({ activePanel, onToggle, ganttOpen, onGanttToggle }: Props) {
  return (
    <div className="nav-rail">
      <button
        className={`nav-rail__item${activePanel === 'exploration' ? ' nav-rail__item--active' : ''}`}
        onClick={() => onToggle('exploration')}
        title="Exploration"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M9 5.5L10.8 8.2L14 9L10.8 9.8L9 12.5L7.2 9.8L4 9L7.2 8.2L9 5.5Z" fill="currentColor" />
        </svg>
      </button>

      <button
        className={`nav-rail__item${activePanel === 'prompts' ? ' nav-rail__item--active' : ''}`}
        onClick={() => onToggle('prompts')}
        title="Prompts (⌘P)"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M9 2L10.5 6.5L15 6.5L11.5 9.5L13 14L9 11.5L5 14L6.5 9.5L3 6.5L7.5 6.5L9 2Z" fill="currentColor" />
        </svg>
      </button>

      <button
        className={`nav-rail__item${activePanel === 'library' ? ' nav-rail__item--active' : ''}`}
        onClick={() => onToggle('library')}
        title="Library (⌘L)"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M9 5v4l2.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {onGanttToggle && (
        <button
          className={`nav-rail__item${ganttOpen ? ' nav-rail__item--active' : ''}`}
          onClick={onGanttToggle}
          title="Timeline"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <line x1="2" y1="5" x2="16" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <rect x="2" y="7.5" width="8" height="2" rx="1" fill="currentColor" />
            <rect x="6" y="11" width="10" height="2" rx="1" fill="currentColor" />
          </svg>
        </button>
      )}
    </div>
  );
}
