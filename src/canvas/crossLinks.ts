import type { CrossLink } from '../api/types';

const CROSS_LINKS_KEY = 'webs_cross_links';

export function getCrossLinks(): CrossLink[] {
  try {
    const raw = localStorage.getItem(CROSS_LINKS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCrossLinks(links: CrossLink[]): void {
  try {
    localStorage.setItem(CROSS_LINKS_KEY, JSON.stringify(links));
    window.dispatchEvent(new CustomEvent('webs-cross-links-changed'));
  } catch { /* fire-and-forget */ }
}

export function addCrossLink(link: CrossLink): void {
  const links = getCrossLinks();
  links.push(link);
  saveCrossLinks(links);
}

export function updateCrossLinkLabel(linkId: string, label: string): void {
  const links = getCrossLinks();
  const link = links.find(l => l.id === linkId);
  if (!link) return;
  link.label = label;
  saveCrossLinks(links);
}

export function getCrossLinksForExploration(explorationId: string): CrossLink[] {
  return getCrossLinks().filter(
    l => l.explorationAId === explorationId || l.explorationBId === explorationId
  );
}
