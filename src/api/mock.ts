// Mock canvas state — shown when VITE_ANTHROPIC_API_KEY is absent.
// Covers all 8 fragment types and all 6 layout types.
// Uses the correct CanvasState schema (Cluster with label, flat fragments array).

import { CanvasState, Cluster, Fragment, Connector, PivotApiResponse } from './types';
import { zoom as zoomTokens } from '../tokens/tokens';

const CLUSTERS: Cluster[] = [
  { id: 'seed', x: 0,    y: 0,    initialX: 0,    initialY: 0,    label: 'exploring colonialism',  isSeed: true  },
  { id: 'c1',  x: 0,    y: -800, initialX: 0,    initialY: -800, label: 'economic systems',       isSeed: false },
  { id: 'c2',  x: 800,  y: 0,    initialX: 800,  initialY: 0,    label: 'key figures',            isSeed: false },
  { id: 'c3',  x: 0,    y: 800,  initialX: 0,    initialY: 800,  label: 'resistance movements',   isSeed: false },
  { id: 'c4',  x: -800, y: 0,    initialX: -800, initialY: 0,    label: 'long-term consequences', isSeed: false },
];

// Column layout helper — 3 fragments centered on cluster spawn
// FRAGMENT_HEIGHT=480, FRAGMENT_GAP=48 → totalHeight=1488, startY = clusterY - 744
function col(clusterY: number, i: number): number {
  return clusterY - 744 + i * 528;
}

