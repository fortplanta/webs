import './Chip.css';

export type Category = 'event' | 'works' | 'policy' | 'concept' | 'people' | 'media' | 'source' | 'misc';

interface ChipProps {
  category?: Category;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  removable?: boolean;
  onRemove?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const Chip: React.FC<ChipProps> = ({
  category,
  children,
  size = 'md',
  removable = false,
  onRemove,
  className = '',
  style,
}) => {
  return (
    <div
      className={[
        'nd-chip',
        category ? `nd-chip--${category}` : '',
        `nd-chip--${size}`,
        removable ? 'nd-chip--removable' : '',
        className,
      ].filter(Boolean).join(' ')}
      style={style}
    >
      <span>{children}</span>
      {removable && (
        <button
          className="nd-chip__remove"
          onClick={onRemove}
          aria-label="remove"
          type="button"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <line x1="1" y1="1" x2="9" y2="9" />
            <line x1="9" y1="1" x2="1" y2="9" />
          </svg>
        </button>
      )}
    </div>
  );
};
