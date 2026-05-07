import { useState } from 'react';
import './Sidebar.css';
import { Icon } from '../../atoms/Icon/Icon';
import type { icons } from 'lucide-react';

export interface SidebarSection {
  key: string;
  label?: string;
  items: SidebarItem[];
}

export interface SidebarItem {
  key: string;
  label: string;
  icon?: keyof typeof icons;
  active?: boolean;
  onClick?: () => void;
}

interface SidebarProps {
  wordmark?: string;
  sections: SidebarSection[];
  defaultCollapsed?: boolean;
  footer?: React.ReactNode;
}

export const Sidebar: React.FC<SidebarProps> = ({
  wordmark = 'neurodive',
  sections,
  defaultCollapsed = false,
  footer,
}) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <aside className={['nd-sidebar', collapsed ? 'nd-sidebar--collapsed' : ''].filter(Boolean).join(' ')}>
      <div className="nd-sidebar__header">
        <span className="nd-sidebar__wordmark">{wordmark}</span>
        <button
          className="nd-sidebar__toggle"
          onClick={() => setCollapsed(c => !c)}
          aria-label={collapsed ? 'expand sidebar' : 'collapse sidebar'}
        >
          <Icon name={collapsed ? 'ChevronRight' : 'ChevronLeft'} size={16} color="inherit" />
        </button>
      </div>

      <nav className="nd-sidebar__nav">
        {sections.map(section => (
          <div key={section.key} className="nd-sidebar__section">
            {section.label && (
              <div className="nd-sidebar__section-label">{section.label}</div>
            )}
            {section.items.map(item => (
              <button
                key={item.key}
                className={['nd-sidebar__item', item.active ? 'nd-sidebar__item--active' : ''].filter(Boolean).join(' ')}
                onClick={item.onClick}
              >
                {item.icon && (
                  <span className="nd-sidebar__item-icon">
                    <Icon name={item.icon} size={16} color="inherit" />
                  </span>
                )}
                <span className="nd-sidebar__item-label">{item.label}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>

      {footer && <div style={{ padding: 'var(--s-3)', borderTop: 'var(--stroke)', flexShrink: 0 }}>{footer}</div>}
    </aside>
  );
};
