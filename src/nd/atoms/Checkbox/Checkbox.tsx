import './Checkbox.css';

interface CheckboxProps {
  label?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  className?: string;
  onChange?: (checked: boolean) => void;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  checked,
  defaultChecked,
  indeterminate = false,
  disabled = false,
  className = '',
  onChange,
}) => {
  const ref = (el: HTMLInputElement | null) => {
    if (el) el.indeterminate = indeterminate;
  };

  return (
    <label className={['nd-checkbox', disabled ? 'nd-checkbox--disabled' : '', className].filter(Boolean).join(' ')}>
      <span style={{ position: 'relative', display: 'inline-flex' }}>
        <input
          ref={ref}
          type="checkbox"
          checked={checked}
          defaultChecked={defaultChecked}
          disabled={disabled}
          onChange={e => onChange?.(e.target.checked)}
        />
        <span className="nd-checkbox__box" />
      </span>
      {label && <span>{label}</span>}
    </label>
  );
};
