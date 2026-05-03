import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AppState, TabSession } from '../api/types';
import {
  loadAppState,
  saveAppState,
  saveCanvasState,
  updateProjectMeta,
} from '../storage/storage';
import { EMPTY_CANVAS_STATE } from '../canvas/useCanvas';

const MAX_TABS = 20;

function makeTabSession(id: string, name: string): TabSession {
  return { id, name, isLoaded: false, isActive: false };
}

function initAppState(): AppState {
  const saved = loadAppState();
  if (saved && saved.tabs.length > 0) return saved;

  // First ever load — seed with empty canvas (user will enter a query)
  const id = uuidv4();
  const now = Date.now();
  const canvasState = { ...EMPTY_CANVAS_STATE, createdAt: now };
  saveCanvasState(id, canvasState);
  updateProjectMeta({ id, name: 'exploration 1', createdAt: now, updatedAt: now });
  const initial: AppState = {
    tabs: [makeTabSession(id, 'exploration 1')],
    activeTabId: id,
  };
  saveAppState(initial);
  return initial;
}

export function useTabs() {
  const [appState, setAppState] = useState<AppState>(initAppState);

  const persist = useCallback((next: AppState) => {
    setAppState(next);
    saveAppState(next);
  }, []);

  const switchTab = useCallback((id: string) => {
    setAppState(prev => {
      if (prev.activeTabId === id) return prev;
      const next = { ...prev, activeTabId: id };
      saveAppState(next);
      return next;
    });
  }, []);

  const addTab = useCallback(() => {
    setAppState(prev => {
      if (prev.tabs.length >= MAX_TABS) return prev;
      const id = uuidv4();
      const name = `exploration ${prev.tabs.length + 1}`;
      const now = Date.now();
      const canvasState = { ...EMPTY_CANVAS_STATE, createdAt: now };
      saveCanvasState(id, canvasState);
      updateProjectMeta({ id, name, createdAt: now, updatedAt: now });
      const next: AppState = {
        tabs: [...prev.tabs, makeTabSession(id, name)],
        activeTabId: id,
      };
      saveAppState(next);
      return next;
    });
  }, []);

  const closeTab = useCallback((id: string) => {
    setAppState(prev => {
      if (prev.tabs.length <= 1) return prev;
      const remaining = prev.tabs.filter(t => t.id !== id);
      const activeTabId =
        prev.activeTabId === id
          ? remaining[Math.max(0, prev.tabs.findIndex(t => t.id === id) - 1)].id
          : prev.activeTabId;
      const next: AppState = { tabs: remaining, activeTabId };
      saveAppState(next);
      return next;
    });
  }, []);

  const openProject = useCallback((id: string, name: string) => {
    setAppState(prev => {
      if (prev.tabs.some(t => t.id === id)) {
        const next = { ...prev, activeTabId: id };
        saveAppState(next);
        return next;
      }
      if (prev.tabs.length >= MAX_TABS) return prev;
      const next: AppState = {
        tabs: [...prev.tabs, makeTabSession(id, name)],
        activeTabId: id,
      };
      saveAppState(next);
      return next;
    });
  }, []);

  const renameTab = useCallback((id: string, name: string) => {
    setAppState(prev => {
      const next: AppState = {
        ...prev,
        tabs: prev.tabs.map(t => t.id === id ? { ...t, name } : t),
      };
      saveAppState(next);
      updateProjectMeta({
        id,
        name,
        createdAt: 0,
        updatedAt: Date.now(),
      });
      return next;
    });
  }, []);

  return {
    tabs: appState.tabs,
    activeTabId: appState.activeTabId,
    canAddTab: appState.tabs.length < MAX_TABS,
    switchTab,
    addTab,
    openProject,
    closeTab,
    renameTab,
    persist,
  };
}
