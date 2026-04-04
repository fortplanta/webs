// ─────────────────────────────────────────────
// WEBS — Constants
// ─────────────────────────────────────────────

// Context categories: the dimensions the AI expands an anchor node across.
// Each has a color (matching tokens.css), an icon, and a weight used in
// connection-strength scoring (higher = rarer / more interesting connection).
export const CONTEXT_CATEGORIES = [
  {
    key: 'technology',
    label: 'Technology',
    icon: '⬡',
    color: 'var(--color-technology)',
    weight: 1.2,
    prompt: 'Technology that paved the way for this, or technology that would later emerge from it.',
  },
  {
    key: 'political',
    label: 'Political Climate',
    icon: '⚑',
    color: 'var(--color-political)',
    weight: 1.3,
    prompt: 'The local and global political environment — who held power, what tensions were active, what was possible or forbidden.',
  },
  {
    key: 'market',
    label: 'Market Dynamics',
    icon: '◫',
    color: 'var(--color-market)',
    weight: 1.1,
    prompt: 'Market forces, economic conditions, competition, and the dominant business logic of the era.',
  },
  {
    key: 'supplyChain',
    label: 'Supply Chain',
    icon: '→',
    color: 'var(--color-supply-chain)',
    weight: 1.0,
    prompt: 'The physical and logistical infrastructure — raw materials, labour, distribution, and dependencies.',
  },
  {
    key: 'people',
    label: 'Influential People',
    icon: '○',
    color: 'var(--color-people)',
    weight: 1.4,
    prompt: 'The key individuals who shaped, enabled, opposed, or were shaped by this — with a brief note on how.',
  },
  {
    key: 'law',
    label: 'Law & Regulation',
    icon: '⊙',
    color: 'var(--color-law)',
    weight: 1.2,
    prompt: 'Relevant national and international law, regulation, or legal battles — what was allowed, blocked, or redefined.',
  },
  {
    key: 'business',
    label: 'Business Models',
    icon: '◇',
    color: 'var(--color-business)',
    weight: 1.1,
    prompt: 'The revenue streams, business models, and economic incentives at play.',
  },
  {
    key: 'conflict',
    label: 'Conflicts & Tensions',
    icon: '×',
    color: 'var(--color-conflict)',
    weight: 1.5,
    prompt: 'Wars, social conflicts, institutional tensions, or ideological clashes that intersected with this.',
  },
  {
    key: 'companies',
    label: 'Companies & Players',
    icon: '□',
    color: 'var(--color-companies)',
    weight: 1.0,
    prompt: 'The major companies, organisations, and institutional actors involved — including unlikely ones.',
  },
  {
    key: 'ideology',
    label: 'Ideology & Belief',
    icon: '◎',
    color: 'var(--color-ideology)',
    weight: 1.4,
    prompt: 'The dominant ideologies, worldviews, religions, or philosophical currents that shaped thinking at the time.',
  },
  {
    key: 'geography',
    label: 'Geography & Place',
    icon: '◉',
    color: 'var(--color-geography)',
    weight: 1.3,
    prompt: 'Why HERE mattered — the geographic, physical, or spatial dimension. Why this city, region, or landscape.',
  },
  {
    key: 'culture',
    label: 'Culture & Arts',
    icon: '◆',
    color: 'var(--color-culture)',
    weight: 1.3,
    prompt: 'The art, music, literature, and cultural movements being made at exactly the same moment — the zeitgeist.',
  },
  {
    key: 'science',
    label: 'Science & Ideas',
    icon: '⊡',
    color: 'var(--color-science)',
    weight: 1.2,
    prompt: 'The dominant scientific paradigm, adjacent discoveries happening simultaneously, and the ideas in the air.',
  },
  {
    key: 'media',
    label: 'Media & Narrative',
    icon: '↑',
    color: 'var(--color-media)',
    weight: 1.1,
    prompt: 'How this was communicated, reported, or mythologised — and how the medium shaped the message.',
  },
];

export const CATEGORY_BY_KEY = Object.fromEntries(
  CONTEXT_CATEGORIES.map(c => [c.key, c])
);

// Connection strength thresholds (number of shared context nodes between two anchors)
export const STRENGTH = {
  STRONG:   { min: 4, label: 'Strong',   color: 'var(--color-strong)',   strokeWidth: 3 },
  MODERATE: { min: 2, label: 'Moderate', color: 'var(--color-moderate)', strokeWidth: 2 },
  WEAK:     { min: 0, label: 'Weak',     color: 'var(--color-weak)',     strokeWidth: 1.5 },
};

// Daily expansion limit (number of anchor nodes the user can expand per day)
export const DAILY_EXPANSION_LIMIT = 10;

// localStorage keys
export const STORAGE_KEYS = {
  API_KEY:     'webs-api-key',
  CANVAS:      'webs-canvas',
  CARDS:       'webs-cards',
  USAGE:       'webs-usage',      // { date: 'YYYY-MM-DD', count: n }
};

// Spaced repetition intervals in days [again, hard, good]
export const SR_INTERVALS = [0, 1, 3];
