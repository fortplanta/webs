// AI generation pipeline for Webs.
// Fetch logic lives here. Prompt construction lives in prompt.ts. Mock data in mock.ts.

import { v4 as uuidv4 } from 'uuid';
import {
  CanvasState,
  Cluster,
  Fragment,
  Connector,
  FragmentType,
  LayoutType,
  FragmentSlot,
  GenerateApiResponse,
} from './types';
import { SYSTEM_PROMPT, buildUserMessage } from './prompt';
import { getMockCanvasState } from './mock';

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-5';
const MAX_TOKENS = 4000;

const BASE_RADIUS = 700;
const RADIUS_JITTER = 100;
const FRAGMENT_COL_W = 360;
const FRAGMENT_ROW_H = 440;

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

function jitter(range = 16): number {
  return (Math.random() - 0.5) * range;
}

function buildSlots(f: GenerateApiResponse['clusters'][0]['fragments'][0]): FragmentSlot[] {
  const slots: FragmentSlot[] = [];
  if (f.type === 'person') {
    slots.push({ type: 'image', content: '' });
  }
  if (f.body) {
    slots.push({ type: 'body', content: f.body });
  }
  if (f.list && f.list.length > 0) {
    slots.push({ type: 'list', items: f.list });
  }
  if (f.tags && f.tags.length > 0) {
    slots.push({ type: 'tags', items: f.tags });
  }
  return slots;
}

function positionClusters(clusters: Cluster[]): Cluster[] {
  const nonSeedCount = clusters.filter(c => !c.isSeed).length;
  const angleStep = (Math.PI * 2) / (nonSeedCount || 1);
  let nonSeedIdx = 0;

  return clusters.map((cluster) => {
    if (cluster.isSeed) return { ...cluster, x: 0, y: 0 };
    const angle = angleStep * nonSeedIdx++;
    const r = BASE_RADIUS + jitter(RADIUS_JITTER);
    return {
      ...cluster,
      x: Math.cos(angle) * r,
      y: Math.sin(angle) * r,
    };
  });
}

function fragmentPositions(clusterX: number, clusterY: number, count: number): Array<{ x: number; y: number }> {
  return Array.from({ length: count }, (_, i) => ({
    x: clusterX + (i % 2) * FRAGMENT_COL_W - FRAGMENT_COL_W / 2 + jitter(),
    y: clusterY + Math.floor(i / 2) * FRAGMENT_ROW_H + jitter(),
  }));
}

