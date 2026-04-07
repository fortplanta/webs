import { memo } from 'react';
import { Panel, BackgroundVariant } from '@xyflow/react';

const BG_OPTIONS = [
  { value: BackgroundVariant.Dots,  label: 'dots'  },
  { value: BackgroundVariant.Lines, label: 'lines' },
  { value: BackgroundVariant.Cross, label: 'cross' },
  { value: null,                    label: 'none'  },
];

const EDGE_OPTIONS = [
  { value: 'default',    label: 'bezier'   },
  { value: 'straight',   label: 'straight' },
  { value: 'step',       label: 'step'     },
  { value: 'smoothstep', label: 'smooth'   },
  { value: 'floating',   label: 'float'    },
];

export default memo(function ViewPanel({
  edgeType,     onEdgeTypeChange,
  animateEdges, onAnimateToggle,
  bgVariant,    onBgVariantChange,
  snapToGrid,   onSnapToggle,
  showMiniMap,  onMiniMapToggle,
  onFitView,
}) {
  return (
    <Panel position="top-right">
      <div className="view-panel" role="toolbar" aria-label="View options">

        <div className="view-panel__header">view</div>

        {/* Background */}
        <div className="view-panel__row">
          <span className="view-panel__label">background</span>
          <div className="view-panel__buttons">
            {BG_OPTIONS.map(opt => (
              <button
                key={String(opt.value)}
                className={`view-panel__btn${bgVariant === opt.value ? ' active' : ''}`}
                onClick={() => onBgVariantChange(opt.value)}
                title={`background: ${opt.label}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Edge style */}
        <div className="view-panel__row">
          <span className="view-panel__label">edges</span>
          <div className="view-panel__buttons">
            {EDGE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                className={`view-panel__btn${edgeType === opt.value ? ' active' : ''}`}
                onClick={() => onEdgeTypeChange(opt.value)}
                title={`edge style: ${opt.label}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="view-panel__divider" />

        {/* Toggle row */}
        <div className="view-panel__toggles">
          <button
            className={`view-panel__toggle${animateEdges ? ' active' : ''}`}
            onClick={onAnimateToggle}
            title="animate all edges"
          >
            animate
          </button>
          <button
            className={`view-panel__toggle${snapToGrid ? ' active' : ''}`}
            onClick={onSnapToggle}
            title="snap to 16px grid"
          >
            snap
          </button>
          <button
            className={`view-panel__toggle${showMiniMap ? ' active' : ''}`}
            onClick={onMiniMapToggle}
            title="toggle minimap"
          >
            minimap
          </button>
          <button
            className="view-panel__toggle"
            onClick={onFitView}
            title="fit all nodes in view"
          >
            fit
          </button>
        </div>

      </div>
    </Panel>
  );
});
