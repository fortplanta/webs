import '../styles/toolbar.css';
import type { ActiveTool } from '../canvas/useTools';

interface Props {
  activeTool: ActiveTool;
  onSelect: (tool: ActiveTool) => void;
  onNewExploration?: () => void;
}

export default function Toolbar({ activeTool, onSelect, onNewExploration }: Props) {
  return (
    <div className="toolbar">
      {onNewExploration && (
        <>
          <button
            className="toolbar__btn"
            onClick={onNewExploration}
            title="New exploration (⌘N)"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 4v10M4 9h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span className="toolbar__tooltip">New &nbsp; ⌘N</span>
          </button>
          <div className="toolbar__divider" />
        </>
      )}

      <button
        className={`toolbar__btn${activeTool === 'select' ? ' toolbar__btn--active' : ''}`}
        onClick={() => onSelect('select')}
        title="Select"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path
            d="M3 2L3 13L6.5 10L8.5 15L10 14.4L8 9.5L12 9.5L3 2Z"
            fill="currentColor"
          />
        </svg>
        <span className="toolbar__tooltip">Select &nbsp; V</span>
      </button>

      <button
        className={`toolbar__btn${activeTool === 'text' ? ' toolbar__btn--active' : ''}`}
        onClick={() => onSelect('text')}
        title="Text"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <text
            x="9" y="14"
            textAnchor="middle"
            fontSize="14"
            fontFamily="Georgia, serif"
            fontStyle="italic"
            fill="currentColor"
          >T</text>
        </svg>
        <span className="toolbar__tooltip">Text &nbsp; T</span>
      </button>
    </div>
  );
}
