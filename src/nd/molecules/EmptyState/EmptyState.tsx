import './EmptyState.css';
import { Icon } from '../../atoms/Icon/Icon';
import type { icons } from 'lucide-react';

interface EmptyStateProps {
  label: string;
  hint?: string;
  icon?: keyof typeof icons;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  label,
  hint,
  icon,
  action,
  className = '',
}) => (
  <div className={['nd-empty', className].filter(Boolean).join(' ')}>
    {icon && <span className="nd-empty__icon"><Icon name={icon} size={32} color="muted" /></span>}
    <span className="nd-empty__label">{label}</span>
    {hint && <span className="nd-empty__hint">{hint}</span>}
    {action}
  </div>
);
