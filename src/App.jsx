import { useState, useRef, useEffect } from 'react';
import PasswordGate from './components/PasswordGate';
import Canvas from './components/Canvas';
import RememberMode from './components/RememberMode';
import { STORAGE_KEYS } from './constants';
import './styles/index.css';

// API key lives in the environment — never exposed to users
const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY ?? '';

const AUTH_KEY = 'webs-auth';

function loadAuth() {
  return localStorage.getItem(AUTH_KEY) === 'true';
}

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
  const [authed, setAuthed]           = useState(loadAuth);
  const [mode, setMode]               = useState('explore');
  const [newCards, setNewCards]       = useState([]);
  const [importedState, setImportedState] = useState(null);
  const [usageCount, setUsageCount]   = useState(getUsageCount);
  const [activePanel, setActivePanel] = useState(null);
  const [sessionConfirm, setSessionConfirm] = useState(null); // 'new' | 'close' | null
  const addNoteRef = useRef(null);
  const clearCanvasRef = useRef(null);

  function unlock() {
    localStorage.setItem(AUTH_KEY, 'true');
    setAuthed(true);
  }

  function handleCardsGenerated(cards) {
    setNewCards(prev => [...prev, ...cards]);
  }

  function togglePanel(panel) {
    setActivePanel(p => (p === panel ? null : panel));
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
        cards:  JSON.parse(cards),
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `webs-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) { alert('Export failed: ' + e.message); }
  }

  // ── Open (import JSON) ──────────────────────────────────────────────────
  function importSession() {
    const input    = document.createElement('input');
    input.type     = 'file';
    input.accept   = '.json';
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

  // ── New session ────────────────────────────────────────────────────────
  function startNewSession() {
    clearCanvasRef.current?.();
    setSessionConfirm(null);
    setImportedState(null); // reset imported state so empty canvas on next load
  }

  function saveAndNewSession() {
    exportSession();
    startNewSession();
  }

  // ── Close session ──────────────────────────────────────────────────────
  function closeSession() {
    clearCanvasRef.current?.();
    setSessionConfirm(null);
    setImportedState(null);
  }

  function saveAndCloseSession() {
    exportSession();
    closeSession();
  }

  // ── Keyboard shortcuts ──────────────────────────────────────────────────
  const exportRef = useRef(null);
  const importRef = useRef(null);
  const newSessionRef = useRef(null);
  exportRef.current = exportSession;
  importRef.current = importSession;
  newSessionRef.current = () => setSessionConfirm('new');

  useEffect(() => {
    function onKey(e) {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key === 's') { e.preventDefault(); exportRef.current?.(); }
      if (meta && e.key === 'o') { e.preventDefault(); importRef.current?.(); }
      if (meta && e.key === 'n') { e.preventDefault(); newSessionRef.current?.(); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!authed) return <PasswordGate onUnlock={unlock} />;

  const limitReached = usageCount >= 10;

  return (
    <div className="app">

      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <nav className="sidebar" aria-label="Application controls">

        <div className="sidebar-header">
          <span className="sidebar-logo">webs</span>
          <span className="sidebar-logo-sub" aria-hidden="true">ai canvas</span>
        </div>

        {/* Mode switcher */}
        <div className="sidebar-section">
          <span className="sidebar-label">mode</span>
          <div className="sidebar-modes" role="radiogroup" aria-label="Canvas mode">
            <button
              className={`mode-option${mode === 'explore' ? ' active' : ''}`}
              role="radio"
              aria-checked={mode === 'explore'}
              onClick={() => setMode('explore')}
            >
              <span className="mode-option__icon" aria-hidden="true">⬡</span>
              <span>explore</span>
              <span className="mode-option__hint">build webs</span>
            </button>
            <button
              className={`mode-option${mode === 'remember' ? ' active' : ''}`}
              role="radio"
              aria-checked={mode === 'remember'}
              onClick={() => setMode('remember')}
            >
              <span className="mode-option__icon" aria-hidden="true">◇</span>
              <span>remember</span>
              <span className="mode-option__hint">flashcards</span>
            </button>
          </div>
        </div>

        {/* Add note (Explore only) */}
        {mode === 'explore' && (
          <div className="sidebar-section">
            <button
              className="sidebar-cta"
              onClick={() => addNoteRef.current?.()}
              aria-label="Add a new note to the canvas"
            >
              <span aria-hidden="true">+</span>
              add note
            </button>
          </div>
        )}

        {/* Session */}
        {sessionConfirm ? (
          <div className="session-confirm">
            <div className="session-confirm__text">
              {sessionConfirm === 'new' && (
                <>
                  Start new session?<br />
                  Current session will be lost if not saved.
                </>
              )}
              {sessionConfirm === 'close' && (
                <>
                  Close session?<br />
                  Unsaved changes will be lost.
                </>
              )}
            </div>
            <div className="session-confirm__actions">
              {sessionConfirm === 'new' && (
                <>
                  <button className="session-confirm__btn" onClick={saveAndNewSession}>Save first</button>
                  <button className="session-confirm__btn session-confirm__btn--danger" onClick={startNewSession}>Start fresh</button>
                </>
              )}
              {sessionConfirm === 'close' && (
                <>
                  <button className="session-confirm__btn" onClick={saveAndCloseSession}>Save & close</button>
                  <button className="session-confirm__btn session-confirm__btn--danger" onClick={closeSession}>Close anyway</button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="sidebar-section">
            <span className="sidebar-label">session</span>
            <button className="sidebar-item" onClick={exportSession} title="save session (⌘S)">
              <span className="sidebar-item__icon" aria-hidden="true">↓</span>
              save session
              <kbd className="sidebar-item__shortcut" aria-hidden="true">⌘S</kbd>
            </button>
            <button className="sidebar-item" onClick={importSession} title="open session (⌘O)">
              <span className="sidebar-item__icon" aria-hidden="true">↑</span>
              open session
              <kbd className="sidebar-item__shortcut" aria-hidden="true">⌘O</kbd>
            </button>
            <button className="sidebar-item" onClick={() => setSessionConfirm('new')} title="new session (⌘N)">
              <span className="sidebar-item__icon" aria-hidden="true">◆</span>
              new session
              <kbd className="sidebar-item__shortcut" aria-hidden="true">⌘N</kbd>
            </button>
            <button className="sidebar-item" onClick={() => setSessionConfirm('close')} title="close session">
              <span className="sidebar-item__icon" aria-hidden="true">⊘</span>
              close session
            </button>
          </div>
        )}

        {/* View panels */}
        <div className="sidebar-section">
          <span className="sidebar-label">view</span>
          <button
            className={`sidebar-item${activePanel === 'css' ? ' active' : ''}`}
            role="switch"
            aria-checked={activePanel === 'css'}
            onClick={() => togglePanel('css')}
          >
            <span className="sidebar-item__icon" aria-hidden="true">#</span>
            css inspector
            {activePanel === 'css' && <span className="sidebar-item__badge">on</span>}
          </button>
          <button
            className={`sidebar-item${activePanel === 'debug' ? ' active' : ''}`}
            role="switch"
            aria-checked={activePanel === 'debug'}
            onClick={() => togglePanel('debug')}
          >
            <span className="sidebar-item__icon" aria-hidden="true">⊞</span>
            debug info
            {activePanel === 'debug' && <span className="sidebar-item__badge">on</span>}
          </button>
        </div>

        {/* Footer: lock */}
        <div className="sidebar-footer">
          <button
            className="sidebar-item danger"
            onClick={() => {
              if (confirm('lock and return to password screen?')) {
                localStorage.removeItem(AUTH_KEY);
                setAuthed(false);
              }
            }}
          >
            <span className="sidebar-item__icon" aria-hidden="true">⚷</span>
            lock
          </button>
        </div>
      </nav>

      {/* ── Main area ───────────────────────────────────────────────── */}
      <div className="main-area">
        <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {mode === 'explore' ? (
            <Canvas
              apiKey={API_KEY}
              onCardsGenerated={handleCardsGenerated}
              importedState={importedState}
              activePanel={activePanel}
              onPanelClose={() => setActivePanel(null)}
              onRegisterAddNote={fn => { addNoteRef.current = fn; }}
              onUsageChange={setUsageCount}
              onRegisterClearCanvas={fn => { clearCanvasRef.current = fn; }}
            />
          ) : (
            <RememberMode newCards={newCards} />
          )}
        </main>

        <footer className="status-bar">
          <span className="status-bar__item">
            <span className="status-bar__dot" aria-hidden="true" />
            {mode === 'explore' ? 'explore' : 'remember'} mode
          </span>
          <span
            role="status"
            aria-live="polite"
            className={`status-bar__item${limitReached ? ' low' : ''}`}
          >
            <span className="status-bar__dot" aria-hidden="true" />
            {limitReached ? 'daily limit reached' : `${usageCount}/10 expansions today`}
          </span>
        </footer>
      </div>
    </div>
  );
}
