import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Fragment, ProjectMeta } from '../api/types';
import { loadCanvasState } from '../storage/storage';
import '../styles/cross-link.css';

interface Props {
  sourceFragment: Fragment;
  sourceExplorationId: string;
  projects: ProjectMeta[];
  onConfirm: (targetExplorationId: string, targetFragmentId: string) => void;
  onClose: () => void;
}

type Step = 'choose-exploration' | 'choose-fragment' | 'confirm';

interface SelectedExploration {
  id: string;
  name: string;
  depthScore: number;
  fragmentCount: number;
}

interface SelectedFragment {
  id: string;
  type: string;
  title: string;
  body: string;
  clusterId: string;
  clusterLabel: string;
}

export default function CrossLinkModal({ sourceFragment, sourceExplorationId, projects, onConfirm, onClose }: Props) {
  const [step, setStep] = useState<Step>('choose-exploration');
  const [selectedExploration, setSelectedExploration] = useState<SelectedExploration | null>(null);
  const [selectedFragment, setSelectedFragment] = useState<SelectedFragment | null>(null);
  const [explorationFragments, setExplorationFragments] = useState<SelectedFragment[]>([]);

  // Other explorations (excluding current)
  const otherProjects = projects.filter(p => p.id !== sourceExplorationId);

  // Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  function handleSelectExploration(project: ProjectMeta) {
    const canvasState = loadCanvasState(project.id);
    if (!canvasState) return;

    // Build fragments with cluster labels
    const clusterMap = new Map(canvasState.clusters.map(c => [c.id, c.label]));
    const fragments: SelectedFragment[] = canvasState.fragments
      .filter(f => f.type !== 'text-note' && !canvasState.clusters.find(c => c.id === f.clusterId)?.isSeed)
      .map(f => ({
        id: f.id,
        type: f.type,
        title: f.title,
        body: f.slots.find(s => s.type === 'body')?.content ?? '',
        clusterId: f.clusterId,
        clusterLabel: clusterMap.get(f.clusterId) ?? 'unknown',
      }));

    setExplorationFragments(fragments);
    setSelectedExploration({
      id: project.id,
      name: project.name,
      depthScore: 0,
      fragmentCount: fragments.length,
    });
    setStep('choose-fragment');
  }

  function handleSelectFragment(fragment: SelectedFragment) {
    setSelectedFragment(fragment);
    setStep('confirm');
  }

  function handleConfirm() {
    if (!selectedExploration || !selectedFragment) return;
    onConfirm(selectedExploration.id, selectedFragment.id);
    onClose();
  }

  // Group fragments by cluster for step 2
  const fragmentsByCluster = explorationFragments.reduce<Record<string, SelectedFragment[]>>((acc, f) => {
    if (!acc[f.clusterLabel]) acc[f.clusterLabel] = [];
    acc[f.clusterLabel].push(f);
    return acc;
  }, {});

  const modal = (
    <div
      className="cross-link-overlay"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="cross-link-modal" onMouseDown={e => e.stopPropagation()}>
        <div className="cross-link-modal__header">
          <p className="cross-link-modal__title">Link to another exploration</p>
          <button className="cross-link-modal__close" onClick={onClose}>×</button>
        </div>

        <div className="cross-link-modal__body">
          {/* Step 1: choose exploration */}
          {step === 'choose-exploration' && (
            <>
              {otherProjects.length === 0 ? (
                <div className="cross-link-modal__empty">no other explorations yet</div>
              ) : (
                <div className="cross-link-modal__list">
                  {otherProjects.map(p => (
                    <button
                      key={p.id}
                      className="cross-link-modal__item"
                      onClick={() => handleSelectExploration(p)}
                    >
                      <span className="cross-link-modal__item-name">{p.name || 'untitled'}</span>
                      <span className="cross-link-modal__item-meta">{p.fragmentCount ?? 0} fragments</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Step 2: choose fragment */}
          {step === 'choose-fragment' && (
            <>
              <div className="cross-link-modal__source-reminder">
                Linking from: <strong>{sourceFragment.type} "{sourceFragment.title}"</strong>
              </div>
              <div className="cross-link-modal__step-back">
                <button className="cross-link-modal__back-btn" onClick={() => setStep('choose-exploration')}>
                  ← {selectedExploration?.name}
                </button>
              </div>
              {Object.entries(fragmentsByCluster).length === 0 ? (
                <div className="cross-link-modal__empty">no fragments in this exploration</div>
              ) : (
                Object.entries(fragmentsByCluster).map(([clusterLabel, frags]) => (
                  <div key={clusterLabel}>
                    <div className="cross-link-modal__group-label">{clusterLabel}</div>
                    <div className="cross-link-modal__list">
                      {frags.map(f => (
                        <button
                          key={f.id}
                          className="cross-link-modal__item"
                          onClick={() => handleSelectFragment(f)}
                        >
                          <span
                            className="cross-link-modal__chip"
                            style={{
                              background: `var(--color-fragment-${f.type}-bg)`,
                              color: `var(--color-fragment-${f.type}-text)`,
                            }}
                          >
                            {f.type}
                          </span>
                          <span className="cross-link-modal__item-name">{f.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {/* Step 3: confirm */}
          {step === 'confirm' && selectedFragment && (
            <div className="cross-link-modal__source-reminder">
              Linking from: <strong>{sourceFragment.type} "{sourceFragment.title}"</strong>
            </div>
          )}
        </div>

        {/* Footer only on confirm step */}
        {step === 'confirm' && selectedFragment && (
          <div className="cross-link-modal__footer">
            <button className="cross-link-modal__btn cross-link-modal__btn--ghost" onClick={() => setStep('choose-fragment')}>
              ← back
            </button>
            <span className="cross-link-modal__confirm-pair">
              "{sourceFragment.title}" ↔ "{selectedFragment.title}"
            </span>
            <button className="cross-link-modal__btn cross-link-modal__btn--primary" onClick={handleConfirm}>
              Establish link
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
