import '../styles/nav-panel.css';
import { NavPanel as NavPanelType } from './NavRail';
import ExplorationPanel from './panels/ExplorationPanel';
import PromptsPanel from './panels/PromptsPanel';
import LibraryPanel from './panels/LibraryPanel';
import { ProjectMeta, ProgressState } from '../api/types';

const PANEL_HEADERS: Record<NavPanelType, string> = {
  exploration: 'exploration',
  prompts: 'prompts',
  library: 'library',
};

interface Props {
  activePanel: NavPanelType | null;
  // ExplorationPanel props
  explorationName: string;
  fragmentCount: number;
  clusterCount: number;
  totalClusters: number;
  connectorCount: number;
  depthScore: number;
  userConnectionCount: number;
  maxConnections: number;
  clustersLit: number;
  milestonesReached: number[];
  createdAt: number;
  updatedAt: number;
  scratchpad: string;
  onScratchpadChange: (text: string) => void;
  onNewExploration: () => void;
  progressState?: ProgressState;
  // LibraryPanel props
  projects: ProjectMeta[];
  openTabIds: string[];
  canAddTab: boolean;
  onOpenProject: (id: string, name: string) => void;
  onViewAllLibrary: () => void;
}

export default function NavPanel({
  activePanel,
  explorationName,
  fragmentCount,
  clusterCount,
  totalClusters,
  connectorCount,
  depthScore,
  userConnectionCount,
  maxConnections,
  clustersLit,
  milestonesReached,
  createdAt,
  updatedAt,
  scratchpad,
  onScratchpadChange,
  onNewExploration,
  progressState,
  projects,
  openTabIds,
  canAddTab,
  onOpenProject,
  onViewAllLibrary,
}: Props) {
  return (
    <div className={`nav-panel${activePanel === null ? ' nav-panel--collapsed' : ''}`}>
      {activePanel !== null && (
        <>
          <div className="nav-panel__header">{PANEL_HEADERS[activePanel]}</div>
          <div className="nav-panel__body">
            {activePanel === 'exploration' && (
              <ExplorationPanel
                explorationName={explorationName}
                fragmentCount={fragmentCount}
                clusterCount={clusterCount}
                totalClusters={totalClusters}
                connectorCount={connectorCount}
                depthScore={depthScore}
                userConnectionCount={userConnectionCount}
                maxConnections={maxConnections}
                clustersLit={clustersLit}
                milestonesReached={milestonesReached}
                createdAt={createdAt}
                updatedAt={updatedAt}
                scratchpad={scratchpad}
                onScratchpadChange={onScratchpadChange}
                onOpenLibrary={onViewAllLibrary}
                onNewExploration={onNewExploration}
                progressState={progressState}
              />
            )}
            {activePanel === 'prompts' && <PromptsPanel />}
            {activePanel === 'library' && (
              <LibraryPanel
                projects={projects}
                openTabIds={openTabIds}
                canAddTab={canAddTab}
                onOpen={onOpenProject}
                onViewAll={onViewAllLibrary}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
