import { useState, useCallback, useRef } from 'react';

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
  // Ref mirrors state so finishRect can read synchronously (React 18 batching makes
  // state updater callbacks run async — reading from state in the callback would return null)
  const rectRef = useRef<SelectionRect | null>(null);

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
    const r = { startX: x, startY: y, endX: x, endY: y };
    rectRef.current = r;
    setSelectionRect(r);
  }, []);

  const updateRect = useCallback((x: number, y: number) => {
    if (!rectRef.current) return;
    rectRef.current = { ...rectRef.current, endX: x, endY: y };
    setSelectionRect(rectRef.current);
  }, []);

  const finishRect = useCallback((): SelectionRect | null => {
    const result = rectRef.current;
    rectRef.current = null;
    setSelectionRect(null);
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
