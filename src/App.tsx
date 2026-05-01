import { useState, useEffect } from 'react';
import './styles/webs-tokens.css';
import './styles/index.css';
import './styles/canvas.css';
import './styles/fragments.css';
import './styles/ui.css';
import './styles/tabs.css';
import { CanvasState, Fragment } from './api/types';
import { generateCanvas } from './api/generate';
import { EMPTY_CANVAS_STATE } from './canvas/useCanvas';
import Canvas from './canvas/Canvas';
import CanvasBackground from './canvas/CanvasBackground';
import TabStrip from './tabs/TabStrip';
import { useTabs } from './tabs/useTabs';
import { loadCanvasState, saveCanvasState } from './storage/storage';
import SearchInput from './ui/SearchInput';
import LoadingCanvas from './ui/LoadingCanvas';

const STATIC_TRANSFORM = { x: 0, y: 0, zoom: 1 };

export default function App() {
  const { tabs, activeTabId, canAddTab, switchTab, addTab, closeTab, renameTab } = useTabs();
  const [copiedFragment, setCopiedFragment] = useState<Fragment | null>(null);

  const [tabState, setTabState] = useState<CanvasState>(() =>
    loadCanvasState(activeTabId) ?? EMPTY_CANVAS_STATE
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [currentQuery, setCurrentQuery] = useState('');

  // When the active tab changes, load its saved state
  useEffect(() => {
    setTabState(loadCanvasState(activeTabId) ?? EMPTY_CANVAS_STATE);
    setIsGenerating(false);
    setGenerateError(null);
  }, [activeTabId]);

  const handleQuery = async (query: string) => {
    setCurrentQuery(query);
    setIsGenerating(true);
    setGenerateError(null);
    try {
      const state = await generateCanvas(query);
      saveCanvasState(activeTabId, state);
      renameTab(activeTabId, query.slice(0, 40));
      setTabState(state);
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

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

  const isEmpty = tabState.clusters.length === 0;

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
      <div className="canvas-area">
        {/* Static dot grid shown only when Canvas is not active */}
        {isEmpty && <CanvasBackground transform={STATIC_TRANSFORM} />}
        {isEmpty && !isGenerating && !generateError && (
          <SearchInput onSubmit={handleQuery} />
        )}
        {isEmpty && (isGenerating || generateError) && (
          <LoadingCanvas
            query={currentQuery}
            error={generateError}
            onRetry={() => handleQuery(currentQuery)}
          />
        )}
        {!isEmpty && (
          <Canvas
            key={activeTabId}
            projectId={activeTabId}
            initialState={tabState}
            copiedFragment={copiedFragment}
            onFragmentCopy={setCopiedFragment}
            onFragmentPaste={() => setCopiedFragment(null)}
          />
        )}
      </div>
    </div>
  );
}
