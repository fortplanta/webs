/**
 * Fetch a representative image for a node title.
 *
 * Strategy:
 * 1. Wikipedia REST summary (fast, exact title match)
 * 2. Wikipedia search API (handles AI-generated/approximate titles,
 *    company names, famous people, geographic locations, etc.)
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
  const res = await fetch(
    `https://en.wikipedia.org/w/api.php?` +
    `action=query&generator=search&gsrsearch=${encodeURIComponent(title)}&gsrlimit=1` +
    `&prop=pageimages&piprop=thumbnail|original&pithumbsize=800` +
    `&format=json&origin=*`,
    { signal: AbortSignal.timeout(6000) }
  );
  if (!res.ok) return null;
  const data  = await res.json();
  const pages = data.query?.pages;
  if (!pages) return null;
  const page  = Object.values(pages)[0];
  return page?.original?.source ?? page?.thumbnail?.source ?? null;
}

export async function fetchNodeImage(title) {
  if (!title) return null;
  const key = title.trim().toLowerCase();
  if (cache.has(key)) return cache.get(key);

  let src = null;
  try {
    src = await fetchViaSummary(title);
  } catch { /* network error — fall through to search */ }

  if (!src) {
    try {
      src = await fetchViaSearch(title);
    } catch { /* search also failed */ }
  }

  cache.set(key, src);
  return src;
}
