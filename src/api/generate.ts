// AI generation pipeline for Webs.
//
// Old system (src/lib/expand.js): direct fetch to Anthropic, model claude-haiku-4-5-20251001,
// generated 14 context categories per anchor node. Preserved in expand.js for reference.
//
// New system: generates clusters/fragments/edges matching CanvasState shape.
// Same direct-fetch pattern and auth headers as the old system.

import { v4 as uuidv4 } from 'uuid';
import {
  CanvasState,
  Cluster,
  Fragment,
  FragmentType,
  LayoutType,
  GenerateApiResponse,
} from './types';

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-5';
const MAX_TOKENS = 4000;

export const LAYOUT_FOR_TYPE: Record<FragmentType, LayoutType> = {
  person:  'image-hero',
  concept: 'vertical-flow',
  thesis:  'vertical-flow',
  quote:   'quote-centered',
  source:  'card-split',
  event:   'timeline',
  era:     'vertical-flow',
  domain:  'vertical-flow',
};

function buildPrompt(query: string): string {
  return `You are a thinking partner helping someone explore the topic: "${query}"

Generate a knowledge canvas with interconnected clusters of fragments. Each cluster is a thematic group; each fragment is a specific piece of knowledge within that theme.

Return ONLY valid JSON matching this exact shape (no markdown, no commentary):
{
  "context": "2-3 sentence grounding paragraph about the topic for the seed node",
  "clusters": [
    {
      "title": "cluster theme title",
      "fragments": [
        {
          "type": "one of: person | concept | thesis | source | event | era | domain | quote",
          "title": "fragment title",
          "slots": [
            { "type": "body", "content": "2-3 sentence explanation" },
            { "type": "tags", "items": ["tag1", "tag2"] }
          ]
        }
      ]
    }
  ],
  "edges": [
    { "source": "cluster title", "target": "other cluster title", "label": "verb phrase" }
  ]
}

Rules:
- 5 to 8 clusters
- 3 to 5 fragments per cluster
- Every fragment must have at least one "body" slot with meaningful content
- Do not include "image" slots — images are handled separately
- Edge labels must be short verb phrases: "shaped by", "resulted in", "challenged by", "enabled", "inspired"
- Fragment types: person (named individual), concept (idea/framework), thesis (argument/claim), source (book/paper/article), event (historical occurrence), era (time period), domain (field of study/practice), quote (direct quotation)`;
}

function positionClusters(clusters: Cluster[]): Cluster[] {
  const seedIndex = clusters.findIndex(c => c.isSeed);
  const BASE_RADIUS = 700;
  const JITTER = 100;
  const nonSeedCount = clusters.length - 1;
  const angleStep = (Math.PI * 2) / (nonSeedCount || 1);
  let nonSeedIdx = 0;

  return clusters.map((cluster) => {
    if (cluster.isSeed) return { ...cluster, x: 0, y: 0 };
    const angle = angleStep * nonSeedIdx++;
    const r = BASE_RADIUS + (Math.random() - 0.5) * JITTER;
    return {
      ...cluster,
      x: Math.cos(angle) * r,
      y: Math.sin(angle) * r,
    };
  });
}

function parseApiResponse(
  data: GenerateApiResponse,
  query: string,
  initialZoom: number
): CanvasState {
  const seedCluster: Cluster = {
    id: uuidv4(),
    x: 0,
    y: 0,
    title: query.toLowerCase(),
    isSeed: true,
    fragments: [
      {
        id: uuidv4(),
        type: 'concept',
        layout: 'vertical-flow',
        title: query.toLowerCase(),
        slots: [{ type: 'body', content: data.context }],
        createdAtZoom: initialZoom,
        starred: false,
      },
    ],
  };

  const contentClusters: Cluster[] = data.clusters.map(c => ({
    id: uuidv4(),
    x: 0,
    y: 0,
    title: c.title,
    isSeed: false,
    fragments: c.fragments.map(f => ({
      id: uuidv4(),
      type: f.type,
      layout: LAYOUT_FOR_TYPE[f.type],
      title: f.title,
      slots: f.slots,
      createdAtZoom: initialZoom,
      starred: false,
    })),
  }));

  const allClusters = positionClusters([seedCluster, ...contentClusters]);

  const clusterByTitle = new Map<string, Cluster>();
  allClusters.forEach(c => clusterByTitle.set(c.title, c));

  const edges = data.edges
    .map(e => {
      const source = clusterByTitle.get(e.source);
      const target = clusterByTitle.get(e.target);
      if (!source || !target) return null;
      return {
        id: uuidv4(),
        sourceClusterId: source.id,
        targetClusterId: target.id,
        label: e.label,
      };
    })
    .filter((e): e is NonNullable<typeof e> => e !== null);

  return {
    clusters: allClusters,
    edges,
    viewport: { x: 0, y: 0, zoom: 0.7 },
    query,
    createdAt: Date.now(),
  };
}