const FRAGMENTS: Fragment[] = [
  // seed
  { id: 's1', clusterId: 'seed', x: 0, y: 90, initialX: 0, initialY: 90,
    type: 'domain', title: 'exploring colonialism', layout: 'vertical-flow', slots: [
      { type: 'body', content: 'Colonialism was a system of political and economic domination imposed by European powers across Africa, Asia, and the Americas from the 15th century onward. Its legacies — economic, cultural, psychological — shape the world today.' },
      { type: 'tags', items: ['colonialism', 'imperialism', 'history'] },
    ], createdAtZoom: 0.7, starred: false },

  // c1 — economic systems (N, y=-800)
  { id: 'c1f1', clusterId: 'c1', x: 0, y: col(-800, 0), initialX: 0, initialY: col(-800, 0),
    type: 'concept', title: 'mercantilism', layout: 'vertical-flow', historicalEra: '1500s–1700s', slots: [
      { type: 'body', content: 'Economic theory that dominated European thinking from the 16th–18th centuries, emphasising trade surpluses and the accumulation of bullion as national wealth.' },
      { type: 'tags', items: ['economics', 'trade', '16th century'] },
    ], createdAtZoom: 0.7, starred: false },
  { id: 'c1f2', clusterId: 'c1', x: 0, y: col(-800, 1), initialX: 0, initialY: col(-800, 1),
    type: 'thesis', title: 'extraction logic', layout: 'vertical-flow', slots: [
      { type: 'body', content: 'Colonial economies were structured not to develop local prosperity but to extract resources, labour, and capital for the benefit of the metropole.' },
      { type: 'tags', items: ['extraction', 'thesis', 'political economy'] },
    ], createdAtZoom: 0.7, starred: false },
  { id: 'c1f3', clusterId: 'c1', x: 0, y: col(-800, 2), initialX: 0, initialY: col(-800, 2),
    type: 'source', title: 'capital vol. 1', layout: 'card-split', slots: [
      { type: 'body', content: "Marx's analysis of commodity, labour power, and surplus value — foundational to understanding how colonial extraction was theorised as systemic rather than incidental." },
      { type: 'tags', items: ['Marx', 'source', 'political economy'] },
    ], createdAtZoom: 0.7, starred: false },

  // c2 — key figures (E, x=800)
  { id: 'c2f1', clusterId: 'c2', x: 800, y: col(0, 0), initialX: 800, initialY: col(0, 0),
    type: 'person', title: 'leopold II', layout: 'image-hero', historicalEra: '1885–1908', slots: [
      { type: 'image', content: 'https://source.unsplash.com/400x300/?leopold,belgium,king' },
      { type: 'body', content: 'King of Belgium who privately owned the Congo Free State 1885–1908, overseeing a brutal rubber extraction regime responsible for millions of deaths.' },
      { type: 'tags', items: ['Belgium', 'Congo', 'atrocity'] },
    ], createdAtZoom: 0.7, starred: false },
  { id: 'c2f2', clusterId: 'c2', x: 800, y: col(0, 1), initialX: 800, initialY: col(0, 1),
    type: 'person', title: 'frantz fanon', layout: 'image-hero', historicalEra: '1925–1961', slots: [
      { type: 'image', content: 'https://source.unsplash.com/400x300/?frantz,fanon,philosopher,algeria' },
      { type: 'body', content: 'Martinican-Algerian philosopher and psychiatrist whose work on decolonisation, violence, and national consciousness shaped anti-colonial movements globally.' },
      { type: 'tags', items: ['philosophy', 'Algeria', 'decolonisation'] },
    ], createdAtZoom: 0.7, starred: false },
  { id: 'c2f3', clusterId: 'c2', x: 800, y: col(0, 2), initialX: 800, initialY: col(0, 2),
    type: 'era', title: 'age of empire', layout: 'vertical-flow', historicalEra: '1880s–1914', slots: [
      { type: 'body', content: 'The period of intensified European imperial expansion in the late 19th century, when major powers scrambled to claim territories across Africa and Asia.' },
      { type: 'tags', items: ['empire', '1880s', 'scramble for africa'] },
    ], createdAtZoom: 0.7, starred: false },

  // c3 — resistance movements (S, y=800)
  { id: 'c3f1', clusterId: 'c3', x: 0, y: col(800, 0), initialX: 0, initialY: col(800, 0),
    type: 'event', title: 'haitian revolution', layout: 'timeline', historicalEra: '1791–1804', slots: [
      { type: 'image', content: 'https://source.unsplash.com/400x300/?haiti,revolution,history' },
      { type: 'body', content: 'The only successful slave revolution in history, 1791–1804. Haiti became the first Black republic and first nation in the Western Hemisphere to abolish slavery.' },
      { type: 'tags', items: ['Haiti', '1804', 'revolution', 'slavery'] },
    ], createdAtZoom: 0.7, starred: false },
  { id: 'c3f2', clusterId: 'c3', x: 0, y: col(800, 1), initialX: 0, initialY: col(800, 1),
    type: 'concept', title: 'decolonisation', layout: 'vertical-flow', historicalEra: '1950s–1960s', slots: [
      { type: 'body', content: 'The process by which colonies gained independence from European powers, accelerating dramatically in the 1950s and 1960s across Africa and Asia.' },
      { type: 'tags', items: ['independence', '1960s', 'Africa', 'Asia'] },
    ], createdAtZoom: 0.7, starred: false },
  { id: 'c3f3', clusterId: 'c3', x: 0, y: col(800, 2), initialX: 0, initialY: col(800, 2),
    type: 'quote', title: 'fanon on violence', layout: 'quote-centered', slots: [
      { type: 'body', content: '"Violence is a cleansing force. It frees the native from his inferiority complex and from his despair and inaction." — Frantz Fanon, The Wretched of the Earth, 1961' },
    ], createdAtZoom: 0.7, starred: false },

  // c4 — long-term consequences (W, x=-800)
  { id: 'c4f1', clusterId: 'c4', x: -800, y: col(0, 0), initialX: -800, initialY: col(0, 0),
    type: 'thesis', title: 'resource curse', layout: 'vertical-flow', slots: [
      { type: 'body', content: 'The paradox that nations with abundant natural resources often exhibit lower economic growth and weaker governance than resource-poor nations — a legacy of colonial extraction patterns.' },
      { type: 'tags', items: ['economics', 'resources', 'development'] },
    ], createdAtZoom: 0.7, starred: false },
  { id: 'c4f2', clusterId: 'c4', x: -800, y: col(0, 1), initialX: -800, initialY: col(0, 1),
    type: 'era', title: 'post-colonial era', layout: 'vertical-flow', historicalEra: '1960s', slots: [
      { type: 'body', content: 'The period following formal decolonisation, from the 1960s onward, characterised by new nation-states navigating neocolonial dependency structures.' },
      { type: 'tags', items: ['1960s–present', 'independence', 'era'] },
    ], createdAtZoom: 0.7, starred: false },
  { id: 'c4f3', clusterId: 'c4', x: -800, y: col(0, 2), initialX: -800, initialY: col(0, 2),
    type: 'concept', title: 'neo-colonialism', layout: 'vertical-flow', slots: [
      { type: 'body', content: "Kwame Nkrumah's term for the continued economic and political control of formerly colonised nations through financial institutions, trade agreements, and cultural hegemony." },
      { type: 'tags', items: ['Nkrumah', 'Africa', 'economics'] },
    ], createdAtZoom: 0.7, starred: false },
];

const CONNECTORS: Connector[] = [
  { id: 'e1', sourceId: 'seed', targetId: 'c1', type: 'standard', label: 'structured by' },
  { id: 'e2', sourceId: 'seed', targetId: 'c2', type: 'standard', label: 'enacted by' },
  { id: 'e3', sourceId: 'seed', targetId: 'c3', type: 'standard', label: 'challenged by' },
  { id: 'e4', sourceId: 'seed', targetId: 'c4', type: 'standard', label: 'resulted in' },
];

export const INITIAL_STATE: CanvasState = {
  clusters: CLUSTERS,
  fragments: FRAGMENTS,
  connectors: CONNECTORS,
  viewport: { x: 0, y: 0, zoom: zoomTokens.initial },
  query: 'colonialism',
  createdAt: 0,
};

