import './Icon.css';
import { icons } from 'lucide-react';

interface IconProps {
  name: keyof typeof icons;
  size?: number;
  color?: 'neutral' | 'active' | 'muted' | 'inherit';
  className?: string;
  strokeWidth?: number;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 20,
  color = 'neutral',
  className = '',
  strokeWidth = 1.5,
}) => {
  const LucideIcon = icons[name] as React.ComponentType<{ size?: number; strokeWidth?: number }>;
  if (!LucideIcon) return null;
  return (
    <span
      className={['nd-icon', color !== 'inherit' ? `nd-icon--${color}` : '', className].filter(Boolean).join(' ')}
      style={{ width: size, height: size }}
    >
      <LucideIcon size={size} strokeWidth={strokeWidth} />
    </span>
  );
};
