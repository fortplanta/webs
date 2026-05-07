import './Input.css';

interface InputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
  type?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  defaultValue,
  size = 'md',
  disabled = false,
  error,
  hint,
  leftIcon,
  rightIcon,
  className = '',
  type = 'text',
  onChange,
  onKeyDown,
}) => {
  const hintText = error ?? hint;

  return (
    <div className={['nd-input-wrap', error ? 'nd-input-wrap--error' : '', className].filter(Boolean).join(' ')}>
      {label && <label>{label}</label>}
      <div className="nd-input-field">
        {leftIcon && <span className="nd-input-icon nd-input-icon--left">{leftIcon}</span>}
        <input
          type={type}
          className={[
            'nd-input',
            `nd-input--${size}`,
            leftIcon ? 'nd-input--has-left' : '',
            rightIcon ? 'nd-input--has-right' : '',
          ].filter(Boolean).join(' ')}
          placeholder={placeholder}
          value={value}
          defaultValue={defaultValue}
          disabled={disabled}
          onChange={onChange}
          onKeyDown={onKeyDown}
        />
        {rightIcon && <span className="nd-input-icon nd-input-icon--right">{rightIcon}</span>}
      </div>
      {hintText && <p className="nd-input-hint">{hintText}</p>}
    </div>
  );
};