const MOCK_PIVOT_RESULTS: PivotApiResponse[] = [
  {
    clusterTitle: 'theoretical roots',
    edgeLabel: 'grounded in',
    fragments: [
      {
        type: 'concept',
        title: 'enlightenment foundations',
        body: 'The intellectual traditions of the Enlightenment provided the ideological scaffolding for many modern systems, prioritising reason, progress, and universal categories that often masked particular interests.',
        tags: ['enlightenment', 'ideology', 'modernity'],
        list: ['universalism', 'rationalism', 'progress myth', 'humanism'],
      },
      {
        type: 'thesis',
        title: 'knowledge as power',
        body: "Foucault's insight that knowledge production and power are inseparable — what gets counted as knowledge, who produces it, and how it circulates all serve to reproduce existing power relations.",
        tags: ['Foucault', 'epistemology', 'power'],
      },
      {
        type: 'person',
        title: 'edward said',
        body: "Palestinian-American critic whose 1978 work Orientalism revealed how Western scholarship constructed the 'East' as exotic and inferior — a textual apparatus that justified imperial domination.",
        tags: ['orientalism', 'postcolonial', 'literary theory'],
      },
      {
        type: 'source',
        title: 'discipline and punish',
        body: "Foucault's 1975 genealogy of the modern prison, tracing how surveillance, normalisation, and disciplinary power moved from the body to the soul — and from institutions into the fabric of society.",
        tags: ['Foucault', 'source', '1975', 'surveillance'],
      },
    ],
  },
  {
    clusterTitle: 'contemporary echoes',
    edgeLabel: 'continues through',
    fragments: [
      {
        type: 'concept',
        title: 'structural inequality',
        body: 'Inequalities that are reproduced not through individual prejudice but through the design of institutions, policies, and economic arrangements — often invisible to those they benefit.',
        tags: ['inequality', 'systems', 'race', 'class'],
        list: ['housing policy', 'education gaps', 'credit access', 'health disparities'],
      },
      {
        type: 'event',
        title: 'financial crisis 2008',
        body: 'The global financial collapse that disproportionately stripped wealth from communities of colour and the global south while concentrating bailout funds in financial institutions — a structural pattern with deep historical roots.',
        tags: ['economics', '2008', 'crisis', 'inequality'],
        era: '2008',
      },
      {
        type: 'thesis',
        title: 'coloniality of power',
        body: "Aníbal Quijano's concept: colonialism did not end with independence — its racial classification system and hierarchies of knowledge were absorbed into the structures of modern nation-states and the global economy.",
        tags: ['Quijano', 'decoloniality', 'race', 'modernity'],
      },
    ],
  },
  {
    clusterTitle: 'counter-narratives',
    edgeLabel: 'challenged by',
    fragments: [
      {
        type: 'concept',
        title: 'subaltern studies',
        body: 'A scholarly movement begun in the 1980s that sought to recover histories of colonised peoples written from below — not through the lens of nationalist elites or colonial archives.',
        tags: ['historiography', 'India', 'subaltern', 'postcolonial'],
      },
      {
        type: 'quote',
        title: 'spivak on the subaltern',
        body: '"Can the subaltern speak?" — Gayatri Chakravorty Spivak, 1988. The question interrogates whether the marginalised can represent themselves within frameworks built to exclude them.',
      },
      {
        type: 'person',
        title: 'walter mignolo',
        body: 'Argentine semiotician who developed the concept of border thinking — knowledge produced from the colonial wound that cannot be absorbed into Western epistemology and opens genuinely different possibilities.',
        tags: ['decoloniality', 'epistemology', 'border thinking'],
      },
      {
        type: 'era',
        title: 'postcolonial turn',
        body: 'The intellectual shift from the 1970s onward in which scholars in literature, history, and anthropology began deconstructing colonial knowledge systems and centring non-Western perspectives.',
        tags: ['academia', '1970s', 'postcolonial theory'],
      },
    ],
  },
];

export function getMockPivotResult(fragment: Fragment): PivotApiResponse {
  const charSum = fragment.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return MOCK_PIVOT_RESULTS[charSum % MOCK_PIVOT_RESULTS.length];
}

export function getMockCanvasState(query: string): CanvasState {
  const seedFragment = FRAGMENTS.find(f => f.clusterId === 'seed');
  const overriddenFragments = FRAGMENTS.map(f => {
    const base = f.id === seedFragment?.id ? { ...f, title: query.toLowerCase() } : f;
    const hasImage = base.slots.some(s => s.type === 'image');
    const noEmpty = !base.emptySlots;
    if (noEmpty && !hasImage && base.type !== 'quote' && base.type !== 'spark' && base.type !== 'text-note') {
      return { ...base, emptySlots: ['image'] as import('./types').SlotType[] };
    }
    return base;
  });
  const overriddenClusters = CLUSTERS.map(c =>
    c.isSeed ? { ...c, label: query.toLowerCase() } : c
  );
  return {
    clusters: overriddenClusters,
    fragments: overriddenFragments,
    connectors: CONNECTORS,
    viewport: { x: 0, y: 0, zoom: zoomTokens.initial },
    query: query.toLowerCase(),
    createdAt: Date.now(),
  };
}
