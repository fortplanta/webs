/**
 * Calls Claude to identify technical concepts and hard vocabulary in a text,
 * returning a { term: definition } map. Results are cached per text block.
 */
const cache = new Map();

export async function explainTerms(apiKey, text) {
  if (!text || !apiKey) return {};
  if (cache.has(text)) return cache.get(text);

  const prompt = `Analyze the following text and identify up to 8 terms that might need explanation for an interested but non-specialist reader:
- Technical concepts (e.g. "Bayesian thinking", "supply chain elasticity")
- Proper nouns that aren't common knowledge (e.g. specific historical movements, organisations)
- Advanced or uncommon vocabulary (e.g. "axiomatic", "anthropogenic", "hegemonic")

TEXT: "${text}"

Return ONLY a JSON object where each key is the exact term as it appears in the text (preserve capitalisation and spacing), and each value is a single clear sentence of explanation in simple, plain English. If there are no such terms, return {}.

No markdown. Just the JSON object.`;

  try {
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

    if (!response.ok) return {};
    const data = await response.json();
    const raw = data.content?.[0]?.text ?? '{}';
    const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim();
    const result = JSON.parse(cleaned);
    cache.set(text, result);
    return result;
  } catch {
    return {};
  }
}
