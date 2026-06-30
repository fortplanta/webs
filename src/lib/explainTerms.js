/**
 * Legacy no-network term explainer. Active LLM calls live in src/api/llm.ts.
 * returning a { term: definition } map. Results are cached per text block.
 */
const cache = new Map();

export async function explainTerms(apiKey, text) {
  if (!text || !apiKey) return {};
  if (cache.has(text)) return cache.get(text);
  cache.set(text, {});
  return {};
}
