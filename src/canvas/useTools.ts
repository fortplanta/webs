import { useState, useEffect, useCallback } from 'react';

export type ActiveTool = 'select' | 'text';

export function useTools() {
  const [activeTool, setActiveTool] = useState<ActiveTool>('select');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      // Don't switch tools while typing in any input
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true' ||
        target.closest('.connector-label-fo')
      ) return;

      if (e.key === 'v' || e.key === 'V') setActiveTool('select');
      if (e.key === 't' || e.key === 'T') setActiveTool('text');
      if (e.key === 'Escape') setActiveTool('select');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const switchTo = useCallback((tool: ActiveTool) => setActiveTool(tool), []);

  return { activeTool, switchTo };
}
