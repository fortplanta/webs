import { memo } from 'react';
import { Panel, BackgroundVariant } from '@xyflow/react';
import { Segmented, Button, Divider } from 'antd';

const EDGE_OPTIONS = [
  { value: 'default',    label: 'Curved'   },
  { value: 'straight',   label: 'Straight' },
  { value: 'step',       label: 'Step'     },
  { value: 'smoothstep', label: 'Smooth'   },
];

const BG_OPTIONS = [
  { value: BackgroundVariant.Dots,  label: 'Dots'  },
  { value: BackgroundVariant.Lines, label: 'Lines' },
  { value: BackgroundVariant.Cross, label: 'Cross' },
  { value: 'none',                  label: 'None'  },
];

const DIVIDER = <Divider type="vertical" style={{ height: 36, margin: '0 6px' }} />;

export default memo(function FloatingToolbar({
  edgeType,    onEdgeTypeChange,
  bgVariant,   onBgVariantChange,
  snapToGrid,  onSnapToggle,
  showMiniMap, onMiniMapToggle,
  onFitView,
}) {
  return (
    <Panel position="bottom-center">
      <div className="floating-toolbar" role="toolbar" aria-label="Canvas tools">

        {/* ── Edge style ── */}
        <div className="toolbar-group">
          <span className="toolbar-group__label">Edge</span>
          <Segmented
            size="small"
            options={EDGE_OPTIONS}
            value={edgeType}
            onChange={onEdgeTypeChange}
          />
        </div>

        {DIVIDER}

        {/* ── Background ── */}
        <div className="toolbar-group">
          <span className="toolbar-group__label">Background</span>
          <Segmented
            size="small"
            options={BG_OPTIONS}
            value={bgVariant === null ? 'none' : bgVariant}
            onChange={val => onBgVariantChange(val === 'none' ? null : val)}
          />
        </div>

        {DIVIDER}

        {/* ── Canvas controls ── */}
        <div className="toolbar-group">
          <span className="toolbar-group__label">Canvas</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <Button
              size="small"
              type={snapToGrid ? 'primary' : 'default'}
              onClick={onSnapToggle}
              title="Snap nodes to a 16px grid"
            >
              Snap
            </Button>
            <Button
              size="small"
              type={showMiniMap ? 'primary' : 'default'}
              onClick={onMiniMapToggle}
              title="Toggle minimap"
            >
              Minimap
            </Button>
            <Button
              size="small"
              onClick={onFitView}
              title="Fit all nodes in view"
            >
              Fit view
            </Button>
          </div>
        </div>

      </div>
    </Panel>
  );
});
