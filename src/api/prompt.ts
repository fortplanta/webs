// Prompt construction for Webs AI generation.
// Kept separate from fetch logic in generate.ts.

import { Fragment, SlotType } from './types';
import { PromptDefinition } from '../prompts/prompts';

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
          "type": "person | concept | thesis | source | event | era | domain | quote",
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
- Return exactly 4 clusters (no more, no fewer)
- Return exactly 3 fragments per cluster (12 fragments total)
- Every fragment must have a "body" field with 2-4 sentences of meaningful content
- Fragment types: person, concept, thesis, source, event, era, domain, quote
  Fragment type guide — choose carefully based on what each fragment actually IS:
  · "person"  — a specific individual (scholar, leader, artist, scientist, thinker)
  · "concept" — an idea, theory, framework, or movement
  · "thesis"  — a contested claim, argument, or proposition
  · "source"  — a specific book, paper, film, or primary document
  · "event"   — a specific historical happening, turning point, or occurrence
  · "era"     — a period, epoch, age, or decade
  · "domain"  — a field of study or broad area of knowledge
  · "quote"   — a verbatim quotation; body = quote text + "— Author, Work, Year"
  IMPORTANT: Use a diverse mix of types across clusters. Most clusters should contain at least 2–3 different types. Do NOT make everything "concept" — use "person", "event", "era", "source", "thesis", and "quote" wherever they are more accurate.
- "tags": required on all fragments except type "quote". 2-4 tags, lowercase, short words.
- "list": optional. Only include for concept, thesis, domain, source fragments. 3-6 items if used.
- "era": only for event and era fragment types. A year or short date range like "1789" or "1914–1918".
- "historicalEra": optional for ALL fragment types. If the fragment relates to a specific historical period, include a short year/range/era (e.g. "1066", "1789–1799", "300 BCE", "1960s"). Omit if conceptual or contemporary with no clear historical anchor.
- Quote fragments: body field only (verbatim quote + attribution). No tags, no list, no era.
- Edge labels must be verb phrases, not nouns: "shaped by", "resulted in", "challenged by", "enabled", "inspired".
- Edge source and target must EXACTLY match cluster titles in your response.
- Do not include image fields.
- Return raw JSON only. No markdown. No code fences. Start with { and end with }.`;
}

export const PROMPT_SYSTEM_PROMPT = `You are a knowledge assistant. The user gives you a fragment of knowledge and a transformation prompt. You return a JSON object with updated slot content.

CRITICAL: Return ONLY valid JSON. No markdown code fences. No preamble. No explanation. Your response must start with { and end with }.`;

export function buildPromptOnSlotMessage(
  fragment: Fragment,
  prompt: PromptDefinition,
  targetSlotType: SlotType,
): string {
  const bodySlot = fragment.slots.find(s => s.type === 'body');
  const body = bodySlot?.content ?? '';

  const slotInstructions: Record<string, string> = {
    'explain-simple': `Rewrite the body content so a five-year-old could understand it. Keep it short, concrete, and vivid. Return slotType "body" and a "content" string.`,
    'visual-learning': `Rewrite the body content using vivid sensory language — imagery, metaphor, texture, and feeling. Make it memorable. Return slotType "body" and a "content" string.`,
    'fact-check': `Evaluate the factual claims in the fragment. Return slotType "${targetSlotType}" — if "body", summarise accuracy and caveats; if "disclaimer", write a 1-2 sentence factual caveat. Return a "content" string.`,
    'find-similarities': `List 4–6 things this fragment connects to, across disciplines or domains. Return slotType "list" and an "items" array of short strings.`,
    'steelman': `Write the strongest possible case for the idea in this fragment. Be charitable and rigorous. Return slotType "body" and a "content" string.`,
    'challenge': `Identify the weakest points or strongest objections to the idea in this fragment. Return slotType "${targetSlotType}" — if "list", give 3–5 crisp objections as an "items" array; if "body", write a short critical paragraph as "content".`,
  };

  const instruction = slotInstructions[prompt.id] ?? `Apply the "${prompt.label}" transformation to this fragment's content.`;

  return `Fragment title: "${fragment.title}"
Fragment type: ${fragment.type}
Body: "${body}"

Task: ${instruction}

Return ONLY valid JSON matching this shape:
{
  "slotType": "${targetSlotType}",
  "content": "string — omit if producing items",
  "items": ["array", "of", "strings", "— omit if producing content"]
}

Return raw JSON only. Start with { and end with }.`;
}

export const PIVOT_SYSTEM_PROMPT = `You are a knowledge canvas generator. The user gives you a fragment of knowledge and you return a JSON object describing a new cluster of related intellectual fragments.

CRITICAL: Return ONLY valid JSON. No markdown code fences. No preamble. No explanation. No trailing text. Your response must start with { and end with }.`;

export function buildPivotUserMessage(fragment: Fragment): string {
  const bodySlot = fragment.slots.find(s => s.type === 'body');
  const body = bodySlot?.content ?? '';

  return `Source fragment:
Title: "${fragment.title}"
Type: ${fragment.type}
Body: "${body}"

Generate 3–5 related fragments that explore a different angle or go deeper on this idea. Return ONLY valid JSON matching this exact shape:

{
  "clusterTitle": "2-4 word cluster title",
  "fragments": [
    {
      "type": "concept",
      "title": "fragment title (2-5 words, lowercase)",
      "body": "2-4 sentences of substantive content",
      "tags": ["tag1", "tag2"],
      "list": ["optional item 1", "optional item 2"],
      "era": "optional year or date range"
    }
  ],
  "edgeLabel": "verb phrase connecting source to this cluster"
}

Rules:
- Return 3 to 5 fragments
- Every fragment must have a "body" field with 2-4 sentences of meaningful content
- Fragment types: person, concept, thesis, source, event, era, domain, quote
- "tags": required on all fragments except type "quote". 2-4 tags, lowercase, short words.
- "list": optional. Only include for concept, thesis, domain, source fragments. 3-6 items if used.
- "era": only for event and era fragment types. A year or short date range.
- Quote fragments: body field only (verbatim quote + attribution). No tags, no list, no era.
- edgeLabel must be a verb phrase: "inspired by", "explored through", "connects to", "challenges", "expands on".
- Different angle from source — not a repeat. Meaningfully related but exploring new territory.
- Return raw JSON only. No markdown. No code fences. Start with { and end with }.`;
}
