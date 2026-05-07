import { useState, useCallback } from 'react';

export type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

export const MIN_FRAGMENT_WIDTH = 200;
export const MAX_FRAGMENT_WIDTH = 640;

export interface SelectionRect {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export function useSelection() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null);

  const selectId = useCallback((id: string, add = false) => {
    if (add) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    } else {
      setSelectedIds(new Set([id]));
    }
  }, []);

  const deselectAll = useCallback(() => setSelectedIds(new Set()), []);

  const selectMany = useCallback((ids: string[]) => setSelectedIds(new Set(ids)), []);

  const startRect = useCallback((x: number, y: number) => {
    setSelectionRect({ startX: x, startY: y, endX: x, endY: y });
  }, []);

  const updateRect = useCallback((x: number, y: number) => {
    setSelectionRect(prev => prev ? { ...prev, endX: x, endY: y } : null);
  }, []);

  const finishRect = useCallback((): SelectionRect | null => {
    let result: SelectionRect | null = null;
    setSelectionRect(prev => { result = prev; return null; });
    return result;
  }, []);

  return {
    selectedIds,
    selectionRect,
    selectId,
    deselectAll,
    selectMany,
    startRect,
    updateRect,
    finishRect,
  };
}
