import { AppState, CanvasState, ProjectMeta } from '../api/types';
import { serialize, deserialize } from './canvasSerializer';

const KEY_APP_STATE = 'webs-app-state';
const KEY_PROJECTS_INDEX = 'webs-projects-index';

function canvasKey(projectId: string): string {
  return `webs-canvas-${projectId}`;
}

export function loadAppState(): AppState | null {
  try {
    const raw = localStorage.getItem(KEY_APP_STATE);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.tabs) || !parsed.activeTabId) return null;
    return parsed as AppState;
  } catch {
    return null;
  }
}

export function saveAppState(state: AppState): void {
  try {
    localStorage.setItem(KEY_APP_STATE, JSON.stringify(state));
  } catch { /* fire-and-forget */ }
}

export function loadCanvasState(projectId: string): CanvasState | null {
  try {
    const raw = localStorage.getItem(canvasKey(projectId));
    if (!raw) return null;
    return deserialize(raw);
  } catch {
    return null;
  }
}

export function saveCanvasState(projectId: string, state: CanvasState): void {
  try {
    localStorage.setItem(canvasKey(projectId), serialize(state));
  } catch { /* fire-and-forget */ }
}

export function loadProjectsIndex(): ProjectMeta[] {
  try {
    const raw = localStorage.getItem(KEY_PROJECTS_INDEX);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveProjectsIndex(projects: ProjectMeta[]): void {
  try {
    localStorage.setItem(KEY_PROJECTS_INDEX, JSON.stringify(projects));
  } catch { /* fire-and-forget */ }
}

export function updateProjectMeta(meta: ProjectMeta): void {
  const index = loadProjectsIndex();
  const existing = index.findIndex(p => p.id === meta.id);
  if (existing >= 0) {
    index[existing] = meta;
  } else {
    index.push(meta);
  }
  saveProjectsIndex(index);
}
