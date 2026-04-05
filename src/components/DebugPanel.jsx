import { useMemo } from 'react';
import { Button } from 'antd';

function colorizeJSON(obj) {
  const str = JSON.stringify(obj, null, 2);
  return str
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"(\w+)":/g, '<span class="key">"$1"</span>:')
    .replace(/: "([^"]*)"/g, ': <span class="str">"$1"</span>')
    .replace(/: (\d+\.?\d*)/g, ': <span class="num">$1</span>')
    .replace(/: (true|false)/g, ': <span class="bool">$1</span>');
}

export default function DebugPanel({ nodes, edges, selectedNodes, onClose }) {
  const displayNodes = selectedNodes.length > 0 ? selectedNodes : [];

  const colorized = useMemo(() => {
    return displayNodes.map(n => {
      const clean = {
        ...n,
        data: Object.fromEntries(
          Object.entries(n.data || {}).filter(([, v]) => typeof v !== 'function')
        ),
      };
      return { id: n.id, html: colorizeJSON(clean) };
    });
  }, [displayNodes]);

  return (
    <div className="debug-panel" data-panel="debug">
      <div className="debug-panel__header">
        <span className="debug-panel__title">Debug</span>
        <Button size="small" onClick={onClose}>✕</Button>
      </div>
      <div className="debug-panel__stats">
        <span className="debug-stat"><span>{nodes.length}</span> nodes</span>
        <span className="debug-stat"><span>{edges.length}</span> edges</span>
        <span className="debug-stat"><span>{selectedNodes.length}</span> selected</span>
      </div>
      <div className="debug-panel__body">
        {colorized.length === 0 ? (
          <p className="debug-panel__empty">Select a node to inspect it</p>
        ) : (
          colorized.map(({ id, html }) => (
            <div key={id} style={{ marginBottom: 16 }}>
              <div className="debug-json" dangerouslySetInnerHTML={{ __html: html }} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
