import './FormField.css';

interface FormFieldProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  hint,
  error,
  required = false,
  children,
  className = '',
}) => {
  const hintText = error ?? hint;

  return (
    <div className={['nd-form-field', error ? 'nd-form-field--error' : '', className].filter(Boolean).join(' ')}>
      {label && (
        <span className="nd-form-field__label">
          {label}{required && ' *'}
        </span>
      )}
      {children}
      {hintText && <span className="nd-form-field__hint">{hintText}</span>}
    </div>
  );
};
