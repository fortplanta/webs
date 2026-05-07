import { useState } from 'react';
import './PropertyInspector.css';
import { Icon } from '../../atoms/Icon/Icon';

export interface InspectorRow {
  key: string;
  label: string;
  value: React.ReactNode;
}

export interface InspectorSection {
  key: string;
  label: string;
  rows: InspectorRow[];
  defaultOpen?: boolean;
}

interface PropertyInspectorProps {
  sections: InspectorSection[];
  className?: string;
}

function Section({ section }: { section: InspectorSection }) {
  const [open, setOpen] = useState(section.defaultOpen ?? true);

  return (
    <div className="nd-inspector__section">
      <div className="nd-inspector__section-header" onClick={() => setOpen(o => !o)}>
        <span className="nd-inspector__section-label">{section.label}</span>
        <Icon name={open ? 'ChevronUp' : 'ChevronDown'} size={12} color="muted" />
      </div>
      {open && section.rows.map(row => (
        <div key={row.key} className="nd-inspector__row">
          <span className="nd-inspector__row-label">{row.label}</span>
          <span className="nd-inspector__row-value">{row.value}</span>
        </div>
      ))}
    </div>
  );
}

export const PropertyInspector: React.FC<PropertyInspectorProps> = ({
  sections,
  className = '',
}) => (
  <aside className={['nd-inspector', className].filter(Boolean).join(' ')}>
    {sections.map(s => <Section key={s.key} section={s} />)}
  </aside>
);
