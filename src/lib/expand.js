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

// Legacy helper kept for compatibility. Active LLM calls live in src/api/llm.ts.
export async function expandAnchor() {
  return CONTEXT_CATEGORIES.map(cat => ({
    key: cat.key,
    title: cat.label,
    summary: '',
    connectionStrength: 'moderate',
  }));
}

// Generate Anki-style review cards from a revealed context node
export async function generateCards() {
  return [];
}
