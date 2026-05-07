import './Button.css';

interface ButtonProps {
  children?: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  type = 'button',
  onClick,
}) => {
  return (
    <button
      type={type}
      className={[
        'nd-btn',
        `nd-btn--${variant}`,
        `nd-btn--${size}`,
        loading ? 'nd-btn--loading' : '',
        className,
      ].filter(Boolean).join(' ')}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading && <span className="nd-btn__spinner" aria-hidden="true" />}
      {children}
    </button>
  );
};
