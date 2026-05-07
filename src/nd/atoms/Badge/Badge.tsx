import './Badge.css';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}) => (
  <span className={['nd-badge', `nd-badge--${variant}`, `nd-badge--${size}`, className].filter(Boolean).join(' ')}>
    {children}
  </span>
);
