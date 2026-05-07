import './ViewModeSwitcher.css';
import { Icon } from '../../atoms/Icon/Icon';
import type { icons } from 'lucide-react';

export interface ViewMode {
  key: string;
  label: string;
  icon?: keyof typeof icons;
}

interface ViewModeSwitcherProps {
  modes: ViewMode[];
  activeKey: string;
  onChange: (key: string) => void;
  className?: string;
}

export const ViewModeSwitcher: React.FC<ViewModeSwitcherProps> = ({
  modes,
  activeKey,
  onChange,
  className = '',
}) => (
  <div className={['nd-view-switcher', className].filter(Boolean).join(' ')} role="group">
    {modes.map(mode => (
      <button
        key={mode.key}
        className={['nd-view-switcher__btn', mode.key === activeKey ? 'nd-view-switcher__btn--active' : ''].filter(Boolean).join(' ')}
        aria-pressed={mode.key === activeKey}
        onClick={() => onChange(mode.key)}
      >
        {mode.icon && <Icon name={mode.icon} size={13} color="inherit" />}
        {mode.label}
      </button>
    ))}
  </div>
);