function parseApiResponse(data: GenerateApiResponse, query: string): CanvasState {
  const seedId = uuidv4();
  const seedCluster: Cluster = {
    id: seedId,
    x: 0,
    y: 0,
    label: query.toLowerCase(),
    isSeed: true,
  };
  const seedFragment: Fragment = {
    id: uuidv4(),
    clusterId: seedId,
    x: 0,
    y: 90,
    type: 'domain',
    layout: 'vertical-flow',
    title: query.toLowerCase(),
    slots: [{ type: 'body', content: data.context }],
    createdAtZoom: 0.7,
    starred: false,
  };

  const contentClusters: Cluster[] = data.clusters.map(c => ({
    id: uuidv4(),
    x: 0,
    y: 0,
    label: c.title,
    isSeed: false,
  }));

  const allClusters = positionClusters([seedCluster, ...contentClusters]);

  const clusterByTitle = new Map<string, Cluster>();
  allClusters.forEach(c => clusterByTitle.set(c.label, c));

  const fragments: Fragment[] = [seedFragment];
  const tethers: Connector[] = [{
    id: `tether-${seedFragment.id}`,
    sourceId: seedFragment.id,
    targetId: seedId,
    type: 'tether',
    label: '',
  }];

  data.clusters.forEach((apiCluster, ci) => {
    const cluster = allClusters[ci + 1]; // +1 because seed is index 0
    if (!cluster) return;
    const positions = fragmentPositions(cluster.x, cluster.y, apiCluster.fragments.length);
    apiCluster.fragments.forEach((f, fi) => {
      const fragmentId = uuidv4();
      const pos = positions[fi];
      fragments.push({
        id: fragmentId,
        clusterId: cluster.id,
        x: pos.x,
        y: pos.y,
        type: f.type,
        layout: LAYOUT_FOR_TYPE[f.type],
        title: f.title,
        slots: buildSlots(f),
        createdAtZoom: 0.7,
        starred: false,
      });
      tethers.push({
        id: `tether-${fragmentId}`,
        sourceId: fragmentId,
        targetId: cluster.id,
        type: 'tether',
        label: '',
      });
    });
  });

  const edgeConnectors: Connector[] = data.edges
    .flatMap(e => {
      const source = clusterByTitle.get(e.source);
      const target = clusterByTitle.get(e.target);
      if (!source || !target) return [];
      return [{
        id: uuidv4(),
        sourceId: source.id,
        targetId: target.id,
        type: 'standard' as const,
        label: e.label,
      }];
    });

  return {
    clusters: allClusters,
    fragments,
    connectors: [...tethers, ...edgeConnectors],
    viewport: { x: 0, y: 0, zoom: 0.7 },
    query: query.toLowerCase(),
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
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildUserMessage(query) }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(err?.error?.message ?? `API error ${response.status}`);
  }

  const data = await response.json() as { content?: Array<{ text?: string }> };
  const text = data.content?.[0]?.text ?? '';
  const cleaned = text.replace(/^```json\s*|^```\s*|\s*```$/gm, '').trim();

  let parsed: GenerateApiResponse;
  try {
    parsed = JSON.parse(cleaned) as GenerateApiResponse;
  } catch (err) {
    console.error('Failed to parse API response, falling back to mock:', err, '\nRaw text:', text);
    return getMockCanvasState(query);
  }

  if (!parsed.context || !Array.isArray(parsed.clusters) || !Array.isArray(parsed.edges)) {
    console.error('API response missing required fields, falling back to mock');
    return getMockCanvasState(query);
  }

  return parseApiResponse(parsed, query);
}

export async function generatePivot(
  fragmentTitle: string,
  fragmentBody: string,
  sourceClusterId: string,
): Promise<{
  cluster: Cluster;
  fragments: Fragment[];
  connectors: Connector[];
  edge: Connector;
}> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined;

  const prompt = `Generate 3-5 fragments closely related to this idea:

Title: "${fragmentTitle}"
Context: "${fragmentBody}"

Return ONLY valid JSON:
{
  "title": "cluster title for these related fragments (2-4 words)",
  "fragments": [
    {
      "type": "concept",
      "title": "fragment title",
      "body": "2-4 sentences",
      "tags": ["tag1", "tag2"]
    }
  ]
}`;

  type PivotResponse = { title: string; fragments: GenerateApiResponse['clusters'][0]['fragments'] };

  let pivotData: PivotResponse;

  if (!apiKey) {
    pivotData = {
      title: `related to ${fragmentTitle.toLowerCase()}`,
      fragments: [
        { type: 'concept', title: 'related concept', body: 'A stub fragment for pivot preview.', tags: ['stub'] },
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
    const cleaned = text.replace(/^```json\s*|^```\s*|\s*```$/gm, '').trim();
    pivotData = JSON.parse(cleaned) as PivotResponse;
  }

  const clusterId = uuidv4();
  const cluster: Cluster = {
    id: clusterId,
    x: 0,
    y: 0,
    label: pivotData.title,
    isSeed: false,
  };

  const fragments: Fragment[] = pivotData.fragments.map(f => ({
    id: uuidv4(),
    clusterId,
    x: 0,
    y: 0,
    type: f.type,
    layout: LAYOUT_FOR_TYPE[f.type],
    title: f.title,
    slots: buildSlots(f),
    createdAtZoom: 0.7,
    starred: false,
  }));

  const connectors: Connector[] = fragments.map(f => ({
    id: `tether-${f.id}`,
    sourceId: f.id,
    targetId: clusterId,
    type: 'tether' as const,
    label: '',
  }));

  const edge: Connector = {
    id: uuidv4(),
    sourceId: sourceClusterId,
    targetId: clusterId,
    type: 'standard',
    label: 'explored via',
  };

  return { cluster, fragments, connectors, edge };
}