export async function generateCanvas(query: string): Promise<CanvasState> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined;

  if (!apiKey) {
    return getMockCanvasState(query);
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages: [{ role: 'user', content: buildPrompt(query) }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(err?.error?.message ?? `API error ${response.status}`);
  }

  const data = await response.json() as { content?: Array<{ text?: string }> };
  const text = data.content?.[0]?.text ?? '';
  const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
  const parsed = JSON.parse(cleaned) as GenerateApiResponse;

  return parseApiResponse(parsed, query, 0.7);
}

export async function generatePivot(
  fragmentTitle: string,
  fragmentBody: string,
  sourceClusterId: string
): Promise<{ cluster: Cluster; edge: { id: string; sourceClusterId: string; targetClusterId: string; label: string } }> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined;

  const prompt = `Generate 3-5 fragments closely related to this idea:

Title: "${fragmentTitle}"
Context: "${fragmentBody}"

Return ONLY valid JSON:
{
  "title": "cluster title for these related fragments",
  "fragments": [
    { "type": "concept|person|thesis|source|event|era|domain|quote", "title": "...", "slots": [{ "type": "body", "content": "..." }] }
  ]
}`;

  let clusterData: { title: string; fragments: GenerateApiResponse['clusters'][0]['fragments'] };

  if (!apiKey) {
    clusterData = {
      title: `related to ${fragmentTitle.toLowerCase()}`,
      fragments: [
        { type: 'concept', title: 'related concept', slots: [{ type: 'body', content: 'A stub fragment for pivot preview.' }] },
      ],
    };
  } else {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json() as { content?: Array<{ text?: string }> };
    const text = data.content?.[0]?.text ?? '';
    const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
    clusterData = JSON.parse(cleaned) as typeof clusterData;
  }

  const newCluster: Cluster = {
    id: uuidv4(),
    x: 0,
    y: 0,
    title: clusterData.title,
    isSeed: false,
    fragments: clusterData.fragments.map(f => ({
      id: uuidv4(),
      type: f.type,
      layout: LAYOUT_FOR_TYPE[f.type],
      title: f.title,
      slots: f.slots,
      createdAtZoom: 0.7,
      starred: false,
    })),
  };

  const edge = {
    id: uuidv4(),
    sourceClusterId,
    targetClusterId: newCluster.id,
    label: 'explored via',
  };

  return { cluster: newCluster, edge };
}

