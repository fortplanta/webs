import { memo } from 'react';
import { Panel, BackgroundVariant } from '@xyflow/react';

const EDGE_TYPES = [
  { key: 'default',     label: 'Curved'   },
  { key: 'straight',    label: 'Straight' },
  { key: 'step',        label: 'Step'     },
  { key: 'smoothstep',  label: 'Smooth'   },
];

const BG_OPTIONS = [
  { key: BackgroundVariant.Dots,  label: 'Dots'  },
  { key: BackgroundVariant.Lines, label: 'Lines' },
  { key: BackgroundVariant.Cross, label: 'Cross' },
  { key: null,                    label: 'None'  },
];

export default memo(function FloatingToolbar({
  edgeType,       onEdgeTypeChange,
  bgVariant,      onBgVariantChange,
  snapToGrid,     onSnapToggle,
  showMiniMap,    onMiniMapToggle,
  onFitView,
}) {
  return (
    <Panel position="bottom-center">
    <div className="floating-toolbar" role="toolbar" aria-label="Canvas tools">

      {/* ── Edge style ── */}
      <div className="toolbar-group">
        <span className="toolbar-group__label">Edge</span>
        <div className="toolbar-row">
          {EDGE_TYPES.map(({ key, label }) => (
            <button
              key={key}
              className={`toolbar-pill${edgeType === key ? ' active' : ''}`}
              onClick={() => onEdgeTypeChange(key)}
              title={`Edge: ${label}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="toolbar-divider" />

      {/* ── Background ── */}
      <div className="toolbar-group">
        <span className="toolbar-group__label">Background</span>
        <div className="toolbar-row">
          {BG_OPTIONS.map(({ key, label }) => (
            <button
              key={String(key)}
              className={`toolbar-pill${bgVariant === key ? ' active' : ''}`}
              onClick={() => onBgVariantChange(key)}
              title={`Background: ${label}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="toolbar-divider" />

      {/* ── Toggles & actions ── */}
      <div className="toolbar-group">
        <span className="toolbar-group__label">Canvas</span>
        <div className="toolbar-row">
          <button
            className={`toolbar-pill${snapToGrid ? ' active' : ''}`}
            onClick={onSnapToggle}
            title="Snap nodes to grid"
          >
            Snap
          </button>
          <button
            className={`toolbar-pill${showMiniMap ? ' active' : ''}`}
            onClick={onMiniMapToggle}
            title="Toggle minimap"
          >
            Minimap
          </button>
          <button
            className="toolbar-pill"
            onClick={onFitView}
            title="Fit all nodes in view"
          >
            Fit view
          </button>
        </div>
      </div>

    </div>
    </Panel>
  );
});
