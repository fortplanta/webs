import './Divider.css';

interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export const Divider: React.FC<DividerProps> = ({
  orientation = 'horizontal',
  className = '',
}) => (
  <hr
    className={['nd-divider', `nd-divider--${orientation}`, className].filter(Boolean).join(' ')}
    role="separator"
    aria-orientation={orientation}
  />
);
