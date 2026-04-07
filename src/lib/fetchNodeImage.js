/**
 * Fetch a representative image for a node title using the Wikipedia REST API.
 * Free, no API key, CORS-enabled. Returns null if nothing is found.
 */
const cache = new Map();

export async function fetchNodeImage(title) {
  if (!title) return null;
  const key = title.trim().toLowerCase();
  if (cache.has(key)) return cache.get(key);

  try {
    const slug = encodeURIComponent(title.trim().replace(/ /g, '_'));
    const res  = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${slug}`,
      {
        headers: { Accept: 'application/json' },
        signal:  AbortSignal.timeout(5000),
      }
    );
    if (!res.ok) { cache.set(key, null); return null; }

    const data = await res.json();
    // Prefer the larger original, fall back to thumbnail
    const src = data.originalimage?.source ?? data.thumbnail?.source ?? null;
    cache.set(key, src);
    return src;
  } catch {
    cache.set(key, null);
    return null;
  }
}
