// JS token constants mirroring src/styles/webs-tokens.css.
// Use these when CSS variables aren't accessible (e.g. canvas drawing, calculations).
// Keep in sync with webs-tokens.css — CSS file is the source of truth.

export const spacing = {
  none: 0,
  xxs:  2,
  xs:   4,
  sm:   8,
  base: 16,
  md:   24,
  lg:   32,
  xl:   48,
  xxl:  64,
} as const;

export const sizes = {
  headerHeight:      32,
  headerPadX:        14,
  tagHeight:         22,
  tagPadX:           8,
  imageHeight:       240,
  imageHeightSmall:  200,
} as const;

export const fontSize = {
  header:      20,
  body:        16,
  tag:         12,
  disclaimer:  11,
  meta:        10,
} as const;

export const fontWeight = {
  regular: 400,
} as const;

export const lineHeight = {
  tight:    1,
  normal:   1.3,
  relaxed:  1.5,
} as const;

export const tracking = {
  tight:   '-0.05em',
  normal:  '-0.01em',
  wide:    '0.05em',
} as const;

export const prominence = {
  full:        1,
  secondary:   0.75,
  tertiary:    0.58,
  quaternary:  0.28,
  disabled:    0.1,
} as const;

export const fragmentColors = {
  person:  { bg: '#00E87B', text: '#0a0a0a' },
  concept: { bg: '#FF6D00', text: '#0a0a0a' },
  thesis:  { bg: '#FF3B30', text: '#ffffff' },
  source:  { bg: '#00D4FF', text: '#0a0a0a' },
  event:   { bg: '#FF9F0A', text: '#0a0a0a' },
  era:     { bg: '#BF5AF2', text: '#ffffff' },
  domain:  { bg: '#1a1a1a', text: 'rgba(255,255,255,0.75)' },
  quote:   { bg: '#2563EB', text: '#ffffff' },
} as const;

export const seedColors = {
  bg:   '#D2F34C',
  text: '#0a0a0a',
} as const;

// Canvas pan-zoom constraints
export const zoom = {
  min:        0.05,
  max:        4,
  initial:    0.7,
  speed:      0.006,
  lodFull:    0.45,
  lodCompact: 0.18,
} as const;

// Cluster positioning
export const cluster = {
  baseRadius: 700,
  jitter:     100,
} as const;
