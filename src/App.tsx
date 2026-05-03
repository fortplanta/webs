import { useState, useEffect } from 'react';
import './styles/webs-tokens.css';
import './styles/index.css';
import './styles/canvas.css';
import './styles/fragments.css';
import './styles/ui.css';
import './styles/tabs.css';
import './styles/sidebar.css';
import './styles/library.css';
import { CanvasState, Fragment, ProjectMeta } from './api/types';
import { generateCanvas } from './api/generate';
import { EMPTY_CANVAS_STATE } from './canvas/useCanvas';
import Canvas from './canvas/Canvas';
import CanvasBackground from './canvas/CanvasBackground';
import TabStrip from './tabs/TabStrip';
import { useTabs } from './tabs/useTabs';
import { loadCanvasState, saveCanvasState, updateProjectMeta, loadProjectsIndex } from './storage/storage';
import SearchInput from './ui/SearchInput';
import LoadingCanvas from './ui/LoadingCanvas';
import Sidebar from './ui/Sidebar';
import LibraryView from './ui/LibraryView';

const STATIC_TRANSFORM = { x: 0, y: 0, zoom: 1 };

export default function App() {
  const { tabs, activeTabId, canAddTab, switchTab, addTab, openProject, closeTab, renameTab } = useTabs();
  const [copiedFragment, setCopiedFragment] = useState<Fragment | null>(null);

  const [tabState, setTabState] = useState<CanvasState>(() =>
    loadCanvasState(activeTabId) ?? EMPTY_CANVAS_STATE
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [currentQuery, setCurrentQuery] = useState('');

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [projectsMeta, setProjectsMeta] = useState<ProjectMeta[]>(() => loadProjectsIndex());

  // When the active tab changes, load its saved state
  useEffect(() => {
    setTabState(loadCanvasState(activeTabId) ?? EMPTY_CANVAS_STATE);
    setIsGenerating(false);
    setGenerateError(null);
  }, [activeTabId]);

  // Keyboard shortcuts: ⌘L / Ctrl+L toggles library; Escape closes it
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'l') {
        e.preventDefault();
        setLibraryOpen(prev => !prev);
      }
      if (e.key === 'Escape' && libraryOpen) {
        setLibraryOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [libraryOpen]);

  const handleQuery = async (query: string) => {
    setCurrentQuery(query);
    setIsGenerating(true);
    setGenerateError(null);
    try {
      const state = await generateCanvas(query);
      const name = query.slice(0, 40);
      saveCanvasState(activeTabId, state);
      renameTab(activeTabId, name);
      updateProjectMeta({
        id: activeTabId,
        name,
        createdAt: state.createdAt,
        updatedAt: Date.now(),
        fragmentCount: state.fragments.length,
        clusterCount: state.clusters.length,
      });
      setProjectsMeta(loadProjectsIndex());
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

  const handleOpenFromLibrary = (id: string, name: string) => {
    openProject(id, name);
    setLibraryOpen(false);
  };

  const isEmpty = tabState.clusters.length === 0;
  const activeTabName = tabs.find(t => t.id === activeTabId)?.name ?? '';
  const activeMeta = projectsMeta.find(p => p.id === activeTabId);

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
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(o => !o)}
          explorationName={activeTabName}
          fragmentCount={tabState.fragments.length}
          clusterCount={tabState.clusters.length}
          connectorCount={tabState.connectors.length}
          createdAt={tabState.createdAt}
          updatedAt={activeMeta?.updatedAt ?? tabState.createdAt}
          onOpenLibrary={() => setLibraryOpen(true)}
          onNewExploration={addTab}
        />
        <div className="canvas-area" style={{ flex: 1, minWidth: 0, position: 'relative' }}>
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
          {libraryOpen && (
            <LibraryView
              projects={projectsMeta}
              openTabIds={tabs.map(t => t.id)}
              canAddTab={canAddTab}
              onOpen={handleOpenFromLibrary}
              onClose={() => setLibraryOpen(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