// Mock data — covers all 8 fragment types and all 6 layout types.
// Shown when VITE_ANTHROPIC_API_KEY is absent.
export function getMockCanvasState(query: string = 'the printing press'): CanvasState {
  const seed: Cluster = {
    id: 'seed',
    x: 0,
    y: 0,
    title: query.toLowerCase(),
    isSeed: true,
    fragments: [{
      id: 'seed-f1',
      type: 'concept',
      layout: 'vertical-flow',
      title: query.toLowerCase(),
      slots: [{ type: 'body', content: 'The printing press transformed how knowledge spreads, democratising access to ideas that were once controlled by scribes and the church. Its effects rippled across religion, politics, science, and language for centuries.' }],
      createdAtZoom: 0.7,
      starred: false,
    }],
  };

  const clusters: Cluster[] = [
    seed,
    {
      id: 'c1', x: 700, y: 0, title: 'key figures', isSeed: false,
      fragments: [
        { id: 'c1-f1', type: 'person', layout: 'image-hero', title: 'Johannes Gutenberg', slots: [{ type: 'body', content: 'German goldsmith who adapted the screw press to movable type around 1440, making rapid text reproduction practical for the first time.' }, { type: 'tags', items: ['inventor', 'goldsmith', 'Mainz'] }], createdAtZoom: 0.7, starred: false },
        { id: 'c1-f2', type: 'person', layout: 'image-hero', title: 'William Caxton', slots: [{ type: 'body', content: 'First English printer, who established a press in Westminster in 1476 and played a key role in standardising the English language.' }, { type: 'tags', items: ['England', 'publisher'] }], createdAtZoom: 0.7, starred: false },
      ],
    },
    {
      id: 'c2', x: 0, y: 700, title: 'core ideas', isSeed: false,
      fragments: [
        { id: 'c2-f1', type: 'concept', layout: 'vertical-flow', title: 'information democratisation', slots: [{ type: 'body', content: 'When reproduction costs collapse, control over which ideas spread shifts from gatekeepers to producers. The press was the first mass medium.' }, { type: 'tags', items: ['media', 'access', 'power'] }], createdAtZoom: 0.7, starred: false },
        { id: 'c2-f2', type: 'thesis', layout: 'vertical-flow', title: 'print created the nation-state', slots: [{ type: 'body', content: 'Benedict Anderson argued that vernacular print capitalism gave people the shared imaginative framework needed to conceive of themselves as a nation.' }, { type: 'disclaimer', content: 'Contested claim — nationalist movements predate widespread literacy in some regions.' }], createdAtZoom: 0.7, starred: false },
        { id: 'c2-f3', type: 'domain', layout: 'vertical-flow', title: 'media studies', slots: [{ type: 'body', content: 'The academic field examining how communication technologies shape society, cognition, and power — heavily influenced by McLuhan\'s study of print.' }], createdAtZoom: 0.7, starred: false },
      ],
    },
    {
      id: 'c3', x: -700, y: 0, title: 'primary sources', isSeed: false,
      fragments: [
        { id: 'c3-f1', type: 'source', layout: 'card-split', title: 'The Gutenberg Galaxy', slots: [{ type: 'body', content: 'Marshall McLuhan\'s 1962 analysis of how typography reshaped Western thought, introducing the concept of the "global village".' }, { type: 'tags', items: ['McLuhan', '1962', 'media theory'] }], createdAtZoom: 0.7, starred: false },
        { id: 'c3-f2', type: 'source', layout: 'card-split', title: 'Imagined Communities', slots: [{ type: 'body', content: 'Benedict Anderson\'s 1983 work arguing print capitalism was the foundation of modern nationalist consciousness.' }, { type: 'tags', items: ['Anderson', '1983', 'nationalism'] }], createdAtZoom: 0.7, starred: false },
      ],
    },
    {
      id: 'c4', x: 0, y: -700, title: 'historical moments', isSeed: false,
      fragments: [
        { id: 'c4-f1', type: 'event', layout: 'timeline', title: 'Gutenberg Bible printed', slots: [{ type: 'body', content: 'The first major book printed with movable type in Europe, completed around 1455. Approximately 180 copies were produced — 49 survive today.' }], createdAtZoom: 0.7, starred: false },
        { id: 'c4-f2', type: 'event', layout: 'timeline', title: 'Luther\'s 95 Theses spread', slots: [{ type: 'body', content: 'Posted in 1517, Luther\'s theses circulated across Europe within weeks due to print — a phenomenon impossible a century earlier. The Reformation followed.' }], createdAtZoom: 0.7, starred: false },
        { id: 'c4-f3', type: 'era', layout: 'vertical-flow', title: 'the incunabula period', slots: [{ type: 'body', content: 'The first 50 years of European printing (1450–1500), during which over 30,000 distinct editions were produced and the infrastructure of publishing took shape.' }], createdAtZoom: 0.7, starred: false },
      ],
    },
    {
      id: 'c5', x: 495, y: 495, title: 'voices on media', isSeed: false,
      fragments: [
        { id: 'c5-f1', type: 'quote', layout: 'quote-centered', title: 'McLuhan on media', slots: [{ type: 'body', content: '"The medium is the message." — Marshall McLuhan, Understanding Media, 1964' }], createdAtZoom: 0.7, starred: false },
        { id: 'c5-f2', type: 'quote', layout: 'quote-centered', title: 'Eisenstein on print', slots: [{ type: 'body', content: '"Fixed forms made it possible for readers to disagree with each other and with authors in a new way." — Elizabeth Eisenstein, The Printing Press as an Agent of Change, 1980' }], createdAtZoom: 0.7, starred: false },
      ],
    },
  ];

  const edges = [
    { id: 'e1', sourceClusterId: 'seed', targetClusterId: 'c1', label: 'driven by' },
    { id: 'e2', sourceClusterId: 'seed', targetClusterId: 'c2', label: 'produced' },
    { id: 'e3', sourceClusterId: 'seed', targetClusterId: 'c3', label: 'documented in' },
    { id: 'e4', sourceClusterId: 'seed', targetClusterId: 'c4', label: 'shaped by' },
    { id: 'e5', sourceClusterId: 'c2', targetClusterId: 'c5', label: 'inspired' },
  ];

  return {
    clusters,
    edges,
    viewport: { x: 0, y: 0, zoom: 0.7 },
    query,
    createdAt: Date.now(),
  };
}
