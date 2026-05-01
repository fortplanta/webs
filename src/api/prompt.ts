// Prompt construction for Webs AI generation.
// Kept separate from fetch logic in generate.ts.

export const SYSTEM_PROMPT = `You are a knowledge canvas generator. The user gives you a topic and you return a JSON object describing interconnected clusters of intellectual fragments.

CRITICAL: Return ONLY valid JSON. No markdown code fences. No preamble. No explanation. No trailing text. Your response must start with { and end with }.`;

export function buildUserMessage(query: string): string {
  return `Topic: "${query}"

Return ONLY valid JSON matching this exact shape:

{
  "context": "2-3 sentences grounding the topic — used as the seed node body",
  "clusters": [
    {
      "title": "cluster theme (2-4 words)",
      "fragments": [
        {
          "type": "concept",
          "title": "fragment title (2-5 words, lowercase)",
          "body": "2-4 sentences of substantive content",
          "tags": ["tag1", "tag2", "tag3"],
          "list": ["optional item 1", "optional item 2"],
          "era": "optional year or date range"
        }
      ]
    }
  ],
  "edges": [
    {
      "source": "cluster title — must exactly match a cluster title above",
      "target": "cluster title — must exactly match a cluster title above",
      "label": "verb phrase"
    }
  ]
}

Rules:
- Return 5 to 7 clusters
- Return 3 to 5 fragments per cluster
- Every fragment must have a "body" field with 2-4 sentences of meaningful content
- Fragment types: person, concept, thesis, source, event, era, domain, quote
- "tags": required on all fragments except type "quote". 2-4 tags, lowercase, short words.
- "list": optional. Only include for concept, thesis, domain, source fragments. 3-6 items if used.
- "era": only for event and era fragment types. A year or short date range like "1789" or "1914–1918".
- Quote fragments: body field only (verbatim quote + attribution). No tags, no list, no era.
- Edge labels must be verb phrases, not nouns: "shaped by", "resulted in", "challenged by", "enabled", "inspired".
- Edge source and target must EXACTLY match cluster titles in your response.
- Do not include image fields.
- Return raw JSON only. No markdown. No code fences. Start with { and end with }.`;
}
