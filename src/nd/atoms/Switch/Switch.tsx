import './Switch.css';

interface SwitchProps {
  label?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  className?: string;
  onChange?: (checked: boolean) => void;
}

export const Switch: React.FC<SwitchProps> = ({
  label,
  checked,
  defaultChecked,
  disabled = false,
  className = '',
  onChange,
}) => (
  <label className={['nd-switch', disabled ? 'nd-switch--disabled' : '', className].filter(Boolean).join(' ')}>
    <input
      type="checkbox"
      role="switch"
      checked={checked}
      defaultChecked={defaultChecked}
      disabled={disabled}
      onChange={e => onChange?.(e.target.checked)}
    />
    <span className="nd-switch__track" />
    {label && <span>{label}</span>}
  </label>
);
