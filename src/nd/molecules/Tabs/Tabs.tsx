import { useState } from 'react';
import './Tabs.css';

export interface TabItem {
  key: string;
  label: string;
  content: React.ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  items: TabItem[];
  defaultKey?: string;
  activeKey?: string;
  onChange?: (key: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  items,
  defaultKey,
  activeKey: controlledKey,
  onChange,
  className = '',
}) => {
  const [internalKey, setInternalKey] = useState(defaultKey ?? items[0]?.key);
  const active = controlledKey ?? internalKey;
  const activeItem = items.find(t => t.key === active);

  const handleSelect = (key: string) => {
    setInternalKey(key);
    onChange?.(key);
  };

  return (
    <div className={['nd-tabs', className].filter(Boolean).join(' ')}>
      <div className="nd-tabs__strip" role="tablist">
        {items.map(tab => (
          <button
            key={tab.key}
            className={['nd-tabs__tab', tab.key === active ? 'nd-tabs__tab--active' : ''].filter(Boolean).join(' ')}
            role="tab"
            aria-selected={tab.key === active}
            disabled={tab.disabled}
            onClick={() => handleSelect(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="nd-tabs__panel" role="tabpanel">
        {activeItem?.content}
      </div>
    </div>
  );
};
