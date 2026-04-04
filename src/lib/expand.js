import { CONTEXT_CATEGORIES } from '../constants';

// Radial layout: places context nodes in a ring around the anchor
export function radialPositions(anchorPos, count, radius = 280) {
  const positions = [];
  for (let i = 0; i < count; i++) {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2;
    positions.push({
      x: anchorPos.x + radius * Math.cos(angle),
      y: anchorPos.y + radius * Math.sin(angle),
    });
  }
  return positions;
}

// Single Claude API call that returns all context categories at once
export async function expandAnchor(apiKey, anchorTitle, anchorBody) {
  const categoriesPrompt = CONTEXT_CATEGORIES.map(
    (c, i) => `${i + 1}. ${c.key} — ${c.prompt}`
  ).join('\n');

  const systemPrompt = `You are a brilliant, storytelling knowledge guide for curious, neurodivergent minds.
Your role is to expand a single idea or note into rich, cross-domain context across multiple dimensions.

IMPORTANT PRINCIPLES:
- Prioritise compelling narrative and vivid storytelling over exhaustive accuracy.
- Tiny historical details can be approximate; the larger story must feel true and alive.
- Each context should feel like a discovery — surprising, connected, human.
- Be concise but evocative. Write for someone who wants the full picture, not a textbook.
- Never say "I don't know" — synthesise the most likely and interesting interpretation.`;

  const userPrompt = `The user has added this note to their knowledge canvas:

TITLE: ${anchorTitle}
${anchorBody ? `DETAILS: ${anchorBody}` : ''}

Expand this into context across the following dimensions. For each, return a JSON object with:
- "key": the dimension key (exact, from the list)
- "title": a short, evocative title (max 8 words)
- "summary": 2-3 sentences of vivid, narrative context
- "connectionStrength": "strong" | "moderate" | "weak" (how directly connected to the anchor)

Dimensions:
${categoriesPrompt}

Return ONLY a valid JSON array of ${CONTEXT_CATEGORIES.length} objects, one per dimension, in the same order. No markdown, no commentary.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2400,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error ${response.status}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text ?? '';

  // Strip any accidental markdown fences
  const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
  const parsed = JSON.parse(cleaned);

  // Validate and normalise
  return CONTEXT_CATEGORIES.map((cat, i) => {
    const item = parsed[i] || {};
    return {
      key: cat.key,
      title: item.title || cat.label,
      summary: item.summary || '',
      connectionStrength: ['strong', 'moderate', 'weak'].includes(item.connectionStrength)
        ? item.connectionStrength
        : 'moderate',
    };
  });
}

// Generate Anki-style review cards from a revealed context node
export async function generateCards(apiKey, anchorTitle, contextTitle, contextSummary, categoryLabel) {
  const prompt = `Based on this knowledge connection:

ANCHOR: "${anchorTitle}"
CONTEXT (${categoryLabel}): "${contextTitle}"
SUMMARY: "${contextSummary}"

Generate 2 review cards. Each card should test a genuine insight or connection — not trivial recall.
Return ONLY a JSON array of objects with:
- "type": "connection" | "context" | "reversal"
- "question": a clear, specific question (max 20 words)
- "answer": the answer in 1-3 sentences

No markdown. Just the JSON array.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) return [];
  const data = await response.json();
  const text = data.content?.[0]?.text ?? '';
  const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return [];
  }
}
