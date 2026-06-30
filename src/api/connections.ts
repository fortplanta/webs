// Connection evaluation and validation API calls for the Session 32 gamification layer.
// Three tiers: obvious (auto-label, small score), non-obvious-user (user explains, large score),
// non-obvious-claude (LLM finds it, medium score).

import type { Fragment } from './types';
import { callLlm, isLlmEnabled } from './llm';

const POINT_VALUES = {
  obvious:          { min: 10,  max: 30  },
  nonObviousUser:   { min: 100, max: 300 },
  nonObviousClaude: { min: 50,  max: 150 },
};

function lerp(t: number, min: number, max: number): number {
  return Math.round(min + t * (max - min));
}

// ─── Mock helpers ─────────────────────────────────────────────────────────────

function mockEvaluation(source: Fragment, target: Fragment): ConnectionTier {
  // Same cluster = usually obvious; different clusters, different types = non-obvious
  const sameCluster = source.clusterId === target.clusterId;
  return sameCluster ? 'obvious' : 'non-obvious-user';
}

function mockValidation(explanation: string): {
  isValid: boolean; points: number; explanation: string; context?: string;
} {
  const originality = Math.random();
  return {
    isValid: true,
    points: lerp(originality, POINT_VALUES.nonObviousUser.min, POINT_VALUES.nonObviousUser.max),
    explanation: `That's a compelling connection. ${explanation} reveals a structural parallel that's easy to miss.`,
    context: 'This kind of lateral link often points to shared underlying mechanisms worth exploring further.',
  };
}

function mockFind(source: Fragment, target: Fragment): { found: boolean; explanation?: string; points?: number } {
  const originality = 0.3 + Math.random() * 0.5;
  return {
    found: true,
    explanation: `Both "${source.title}" and "${target.title}" emerge from the same historical tension between centralised control and emergent order.`,
    points: lerp(originality, POINT_VALUES.nonObviousClaude.min, POINT_VALUES.nonObviousClaude.max),
  };
}

function mockSuggestion(): { title: string; explanation: string } {
  return {
    title: 'the emergence of invisible infrastructure',
    explanation: 'Your connections keep returning to the gap between visible cause and invisible effect. This exploration might surface more of that pattern.',
  };
}

// ─── API helpers ──────────────────────────────────────────────────────────────

async function callConnectionLlm(
  systemPrompt: string,
  userMessage: string,
  maxTokens = 400,
): Promise<string> {
  return callLlm({
    system: systemPrompt,
    user: userMessage,
    maxTokens,
    json: maxTokens > 20,
  });
}

