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
  SlotType,
  GenerateApiResponse,
  PivotApiResponse,
} from './types';
import { SYSTEM_PROMPT, buildUserMessage, PIVOT_SYSTEM_PROMPT, buildPivotUserMessage, PROMPT_SYSTEM_PROMPT, buildPromptOnSlotMessage } from './prompt';
import { PromptDefinition } from '../prompts/prompts';
import { getMockCanvasState, getMockPivotResult } from './mock';

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-5';
const MAX_TOKENS = 8000;

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

// Normalize a value that should be string[] but may arrive as a comma-string from the AI
function normalizeArray(val: string[] | string | undefined | null): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(Boolean);
  return String(val).split(',').map(s => s.trim()).filter(Boolean);
}

function buildSlots(f: GenerateApiResponse['clusters'][0]['fragments'][0]): FragmentSlot[] {
  const slots: FragmentSlot[] = [];
  // person image slots are intentionally omitted — we have no image URLs from the API
  if (f.body) {
    slots.push({ type: 'body', content: f.body });
  }
  const list = normalizeArray(f.list as string[] | string | undefined);
  if (list.length > 0) {
    slots.push({ type: 'list', items: list });
  }
  const tags = normalizeArray(f.tags as string[] | string | undefined);
  if (tags.length > 0) {
    slots.push({ type: 'tags', items: tags });
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

  data.clusters.forEach((apiCluster, ci) => {
    const cluster = allClusters[ci + 1]; // +1 because seed is index 0
    if (!cluster) return;
    const positions = fragmentPositions(cluster.x, cluster.y, apiCluster.fragments.length);
    apiCluster.fragments.forEach((f, fi) => {
      const fragmentId = uuidv4();
      const pos = positions[fi];
      const builtSlots = buildSlots(f);
      const hasImage = builtSlots.some(s => s.type === 'image');
      fragments.push({
        id: fragmentId,
        clusterId: cluster.id,
        x: pos.x,
        y: pos.y,
        type: f.type,
        layout: LAYOUT_FOR_TYPE[f.type],
        title: f.title,
        slots: builtSlots,
        createdAtZoom: 0.7,
        starred: false,
        emptySlots: hasImage || f.type === 'quote' ? [] : ['image'],
        historicalEra: f.historicalEra,
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
    connectors: edgeConnectors,
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
  // Extract JSON robustly: find first { and last } to handle any preamble/postamble/fences
  const jsonStart = text.indexOf('{');
  const jsonEnd = text.lastIndexOf('}');
  const cleaned = jsonStart !== -1 && jsonEnd > jsonStart ? text.slice(jsonStart, jsonEnd + 1) : text.trim();

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

const PIVOT_OFFSET_X = 400;
const PIVOT_OFFSET_Y = -200;

export interface PivotResult {
  cluster: Cluster;
  fragments: Fragment[];
  interConnector: Connector;
}

function buildPivotResult(pivotData: PivotApiResponse, sourceFragment: Fragment, sourceClusterId: string): PivotResult {
  const clusterId = uuidv4();
  const clusterX = sourceFragment.x + PIVOT_OFFSET_X + jitter(160);
  const clusterY = sourceFragment.y + PIVOT_OFFSET_Y + jitter(160);

  const cluster: Cluster = {
    id: clusterId,
    x: clusterX,
    y: clusterY,
    label: pivotData.clusterTitle,
    isSeed: false,
  };

  const positions = fragmentPositions(clusterX, clusterY, pivotData.fragments.length);

  const fragments: Fragment[] = pivotData.fragments.map((f, i) => ({
    id: uuidv4(),
    clusterId,
    x: positions[i].x,
    y: positions[i].y,
    type: f.type,
    layout: LAYOUT_FOR_TYPE[f.type],
    title: f.title,
    slots: buildSlots(f),
    createdAtZoom: 0.7,
    starred: false,
  }));

  const interConnector: Connector = {
    id: uuidv4(),
    sourceId: sourceClusterId,
    targetId: clusterId,
    type: 'standard',
    label: pivotData.edgeLabel || 'explored via',
  };

  return { cluster, fragments, interConnector };
}

export interface SparkResult {
  cluster: Cluster;
  fragments: Fragment[];
  connector: Connector;
}

// TODO: replace with real API call (OCR / image analysis)
export async function generateSparkExplode(
  sourceFragment: Fragment,
  _action: 'summarise' | 'extract-entities',
): Promise<SparkResult> {
  await new Promise(resolve => setTimeout(resolve, 1500));

  const clusterId = uuidv4();
  const clusterX = sourceFragment.x + 500 + jitter(80);
  const clusterY = sourceFragment.y + jitter(80);

  const cluster: Cluster = {
    id: clusterId,
    x: clusterX,
    y: clusterY,
    label: 'from spark',
    isSeed: false,
  };

  const mockFragments: Fragment[] = [
    { id: uuidv4(), clusterId, x: clusterX - 160 + jitter(), y: clusterY + 80 + jitter(), type: 'concept', layout: 'vertical-flow', title: 'visual element', slots: [{ type: 'body', content: 'A key concept identified in the spark image.' }], createdAtZoom: 0.7, starred: false },
    { id: uuidv4(), clusterId, x: clusterX + 200 + jitter(), y: clusterY + 80 + jitter(), type: 'thesis',  layout: 'vertical-flow', title: 'central argument', slots: [{ type: 'body', content: 'A thesis extracted from the visual content.' }], createdAtZoom: 0.7, starred: false },
    { id: uuidv4(), clusterId, x: clusterX + 20  + jitter(), y: clusterY + 480 + jitter(), type: 'source',  layout: 'card-split',    title: 'related source', slots: [{ type: 'body', content: 'A source suggested by the visual content.' }], createdAtZoom: 0.7, starred: false },
  ];

  const connector: Connector = {
    id: uuidv4(),
    sourceId: sourceFragment.clusterId,
    targetId: clusterId,
    type: 'standard',
    label: 'extracted from',
  };

  return { cluster, fragments: mockFragments, connector };
}

export interface PromptResult {
  slotType: SlotType;
  content?: string;
  items?: string[];
}

function getMockPromptResult(fragment: Fragment, prompt: PromptDefinition): PromptResult {
  const title = fragment.title;
  switch (prompt.id) {
    case 'explain-simple':
      return { slotType: 'body', content: `Imagine ${title} is like a big toy that lots of smart people built together. It helps us do things faster and easier, like how a bicycle helps you go faster than walking.` };
    case 'visual-learning':
      return { slotType: 'body', content: `Picture ${title} as a vast, shimmering web stretched across a dark room — each thread a glowing connection, humming with invisible energy whenever a thought travels along it.` };
    case 'fact-check':
      return { slotType: 'body', content: `The core claims about ${title} are broadly accurate based on current knowledge, though some specifics may vary by context or have evolved since initial publication.` };
    case 'find-similarities':
      return { slotType: 'list', items: [`${title} parallels systems theory`, 'Similar emergence in biological networks', 'Echoes in economic complexity', 'Related to feedback loops in ecology', 'Connects to information theory'] };
    case 'steelman':
      return { slotType: 'body', content: `The strongest case for ${title} is its explanatory power: it unifies disparate phenomena under a single coherent framework, making accurate predictions and offering a foundation for further inquiry.` };
    case 'challenge':
      return { slotType: 'list', items: [`${title} may oversimplify edge cases`, 'Empirical support is thinner than claimed', 'Alternative explanations are underexplored', 'Assumes conditions that rarely hold in practice'] };
    default:
      return { slotType: 'body', content: `Transformed content for "${title}" via "${prompt.label}".` };
  }
}

export async function runPromptOnSlot(
  fragment: Fragment,
  prompt: PromptDefinition,
  targetSlotType: SlotType,
): Promise<PromptResult> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined;

  if (!apiKey) {
    await new Promise(resolve => setTimeout(resolve, 800));
    return getMockPromptResult(fragment, prompt);
  }

  try {
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
        max_tokens: 1000,
        system: PROMPT_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildPromptOnSlotMessage(fragment, prompt, targetSlotType) }],
      }),
    });

    if (!response.ok) {
      console.error('Prompt API error', response.status, '— falling back to mock');
      return getMockPromptResult(fragment, prompt);
    }

    const data = await response.json() as { content?: Array<{ text?: string }> };
    const text = data.content?.[0]?.text ?? '';
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    const cleaned = jsonStart !== -1 && jsonEnd > jsonStart ? text.slice(jsonStart, jsonEnd + 1) : text.trim();
    const parsed = JSON.parse(cleaned) as PromptResult;

    if (!parsed.slotType) {
      return getMockPromptResult(fragment, prompt);
    }

    return parsed;
  } catch (err) {
    console.error('Prompt run failed — falling back to mock:', err);
    return getMockPromptResult(fragment, prompt);
  }
}

export async function generatePivot(sourceFragment: Fragment, sourceClusterId: string): Promise<PivotResult> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined;

  if (!apiKey) {
    return buildPivotResult(getMockPivotResult(sourceFragment), sourceFragment, sourceClusterId);
  }

  try {
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
        max_tokens: 2000,
        system: PIVOT_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildPivotUserMessage(sourceFragment) }],
      }),
    });

    if (!response.ok) {
      console.error('Pivot API error', response.status, '— falling back to mock');
      return buildPivotResult(getMockPivotResult(sourceFragment), sourceFragment, sourceClusterId);
    }

    const data = await response.json() as { content?: Array<{ text?: string }> };
    const text = data.content?.[0]?.text ?? '';
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    const cleaned = jsonStart !== -1 && jsonEnd > jsonStart ? text.slice(jsonStart, jsonEnd + 1) : text.trim();
    const parsed = JSON.parse(cleaned) as PivotApiResponse;

    if (!parsed.clusterTitle || !Array.isArray(parsed.fragments) || parsed.fragments.length === 0) {
      console.error('Pivot response missing required fields — falling back to mock');
      return buildPivotResult(getMockPivotResult(sourceFragment), sourceFragment, sourceClusterId);
    }

    return buildPivotResult(parsed, sourceFragment, sourceClusterId);
  } catch (err) {
    console.error('Pivot generation failed — falling back to mock:', err);
    return buildPivotResult(getMockPivotResult(sourceFragment), sourceFragment, sourceClusterId);
  }
}
