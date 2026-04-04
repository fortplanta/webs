import { useState, useRef, useEffect } from 'react';
import Onboarding from './components/Onboarding';
import Canvas from './components/Canvas';
import RememberMode from './components/RememberMode';
import { STORAGE_KEYS } from './constants';
import './styles/index.css';

function loadApiKey() { return localStorage.getItem(STORAGE_KEYS.API_KEY) || ''; }
function getUsageCount() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USAGE);
    const today = new Date().toISOString().slice(0, 10);
    if (!raw) return 0;
    const p = JSON.parse(raw);
    return p.date !== today ? 0 : p.count;
  } catch { return 0; }
}

export default function App() {
  const [apiKey, setApiKey] = useState(loadApiKey);
  const [mode, setMode] = useState('explore');
  const [newCards, setNewCards] = useState([]);
  const [importedState, setImportedState] = useState(null);
  const [showDebug, setShowDebug] = useState(false);
  const [showCSS, setShowCSS] = useState(false);
  const [usageCount, setUsageCount] = useState(getUsageCount);

  // Imperative handle to open the "Add Note" dialog from the sidebar
  const addNoteRef = useRef(null);

  function saveApiKey(key) {
    localStorage.setItem(STORAGE_KEYS.API_KEY, key);
    setApiKey(key);
  }

  function handleCardsGenerated(cards) {
    setNewCards(prev => [...prev, ...cards]);
  }

  // ── Save (export JSON) ──────────────────────────────────────────────────
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

  // ── Open (import JSON) ──────────────────────────────────────────────────
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

  // ── Keyboard shortcuts ──────────────────────────────────────────────────
  const exportRef = useRef(null);
  const importRef = useRef(null);
  exportRef.current = exportSession;
  importRef.current = importSession;

  useEffect(() => {
    function onKey(e) {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key === 's') { e.preventDefault(); exportRef.current?.(); }
      if (meta && e.key === 'o') { e.preventDefault(); importRef.current?.(); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!apiKey) return <Onboarding onSave={saveApiKey} />;

  const limitReached = usageCount >= 10;

  return (
    <div className="app">
      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <nav className="sidebar" aria-label="Application controls">

        {/* Logo */}
        <div className="sidebar-header">
          <span className="sidebar-logo">Webs</span>
          <span className="sidebar-logo-sub" aria-hidden="true">AI canvas</span>
        </div>

        {/* Mode switcher */}
        <div className="sidebar-section">
          <div
            className="sidebar-modes"
            role="radiogroup"
            aria-label="Canvas mode"
          >
            <button
              className="mode-option"
              role="radio"
              aria-checked={mode === 'explore'}
              onClick={() => setMode('explore')}
            >
              <span className="sidebar-item__icon" aria-hidden="true">⬡</span>
              Explore
            </button>
            <button
              className="mode-option"
              role="radio"
              aria-checked={mode === 'remember'}
              onClick={() => setMode('remember')}
            >
              <span className="sidebar-item__icon" aria-hidden="true">◇</span>
              Remember
            </button>
          </div>
        </div>

        {/* Add note (only in Explore mode) */}
        {mode === 'explore' && (
          <div className="sidebar-section">
            <button
              className="sidebar-cta"
              onClick={() => addNoteRef.current?.()}
              aria-label="Add a new note to the canvas"
            >
              + Add note
            </button>
          </div>
        )}

        {/* Session */}
        <div className="sidebar-section" aria-label="File operations">
          <span className="sidebar-label" aria-hidden="true">Session</span>
          <button
            className="sidebar-item"
            onClick={exportSession}
            aria-keyshortcuts="Meta+S"
            title="Save session as JSON (⌘S)"
          >
            <span className="sidebar-item__icon" aria-hidden="true">↓</span>
            Save session
            <span className="sidebar-item__shortcut" aria-hidden="true">⌘S</span>
          </button>
          <button
            className="sidebar-item"
            onClick={importSession}
            aria-keyshortcuts="Meta+O"
            title="Open a saved session (⌘O)"
          >
            <span className="sidebar-item__icon" aria-hidden="true">↑</span>
            Open session
            <span className="sidebar-item__shortcut" aria-hidden="true">⌘O</span>
          </button>
        </div>

        {/* View tools */}
        <div className="sidebar-section">
          <span className="sidebar-label" aria-hidden="true">View</span>
          <button
            className={`sidebar-item${showCSS ? ' active' : ''}`}
            role="switch"
            aria-checked={showCSS}
            onClick={() => setShowCSS(v => !v)}
          >
            <span className="sidebar-item__icon" aria-hidden="true">#</span>
            CSS Styles
          </button>
          <button
            className={`sidebar-item${showDebug ? ' active' : ''}`}
            role="switch"
            aria-checked={showDebug}
            onClick={() => setShowDebug(v => !v)}
          >
            <span className="sidebar-item__icon" aria-hidden="true">⊞</span>
            Debug info
          </button>
        </div>

        {/* Footer: API key */}
        <div className="sidebar-footer">
          <button
            className="sidebar-item danger"
            onClick={() => {
              if (confirm('Clear API key and return to setup?')) {
                localStorage.removeItem(STORAGE_KEYS.API_KEY);
                setApiKey('');
              }
            }}
          >
            <span className="sidebar-item__icon" aria-hidden="true">⚷</span>
            API key
          </button>
        </div>
      </nav>

      {/* ── Main area ───────────────────────────────────────────────── */}
      <div className="main-area">
        <main id="main-content" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {mode === 'explore' ? (
            <Canvas
              apiKey={apiKey}
              onCardsGenerated={handleCardsGenerated}
              importedState={importedState}
              showDebug={showDebug}
              showCSS={showCSS}
              onRegisterAddNote={fn => { addNoteRef.current = fn; }}
              onUsageChange={setUsageCount}
            />
          ) : (
            <RememberMode newCards={newCards} />
          )}
        </main>

        {/* Status bar */}
        <footer className="status-bar">
          <span className="status-bar__item">
            <span className="status-bar__dot" aria-hidden="true" />
            {mode === 'explore' ? 'Explore' : 'Remember'} mode
          </span>
          <span
            role="status"
            aria-live="polite"
            className={`status-bar__item${limitReached ? ' low' : ''}`}
          >
            <span className="status-bar__dot" aria-hidden="true" />
            {limitReached ? 'Daily limit reached' : `${usageCount}/10 expansions today`}
          </span>
        </footer>
      </div>
    </div>
  );
}
