import './Card.css';
import { Chip } from '../../atoms/Chip/Chip';
import type { Category } from '../../atoms/Chip/Chip';

interface CardProps {
  children?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  variant?: 'default' | 'bordered' | 'flat';
  className?: string;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({
  children,
  header,
  footer,
  variant = 'default',
  className = '',
  style,
}) => (
  <div
    className={['nd-card', variant !== 'default' ? `nd-card--${variant}` : '', className].filter(Boolean).join(' ')}
    style={style}
  >
    {header && <div className="nd-card__header">{header}</div>}
    <div className="nd-card__body">{children}</div>
    {footer && <div className="nd-card__footer">{footer}</div>}
  </div>
);

/* Fragment card — the stacked chip+body pattern from the design system */
interface FragmentCardProps {
  category: Category;
  label: string;
  children: React.ReactNode;
  className?: string;
}

export const FragmentCard: React.FC<FragmentCardProps> = ({
  category,
  label,
  children,
  className = '',
}) => (
  <div className={['nd-fragment', className].filter(Boolean).join(' ')}>
    <Chip category={category} className="nd-fragment__chip">{label}</Chip>
    <div className="nd-fragment__body">{children}</div>
  </div>
);
