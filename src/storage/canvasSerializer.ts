import { CanvasState } from '../api/types';

export function serialize(state: CanvasState): string {
  return JSON.stringify(state);
}

export function deserialize(raw: string): CanvasState | null {
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    if (!Array.isArray(parsed.clusters)) return null;
    if (!Array.isArray(parsed.fragments)) return null;
    if (!Array.isArray(parsed.connectors)) return null;
    if (!parsed.viewport || typeof parsed.viewport.zoom !== 'number') return null;
    return JSON.parse(JSON.stringify(parsed)) as CanvasState;
  } catch {
    return null;
  }
}
