import { memo } from 'react';
import { Panel, BackgroundVariant } from '@xyflow/react';
import { Segmented, Button, Divider } from 'antd';

const EDGE_OPTIONS = [
  { value: 'default',    label: 'Bezier'   },
  { value: 'straight',   label: 'Straight' },
  { value: 'step',       label: 'Step'     },
  { value: 'smoothstep', label: 'Smooth'   },
  { value: 'floating',   label: 'Floating' },
];

const MARKER_OPTIONS = [
  { value: 'none',        label: '—'   },
  { value: 'arrow',       label: '→'   },
  { value: 'arrowclosed', label: '▶'   },
];

const BG_OPTIONS = [
  { value: BackgroundVariant.Dots,  label: 'Dots'  },
  { value: BackgroundVariant.Lines, label: 'Lines' },
  { value: BackgroundVariant.Cross, label: 'Cross' },
  { value: 'none',                  label: 'None'  },
];

const SEP = <Divider type="vertical" style={{ height: 36, margin: '0 6px' }} />;

export default memo(function FloatingToolbar({
  edgeType,     onEdgeTypeChange,
  markerType,   onMarkerTypeChange,
  animateEdges, onAnimateToggle,
  bgVariant,    onBgVariantChange,
  snapToGrid,   onSnapToggle,
  showMiniMap,  onMiniMapToggle,
  onFitView,
}) {
  return (
    <Panel position="bottom-center">
      <div className="floating-toolbar" role="toolbar" aria-label="Canvas tools">

        {/* ── Edge type ── */}
        <div className="toolbar-group">
          <span className="toolbar-group__label">Edge</span>
          <Segmented
            size="small"
            options={EDGE_OPTIONS}
            value={edgeType}
            onChange={onEdgeTypeChange}
          />
        </div>

        {SEP}

        {/* ── Markers ── */}
        <div className="toolbar-group">
          <span className="toolbar-group__label">Marker</span>
          <Segmented
            size="small"
            options={MARKER_OPTIONS}
            value={markerType}
            onChange={onMarkerTypeChange}
          />
        </div>

        {SEP}

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

        {SEP}

        {/* ── Canvas toggles ── */}
        <div className="toolbar-group">
          <span className="toolbar-group__label">Canvas</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <Button
              size="small"
              type={animateEdges ? 'primary' : 'default'}
              onClick={onAnimateToggle}
              title="Animate all edges"
            >
              Animate
            </Button>
            <Button
              size="small"
              type={snapToGrid ? 'primary' : 'default'}
              onClick={onSnapToggle}
              title="Snap to 16px grid"
            >
              Snap
            </Button>
            <Button
              size="small"
              type={showMiniMap ? 'primary' : 'default'}
              onClick={onMiniMapToggle}
              title="Toggle minimap"
            >
              Map
            </Button>
            <Button
              size="small"
              onClick={onFitView}
              title="Fit all nodes in view"
            >
              Fit
            </Button>
          </div>
        </div>

      </div>
    </Panel>
  );
});