function extractJson(text: string): unknown {
  const start = text.indexOf('{');
  const end   = text.lastIndexOf('}');
  if (start === -1 || end <= start) throw new Error('no-json');
  return JSON.parse(text.slice(start, end + 1));
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function evaluateConnectionTier(
  source: Fragment,
  target: Fragment,
): Promise<'obvious' | 'non-obvious'> {
  if (!isLlmEnabled()) {
    await new Promise(r => setTimeout(r, 600));
    const tier = mockEvaluation(source, target);
    return tier === 'obvious' ? 'obvious' : 'non-obvious';
  }

  const srcBody = source.slots.find(s => s.type === 'body')?.content ?? '';
  const tgtBody = target.slots.find(s => s.type === 'body')?.content ?? '';

  const system = 'You classify connections between knowledge fragments. Respond with only the word "obvious" or "non-obvious". Nothing else.';
  const message = `Fragment A: "${source.title}" (${source.type}) — ${srcBody.slice(0, 200)}

Fragment B: "${target.title}" (${target.type}) — ${tgtBody.slice(0, 200)}

Is the relationship between these two fragments OBVIOUS (a well-known historical connection, direct causal chain, or commonly understood relationship most people would immediately recognise) or NON-OBVIOUS (an unexpected, lateral, or creative connection that requires original thinking to see)?`;

  try {
    const text = await callConnectionLlm(system, message, 10);
    return text.trim().toLowerCase().startsWith('non') ? 'non-obvious' : 'obvious';
  } catch {
    return mockEvaluation(source, target) === 'obvious' ? 'obvious' : 'non-obvious';
  }
}

export async function validateUserExplanation(
  source: Fragment,
  target: Fragment,
  userExplanation: string,
): Promise<{ isValid: boolean; points: number; explanation: string; context?: string }> {
  if (!isLlmEnabled()) {
    await new Promise(r => setTimeout(r, 1000));
    return mockValidation(userExplanation);
  }

  const srcBody = source.slots.find(s => s.type === 'body')?.content ?? '';
  const tgtBody = target.slots.find(s => s.type === 'body')?.content ?? '';

  const system = 'You assess whether a user\'s explanation of a connection between two knowledge fragments is valid and original. Return only valid JSON — no markdown, no explanation. Must start with { and end with }.';
  const message = `Fragment A: "${source.title}" (${source.type}) — ${srcBody.slice(0, 300)}

Fragment B: "${target.title}" (${target.type}) — ${tgtBody.slice(0, 300)}

User's explanation: "${userExplanation}"

Assess this explanation. Return:
{
  "isValid": true or false,
  "originality": 0.0 to 1.0 (how non-obvious and original this connection is),
  "explanation": "1-2 sentences about why this connection is interesting",
  "context": "optional 1 sentence of additional context or null"
}`;

  try {
    const text = await callConnectionLlm(system, message, 300);
    const parsed = extractJson(text) as {
      isValid?: boolean;
      originality?: number;
      explanation?: string;
      context?: string | null;
    };
    const originality = typeof parsed.originality === 'number' ? Math.max(0, Math.min(1, parsed.originality)) : 0.5;
    return {
      isValid: parsed.isValid !== false,
      points: lerp(originality, POINT_VALUES.nonObviousUser.min, POINT_VALUES.nonObviousUser.max),
      explanation: String(parsed.explanation ?? 'An interesting non-obvious connection.'),
      context: parsed.context ? String(parsed.context) : undefined,
    };
  } catch {
    return mockValidation(userExplanation);
  }
}

export async function findConnection(
  source: Fragment,
  target: Fragment,
): Promise<{ found: boolean; explanation?: string; points?: number }> {
  if (!isLlmEnabled()) {
    await new Promise(r => setTimeout(r, 1200));
    return mockFind(source, target);
  }

  const srcBody = source.slots.find(s => s.type === 'body')?.content ?? '';
  const tgtBody = target.slots.find(s => s.type === 'body')?.content ?? '';

  const system = 'You search for a valid connection between two knowledge fragments. Return only valid JSON — no markdown, no explanation. Must start with { and end with }.';
  const message = `Fragment A: "${source.title}" (${source.type}) — ${srcBody.slice(0, 300)}

Fragment B: "${target.title}" (${target.type}) — ${tgtBody.slice(0, 300)}

Search for any valid intellectual, historical, causal, or structural connection between these two fragments. If found:
{
  "found": true,
  "originality": 0.0 to 1.0,
  "explanation": "1-2 sentences describing the connection"
}
If no valid connection exists:
{
  "found": false
}`;

  try {
    const text = await callConnectionLlm(system, message, 300);
    const parsed = extractJson(text) as {
      found?: boolean;
      originality?: number;
      explanation?: string;
    };
    if (!parsed.found) return { found: false };
    const originality = typeof parsed.originality === 'number' ? Math.max(0, Math.min(1, parsed.originality)) : 0.4;
    return {
      found: true,
      explanation: String(parsed.explanation ?? 'A connection was found.'),
      points: lerp(originality, POINT_VALUES.nonObviousClaude.min, POINT_VALUES.nonObviousClaude.max),
    };
  } catch {
    return mockFind(source, target);
  }
}

export interface Suggestion {
  title: string;
  explanation: string;
}

export async function generateSuggestion(
  tier2Connections: Array<{ sourceTitle: string; targetTitle: string; explanation: string }>,
  _fragmentTitles: string[],
): Promise<Suggestion> {
  if (!isLlmEnabled()) {
    await new Promise(r => setTimeout(r, 800));
    return mockSuggestion();
  }

  const connectionSummary = tier2Connections
    .slice(-10) // last 10 non-obvious connections
    .map(c => `"${c.sourceTitle}" ↔ "${c.targetTitle}": ${c.explanation}`)
    .join('\n');

  const system = 'You suggest new explorations based on a user\'s non-obvious connection patterns. Return only valid JSON — no markdown. Must start with { and end with }.';
  const message = `Based on these non-obvious connections the user has discovered:

${connectionSummary}

Suggest a new exploration topic that fits the pattern of lateral thinking this user exhibits. Return:
{
  "title": "the suggested exploration topic (lowercase, evocative, 3-7 words)",
  "explanation": "1-2 sentences explaining why this fits how this user thinks"
}`;

  try {
    const text = await callConnectionLlm(system, message, 200);
    const parsed = extractJson(text) as { title?: string; explanation?: string };
    return {
      title: String(parsed.title ?? 'unexpected connections'),
      explanation: String(parsed.explanation ?? 'Based on the pattern of connections you\'ve been making.'),
    };
  } catch {
    return mockSuggestion();
  }
}

// Auto-label for obvious connections — reuses existing approach but returns just the label
export async function generateObviousLabel(
  source: Fragment,
  target: Fragment,
): Promise<string> {
  if (!isLlmEnabled()) {
    const labels = ['led to', 'shaped', 'enabled', 'responded to', 'built on', 'challenged'];
    return labels[Math.floor(Math.random() * labels.length)];
  }

  const system = 'You label relationships between knowledge fragments. Return only a 2–4 word verb phrase (lowercase). Nothing else.';
  const message = `Fragment A: "${source.title}" (${source.type})
Fragment B: "${target.title}" (${target.type})
What is the relationship from A to B? (e.g. "led to", "was shaped by", "challenged", "enabled")`;

  try {
    const text = await callConnectionLlm(system, message, 20);
    return text.trim().replace(/[".]/g, '').slice(0, 40) || 'relates to';
  } catch {
    return 'relates to';
  }
}
