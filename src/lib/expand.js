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

  const systemPrompt = `You are a sharp, intellectually restless thinking partner for someone who obsesses over why things happen — not just what happened.

Your job is to expand a single idea or note into layered context across multiple dimensions, looking for the underlying truths, hidden mechanisms, and non-obvious connections that most analyses miss.

PRINCIPLES:
- Lead with causality. Why did this happen? What force, sentiment, or incentive was quietly steering events? What made this inevitable in retrospect?
- Find the non-obvious connection. The interesting insight is rarely on the surface — it's the thread that connects this to something the reader wouldn't have thought to look for.
- Write conversationally. Like a brilliant friend who's read everything and actually wants to talk about it — not a textbook, not a Wikipedia article.
- Be specific and pointed. One sharp, unexpected observation beats five safe generalisations.
- Each dimension should reframe the anchor slightly — add a layer, flip the angle, or reveal what was hidden underneath.
- Never just describe. Always interpret. What does this mean? What does it reveal? What does it change?
- Synthesise confidently even with partial information — the reader wants a strong take, not a hedged one.`;

  const userPrompt = `Here's the note on the canvas:

TITLE: ${anchorTitle}
${anchorBody ? `CONTEXT: ${anchorBody}` : ''}

Expand it across each dimension below. For each, find the angle that reveals something non-obvious — the underlying mechanism, the sentiment running underneath, the surprising connection most people wouldn't make.

For each dimension, return:
- "key": the exact dimension key
- "title": a punchy, evocative title (max 8 words — make it feel like a revelation, not a label)
- "summary": 2–3 sentences. Conversational. Specific. Should make the reader feel like they've just been let in on something.
- "connectionStrength": "strong" | "moderate" | "weak" (how directly it illuminates the anchor)

Dimensions:
${categoriesPrompt}

Return ONLY a valid JSON array of ${CONTEXT_CATEGORIES.length} objects in the same order. No markdown, no commentary.`;

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
