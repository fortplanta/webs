/**
 * Fetch a representative image for a node title.
 *
 * Strategy:
 * 1. Wikipedia REST summary — fast, works for exact entity names
 *    (people, companies, places, well-known concepts)
 * 2. Wikipedia search → summary — handles AI-generated/narrative titles
 *    by finding the closest matching article, then pulling its image
 *
 * Free, no API key, CORS-enabled. Returns null if nothing found.
 */
const cache = new Map();

async function fetchViaSummary(title) {
  const slug = encodeURIComponent(title.trim().replace(/ /g, '_'));
  const res  = await fetch(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${slug}`,
    { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(5000) }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.originalimage?.source ?? data.thumbnail?.source ?? null;
}

async function fetchViaSearch(title) {
  // Step 1: find the closest matching Wikipedia article title
  const searchRes = await fetch(
    `https://en.wikipedia.org/w/api.php?action=query&list=search` +
    `&srsearch=${encodeURIComponent(title)}&srlimit=1&format=json&origin=*`,
    { signal: AbortSignal.timeout(6000) }
  );
  if (!searchRes.ok) return null;
  const searchData = await searchRes.json();
  const articleTitle = searchData.query?.search?.[0]?.title;
  if (!articleTitle) return null;

  // Step 2: fetch the image from that article's summary
  return fetchViaSummary(articleTitle);
}

export async function fetchNodeImage(title) {
  if (!title) return null;
  const key = title.trim().toLowerCase();
  if (cache.has(key)) return cache.get(key);

  let src = null;
  try {
    src = await fetchViaSummary(title);
  } catch { /* fall through */ }

  if (!src) {
    try {
      src = await fetchViaSearch(title);
    } catch { /* search also failed */ }
  }

  cache.set(key, src);
  return src;
}
