import './FloatingToolbar.css';
import { Icon } from '../../atoms/Icon/Icon';
import { Tooltip } from '../../molecules/Tooltip/Tooltip';
import type { icons } from 'lucide-react';

export interface ToolbarItem {
  key: string;
  icon: keyof typeof icons;
  label: string;
  active?: boolean;
  disabled?: boolean;
  separator?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

interface FloatingToolbarProps {
  items: ToolbarItem[];
  className?: string;
  style?: React.CSSProperties;
}

export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
  items,
  className = '',
  style,
}) => (
  <div className={['nd-toolbar', className].filter(Boolean).join(' ')} style={style} role="toolbar">
    {items.map(item =>
      item.separator ? (
        <div key={item.key} className="nd-toolbar__separator" aria-hidden="true" />
      ) : (
        <Tooltip key={item.key} content={item.label} placement="top">
          <button
            className={['nd-toolbar__btn', item.active ? 'nd-toolbar__btn--active' : ''].filter(Boolean).join(' ')}
            disabled={item.disabled}
            aria-label={item.label}
            aria-pressed={item.active}
            onClick={item.onClick}
          >
            <Icon name={item.icon} size={16} color="inherit" />
          </button>
        </Tooltip>
      )
    )}
  </div>
);
