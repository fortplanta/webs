import { useState, useEffect, useCallback } from 'react';
import './styles/webs-tokens.css';
import './styles/index.css';
import './styles/canvas.css';
import './styles/fragments.css';
import './styles/clusters.css';
import './styles/panels.css';
import './styles/ui.css';
import './styles/tabs.css';
import './styles/library.css';
import './styles/prompt-sidebar.css';
import './styles/nav-rail.css';
import './styles/nav-panel.css';
import './styles/modal.css';
import { CanvasState, Fragment, ProjectMeta } from './api/types';
import { generateCanvas } from './api/generate';
import { createEmptyCanvasState } from './canvas/useCanvas';
import Canvas from './canvas/Canvas';
import TabStrip from './tabs/TabStrip';
import { useTabs } from './tabs/useTabs';
import { loadCanvasState, saveCanvasState, updateProjectMeta, loadProjectsIndex } from './storage/storage';
import { initExplorationState } from './canvas/connections';
import LoadingCanvas from './ui/LoadingCanvas';
import NavRail, { NavPanel as NavPanelType } from './ui/NavRail';
import NavPanel from './ui/NavPanel';
import StartingCard from './ui/StartingCard';
import LibraryView from './ui/LibraryView';

export default function App() {
  const { tabs, activeTabId, canAddTab, switchTab, addTab, addTabGetId, openProject, closeTab, renameTab } = useTabs();
  const [copiedFragment, setCopiedFragment] = useState<Fragment | null>(null);

  const [prevActiveTabId, setPrevActiveTabId] = useState(activeTabId);
  const [tabState, setTabState] = useState<CanvasState>(() =>
    loadCanvasState(activeTabId) ?? createEmptyCanvasState()
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [currentQuery, setCurrentQuery] = useState('');

  const [scratchpad, setScratchpad] = useState(() => (loadCanvasState(activeTabId) ?? createEmptyCanvasState()).scratchpad ?? '');
  const [generationCount, setGenerationCount] = useState(0);
  const [activePanel, setActivePanel] = useState<NavPanelType | null>('exploration');
  const [startingCardOpen, setStartingCardOpen] = useState(false);
  const [ganttOpen, setGanttOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [projectsMeta, setProjectsMeta] = useState<ProjectMeta[]>(() => loadProjectsIndex());

  // Synchronous tab switch: update tabState during render so Canvas mounts with correct state.
  // useEffect fires after children mount — too late when key changes force a remount.
  if (prevActiveTabId !== activeTabId) {
    const saved = loadCanvasState(activeTabId) ?? createEmptyCanvasState();
    setTabState(saved);
    setScratchpad(saved.scratchpad ?? '');
    setIsGenerating(false);
    setGenerateError(null);
    setGanttOpen(false);
    setPrevActiveTabId(activeTabId);
  }

  const handleScratchpadChange = useCallback((text: string) => {
    setScratchpad(text);
    const current = loadCanvasState(activeTabId) ?? createEmptyCanvasState();
    saveCanvasState(activeTabId, { ...current, scratchpad: text });
  }, [activeTabId]);

  const togglePanel = (panel: NavPanelType) => {
    setActivePanel(prev => prev === panel ? null : panel);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'l') {
        e.preventDefault();
        setLibraryOpen(prev => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
        e.preventDefault();
        setActivePanel(prev => prev === 'prompts' ? null : 'prompts');
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        setStartingCardOpen(true);
      }
      if (e.key === 'Escape') {
        if (startingCardOpen) { setStartingCardOpen(false); return; }
        if (ganttOpen) { setGanttOpen(false); return; }
        if (libraryOpen) setLibraryOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [libraryOpen, startingCardOpen, ganttOpen]);

  const handleQuery = async (query: string) => {
    setCurrentQuery(query);
    setIsGenerating(true);
    setGenerateError(null);
    setGanttOpen(false);
    // Use the current tab if it's empty; otherwise create a new one.
    const isEmpty = tabState.clusters.length === 0 && tabState.fragments.length === 0;
    const targetTabId = isEmpty ? activeTabId : addTabGetId();
    try {
      const state = await generateCanvas(query);
      // Tab name: query truncated to 32 chars
      const name = query.slice(0, 32) + (query.length > 32 ? '…' : '');
      saveCanvasState(targetTabId, state);
      initExplorationState(targetTabId, state.fragments);
      renameTab(targetTabId, name);
      updateProjectMeta({
        id: targetTabId,
        name,
        createdAt: state.createdAt,
        updatedAt: Date.now(),
        fragmentCount: state.fragments.length,
        clusterCount: state.clusters.length,
      });
      setProjectsMeta(loadProjectsIndex());
      setTabState(state);
      setGenerationCount(c => c + 1);
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

  // When + is clicked: create new tab and immediately open StartingCard
  const handleAddTab = () => {
    addTab();
    setStartingCardOpen(true);
  };

  const activeTabName = tabs.find(t => t.id === activeTabId)?.name ?? '';
  const activeMeta = projectsMeta.find(p => p.id === activeTabId);

  const handleNewExploration = () => {
    setStartingCardOpen(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <TabStrip
        tabs={tabs}
        activeTabId={activeTabId}
        canAdd={canAddTab}
        onSwitch={switchTab}
        onClose={handleClose}
        onAdd={handleAddTab}
        onRename={renameTab}
      />
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <NavRail
          activePanel={activePanel}
          onToggle={togglePanel}
          ganttOpen={ganttOpen}
          onGanttToggle={() => setGanttOpen(v => !v)}
        />
        <NavPanel
          activePanel={activePanel}
          explorationName={activeTabName}
          fragmentCount={tabState.fragments.length}
          clusterCount={tabState.clusters.length}
          connectorCount={tabState.connectors.length}
          createdAt={tabState.createdAt}
          updatedAt={activeMeta?.updatedAt ?? tabState.createdAt}
          scratchpad={scratchpad}
          onScratchpadChange={handleScratchpadChange}
          onNewExploration={handleNewExploration}
          projects={projectsMeta}
          openTabIds={tabs.map(t => t.id)}
          canAddTab={canAddTab}
          onOpenProject={handleOpenFromLibrary}
          onViewAllLibrary={() => setLibraryOpen(true)}
        />
        <div className="canvas-area" style={{ flex: 1, minWidth: 0, position: 'relative' }}>
          <Canvas
            key={`${activeTabId}-${generationCount}`}
            projectId={activeTabId}
            initialState={tabState}
            copiedFragment={copiedFragment}
            onFragmentCopy={setCopiedFragment}
            onFragmentPaste={() => setCopiedFragment(null)}
            onNewExploration={handleNewExploration}
            ganttOpen={ganttOpen}
            onGanttOpen={() => setGanttOpen(true)}
            onGanttClose={() => setGanttOpen(false)}
          />
          {isGenerating && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 300 }}>
              <LoadingCanvas
                query={currentQuery}
                error={generateError}
                onRetry={() => handleQuery(currentQuery)}
              />
            </div>
          )}
          {generateError && !isGenerating && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 300 }}>
              <LoadingCanvas
                query={currentQuery}
                error={generateError}
                onRetry={() => handleQuery(currentQuery)}
              />
            </div>
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
      {startingCardOpen && (
        <StartingCard
          onSubmit={handleQuery}
          onClose={() => setStartingCardOpen(false)}
        />
      )}
    </div>
  );
}
