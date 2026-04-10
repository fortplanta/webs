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
    prompt: 'What technological shift made this possible, inevitable, or obsolete — and who understood that before everyone else?',
  },
  {
    key: 'political',
    label: 'Political Climate',
    icon: '⚑',
    color: 'var(--color-political)',
    weight: 1.3,
    prompt: 'What was the real power dynamic underneath? Who needed this to happen, who needed it to fail — and what does that reveal about the actual game being played?',
  },
  {
    key: 'market',
    label: 'Market Dynamics',
    icon: '◫',
    color: 'var(--color-market)',
    weight: 1.1,
    prompt: 'What economic incentive or pressure was quietly steering behaviour? Follow the money — whose position improved, whose collapsed, and why then?',
  },
  {
    key: 'supplyChain',
    label: 'Supply Chain',
    icon: '→',
    color: 'var(--color-supply-chain)',
    weight: 1.0,
    prompt: 'What physical dependency or chokepoint was invisible until it mattered? What did this expose about where real leverage actually sits?',
  },
  {
    key: 'people',
    label: 'Influential People',
    icon: '○',
    color: 'var(--color-people)',
    weight: 1.4,
    prompt: 'Whose obsession, fear, or ambition was the actual engine here? Who do we undercount or misunderstand when we tell the conventional story?',
  },
  {
    key: 'law',
    label: 'Law & Regulation',
    icon: '⊙',
    color: 'var(--color-law)',
    weight: 1.2,
    prompt: 'What rule made this possible, or what precedent did it quietly set? What were powerful actors trying to lock in — or lock out — through legal means?',
  },
  {
    key: 'business',
    label: 'Business Models',
    icon: '◇',
    color: 'var(--color-business)',
    weight: 1.1,
    prompt: 'What financial logic was actually driving decisions — and how did it diverge from the stated mission or public narrative?',
  },
  {
    key: 'conflict',
    label: 'Conflicts & Tensions',
    icon: '×',
    color: 'var(--color-conflict)',
    weight: 1.5,
    prompt: 'What was the real fault line — and what had been suppressing it? What does this conflict reveal about a deeper, older friction that was waiting to surface?',
  },
  {
    key: 'companies',
    label: 'Companies & Players',
    icon: '□',
    color: 'var(--color-companies)',
    weight: 1.0,
    prompt: 'Which organisations were structurally positioned to win or lose regardless of their intentions? Who was the unsexy actor that actually made it happen?',
  },
  {
    key: 'ideology',
    label: 'Ideology & Belief',
    icon: '◎',
    color: 'var(--color-ideology)',
    weight: 1.4,
    prompt: 'What worldview was taken for granted — invisible, unquestioned — and how did it shape what was even conceivable? What collective sentiment was running underneath?',
  },
  {
    key: 'geography',
    label: 'Geography & Place',
    icon: '◉',
    color: 'var(--color-geography)',
    weight: 1.3,
    prompt: 'Why here and not somewhere else? What did this specific landscape, city, or location make possible that wouldn\'t have worked in any other context?',
  },
  {
    key: 'culture',
    label: 'Culture & Arts',
    icon: '◆',
    color: 'var(--color-culture)',
    weight: 1.3,
    prompt: 'What did artists and storytellers sense that analysts missed? What collective anxiety, longing, or mood were they expressing — and what did it predict?',
  },
  {
    key: 'science',
    label: 'Science & Ideas',
    icon: '⊡',
    color: 'var(--color-science)',
    weight: 1.2,
    prompt: 'What idea was quietly circulating before this happened — and which thinkers were ignored or ahead of their time? What does this reveal about how new thinking actually spreads?',
  },
  {
    key: 'media',
    label: 'Media & Narrative',
    icon: '↑',
    color: 'var(--color-media)',
    weight: 1.1,
    prompt: 'What story was being told vs. what was actually happening? Who controlled the frame — and how did that shape what became "true" in the public mind?',
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
