import './Radio.css';

interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface RadioGroupProps {
  options: RadioOption[];
  value?: string;
  name: string;
  orientation?: 'vertical' | 'horizontal';
  disabled?: boolean;
  className?: string;
  onChange?: (value: string) => void;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  options,
  value,
  name,
  orientation = 'vertical',
  disabled = false,
  className = '',
  onChange,
}) => (
  <div
    className={['nd-radio-group', orientation === 'horizontal' ? 'nd-radio-group--horizontal' : '', className].filter(Boolean).join(' ')}
    role="radiogroup"
  >
    {options.map(opt => (
      <label
        key={opt.value}
        className={['nd-radio', (disabled || opt.disabled) ? 'nd-radio--disabled' : ''].filter(Boolean).join(' ')}
      >
        <span style={{ position: 'relative', display: 'inline-flex' }}>
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value !== undefined ? value === opt.value : undefined}
            disabled={disabled || opt.disabled}
            onChange={() => onChange?.(opt.value)}
          />
          <span className="nd-radio__dot" />
        </span>
        <span>{opt.label}</span>
      </label>
    ))}
  </div>
);
