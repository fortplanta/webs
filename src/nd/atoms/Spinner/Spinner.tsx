import './Spinner.css';

interface SpinnerProps {
  variant?: 'ring' | 'strip';
  size?: 'sm' | 'md' | 'lg';
  width?: number;
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  variant = 'ring',
  size = 'md',
  width = 200,
  className = '',
}) => {
  if (variant === 'strip') {
    return (
      <div
        className={['nd-spinner nd-spinner--strip', className].filter(Boolean).join(' ')}
        style={width ? { width } : { width: '100%' }}
        role="status"
        aria-label="loading"
      >
        <div className="nd-spinner__head" />
        <div className="nd-spinner__tip" />
      </div>
    );
  }

  return (
    <span
      className={['nd-spinner nd-spinner--ring', `nd-spinner--${size}`, className].filter(Boolean).join(' ')}
      role="status"
      aria-label="loading"
    >
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="10" cy="10" r="7" strokeOpacity="0.2" />
        <path d="M10 3 a7 7 0 0 1 7 7" />
      </svg>
    </span>
  );
};
