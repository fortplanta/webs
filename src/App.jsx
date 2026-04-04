import { useState } from 'react';
import Onboarding from './components/Onboarding';
import Canvas from './components/Canvas';
import RememberMode from './components/RememberMode';
import { STORAGE_KEYS } from './constants';
import './styles/index.css';

function loadApiKey() {
  return localStorage.getItem(STORAGE_KEYS.API_KEY) || '';
}

export default function App() {
  const [apiKey, setApiKey] = useState(loadApiKey);
  const [mode, setMode] = useState('explore');
  const [newCards, setNewCards] = useState([]);
  const [importedState, setImportedState] = useState(null);
  const [showDebug, setShowDebug] = useState(false);
  const [showCSS, setShowCSS] = useState(false);

  function saveApiKey(key) {
    localStorage.setItem(STORAGE_KEYS.API_KEY, key);
    setApiKey(key);
  }

  function handleCardsGenerated(cards) {
    setNewCards(prev => [...prev, ...cards]);
  }

  function exportSession() {
    try {
      const canvas = localStorage.getItem(STORAGE_KEYS.CANVAS) || '{}';
      const cards  = localStorage.getItem(STORAGE_KEYS.CARDS)  || '[]';
      const data = {
        version: 1,
        exportedAt: new Date().toISOString(),
        canvas: JSON.parse(canvas),
        cards: JSON.parse(cards),
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `webs-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) { alert('Export failed: ' + e.message); }
  }

  function importSession() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          const data = JSON.parse(ev.target.result);
          if (data.canvas) {
            localStorage.setItem(STORAGE_KEYS.CANVAS, JSON.stringify(data.canvas));
            setImportedState(data.canvas);
          }
          if (data.cards) {
            localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(data.cards));
          }
        } catch { alert('Invalid session file.'); }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  if (!apiKey) {
    return <Onboarding onSave={saveApiKey} />;
  }

  return (
    <div className="app">
      <div className="toolbar">
        <span className="toolbar-logo">Webs</span>
        <div className="toolbar-sep" />
        <button className="btn" onClick={exportSession}>Save session</button>
        <button className="btn" onClick={importSession}>Open session</button>
        <button className="btn btn-danger" onClick={() => {
          if (confirm('Clear API key and return to setup?')) {
            localStorage.removeItem(STORAGE_KEYS.API_KEY);
            setApiKey('');
          }
        }}>
          API key
        </button>

        <div className="toolbar-sep" />
        <button
          className={`btn btn-tool${showCSS ? ' active' : ''}`}
          onClick={() => setShowCSS(v => !v)}
          title="Live CSS Inspector — try style changes without saving"
        >
          CSS
        </button>
        <button
          className={`btn btn-tool${showDebug ? ' active' : ''}`}
          onClick={() => setShowDebug(v => !v)}
          title="Debug panel — inspect selected node data"
        >
          Debug
        </button>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          <button
            className={`btn btn-mode${mode === 'explore' ? ' active' : ''}`}
            onClick={() => setMode('explore')}
          >
            Explore
          </button>
          <button
            className={`btn btn-mode${mode === 'remember' ? ' active' : ''}`}
            onClick={() => setMode('remember')}
          >
            Remember
          </button>
        </div>
      </div>

      {mode === 'explore' ? (
        <Canvas
          apiKey={apiKey}
          onCardsGenerated={handleCardsGenerated}
          importedState={importedState}
          showDebug={showDebug}
          showCSS={showCSS}
        />
      ) : (
        <RememberMode newCards={newCards} />
      )}
    </div>
  );
}
