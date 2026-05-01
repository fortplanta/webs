import { FragmentType } from '../api/types';

interface FragmentHeaderProps {
  type: FragmentType;
  title: string;
  small?: boolean;
}

export default function FragmentHeader({ type, title, small }: FragmentHeaderProps) {
  return (
    <div
      className={`fragment__header${small ? ' fragment__header--sm' : ''}`}
      style={{
        background: `var(--color-fragment-${type}-bg)`,
        color: `var(--color-fragment-${type}-text)`,
      }}
    >
      {title}
    </div>
  );
}
