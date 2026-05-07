import { useState } from 'react';
import './Tooltip.css';

interface TooltipProps {
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactElement;
  disabled?: boolean;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  placement = 'top',
  children,
  disabled = false,
}) => {
  const [visible, setVisible] = useState(false);

  if (disabled) return children;

  return (
    <span
      className="nd-tooltip-wrap"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span className={`nd-tooltip nd-tooltip--${placement}`} role="tooltip">
          {content}
        </span>
      )}
    </span>
  );
};
