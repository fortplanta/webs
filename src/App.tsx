import { useState, useMemo } from 'react';
import './styles/webs-tokens.css';
import './styles/index.css';
import './styles/canvas.css';
import './styles/fragments.css';
import './styles/ui.css';
import './styles/tabs.css';
import { Fragment } from './api/types';
import Canvas from './canvas/Canvas';
import { INITIAL_STATE } from './canvas/useCanvas';
import TabStrip from './tabs/TabStrip';
import { useTabs } from './tabs/useTabs';
import { loadCanvasState } from './storage/storage';

export default function App() {
  const { tabs, activeTabId, canAddTab, switchTab, addTab, closeTab, renameTab } = useTabs();
  const [copiedFragment, setCopiedFragment] = useState<Fragment | null>(null);

  const activeInitialState = useMemo(
    () => loadCanvasState(activeTabId) ?? INITIAL_STATE,
    // Only recompute when active tab changes — Canvas remounts via key prop
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeTabId],
  );

  const handleClose = (id: string) => {
    const canvasState = loadCanvasState(id);
    const hasContent = canvasState && (
      canvasState.fragments.length > 0 || canvasState.clusters.length > 0
    );
    if (hasContent && !window.confirm('Close this exploration? It will remain in your library.')) {
      return;
    }
    closeTab(id);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <TabStrip
        tabs={tabs}
        activeTabId={activeTabId}
        canAdd={canAddTab}
        onSwitch={switchTab}
        onClose={handleClose}
        onAdd={addTab}
        onRename={renameTab}
      />
      <Canvas
        key={activeTabId}
        projectId={activeTabId}
        initialState={activeInitialState}
        copiedFragment={copiedFragment}
        onFragmentCopy={setCopiedFragment}
        onFragmentPaste={() => setCopiedFragment(null)}
      />
    </div>
  );
}
