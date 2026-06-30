// Wraps a fragment card with a glow effect when the fragment has been connected.
// Applies CSS custom properties for the glow color derived from fragment type.
// The glow classes are applied to the inner wrapper (not this component's root) via
// an injected className, so this component just sets up the CSS variables + class.

import type { FragmentType } from '../api/types';
import '../styles/glow.css';

// Maps fragment type to its signal color (matches webs-tokens.css)
const SIGNAL_COLORS: Record<string, string> = {
  person:  '#00E87B',
  concept: '#FF6D00',
  thesis:  '#FF3B30',
  source:  '#00D4FF',
  event:   '#FF9F0A',
  era:     '#BF5AF2',
  domain:  '#aaaaaa',
  quote:   '#2563EB',
  spark:   '#FF6D00',
  'text-note': '#aaaaaa',
};

interface GlowColors {
  primary:   string;
  secondary: string;
  tertiary:  string;
}

export function getGlowColors(type: FragmentType | string): GlowColors {
  const base = SIGNAL_COLORS[type] ?? '#ffffff';
  return {
    primary:   base,
    secondary: base + '99',
    tertiary:  base + '33',
  };
}

interface Props {
  type: FragmentType | string;
  isGlowing: boolean;
  isDim?: boolean;
  children: React.ReactNode;
}

export default function FragmentGlow({ type, isGlowing, isDim = false, children }: Props) {
  if (!isGlowing) return <>{children}</>;

  const colors = getGlowColors(type);
  const className = isDim
    ? 'fragment-glow-active fragment-glow-active--dim'
    : 'fragment-glow-active';

  return (
    <div
      className={className}
      style={{
        '--glow-color-primary':   colors.primary,
        '--glow-color-secondary': colors.secondary,
        '--glow-color-tertiary':  colors.tertiary,
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
