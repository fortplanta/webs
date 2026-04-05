import { useState, useEffect, useRef, useCallback } from 'react';

const STYLE_ID = 'webs-live-css';
const INSPECT_PROPS = [
  'display', 'flex-direction', 'align-items', 'justify-content', 'gap',
  'width', 'height', 'min-width', 'max-width',
  'padding', 'margin',
  'background-color', 'color',
  'border', 'border-radius', 'box-shadow',
  'font-size', 'font-weight', 'line-height', 'letter-spacing',
  'opacity', 'cursor', 'overflow', 'pointer-events',
];

function injectCSS(css) {
  let el = document.getElementById(STYLE_ID);
  if (!el) { el = document.createElement('style'); el.id = STYLE_ID; document.head.appendChild(el); }
  el.textContent = css;
}

function clearCSS() {
  const el = document.getElementById(STYLE_ID);
  if (el) el.textContent = '';
}

function buildSelector(el) {
  if (!el) return '';
  let sel = el.tagName.toLowerCase();
  if (el.id) sel += `#${el.id}`;
  if (el.className && typeof el.className === 'string') {
    const classes = el.className.trim().split(/\s+/).filter(Boolean);
    // Skip utility/dynamic classes that are hard to target
    classes.slice(0, 3).forEach(c => { sel += `.${c}`; });
  }
  return sel;
}

function captureStyles(el) {
  if (!el) return '';
  const computed = window.getComputedStyle(el);
  const lines = INSPECT_PROPS
    .map(p => `  ${p}: ${computed.getPropertyValue(p)};`)
    .filter(line => {
      const val = line.split(': ')[1]?.replace(';', '').trim();
      return val && val !== '' && val !== 'normal' && val !== 'auto' && val !== 'none' && val !== '0px';
    });
  return lines.join('\n');
}

export default function CSSInspector({ onClose }) {
  const [picking, setPicking]         = useState(false);
  const [hoveredRect, setHoveredRect] = useState(null);
  const [inspected, setInspected]     = useState(null);  // { selector, styles }
  const [override, setOverride]       = useState('');
  const overlayRef  = useRef(null);
  const textareaRef = useRef(null);

  // Inject override CSS whenever it changes
  useEffect(() => { injectCSS(override); }, [override]);

  // Clear on unmount
  useEffect(() => () => clearCSS(), []);

  // ── Picker: mousemove ────────────────────────────────────────────────────
  const handlePickerMove = useCallback((e) => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    overlay.style.display = 'none';
    const el = document.elementFromPoint(e.clientX, e.clientY);
    overlay.style.display = 'block';

    if (!el || el === document.body || el === document.documentElement) {
      setHoveredRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setHoveredRect({ left: r.left, top: r.top, width: r.width, height: r.height, selector: buildSelector(el) });
  }, []);

  // ── Picker: click ────────────────────────────────────────────────────────
  const handlePickerClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const overlay = overlayRef.current;
    if (!overlay) return;
    overlay.style.display = 'none';
    const el = document.elementFromPoint(e.clientX, e.clientY);
    overlay.style.display = 'block';

    if (!el) return;
    setPicking(false);
    setHoveredRect(null);

    const selector = buildSelector(el);
    const styles   = captureStyles(el);
    setInspected({ selector, styles });
    const initialOverride = `/* Override — ${selector} */\n${selector} {\n  \n}`;
    setOverride(initialOverride);
    injectCSS(initialOverride);
    // Focus textarea after state settles
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, []);

  function handleOverrideChange(e) {
    const val = e.target.value;
    setOverride(val);
    injectCSS(val);
  }

  function handleTabKey(e) {
    if (e.key === 'Tab') {
      e.preventDefault();
      const { selectionStart: s, selectionEnd: end } = e.target;
      const next = override.slice(0, s) + '  ' + override.slice(end);
      setOverride(next);
      injectCSS(next);
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = s + 2;
        }
      });
    }
  }

  function handleReset() { setOverride(''); clearCSS(); }
  function handleCopy() { navigator.clipboard.writeText(override).catch(() => {}); }

  return (
    <>
      {/* ── Picker overlay ── */}
      {picking && (
        <div
          ref={overlayRef}
          className="css-picker-overlay"
          onMouseMove={handlePickerMove}
          onClick={handlePickerClick}
        />
      )}

      {/* ── Hover highlight ── */}
      {picking && hoveredRect && (
        <div
          className="css-picker-highlight"
          style={{
            left:   hoveredRect.left,
            top:    hoveredRect.top,
            width:  hoveredRect.width,
            height: hoveredRect.height,
          }}
        >
          <span className="css-picker-label">{hoveredRect.selector}</span>
        </div>
      )}

      {/* ── Inspector panel ── */}
      <div className="css-inspector" data-panel="css">
        <div className="css-inspector__header">
          <span className="css-inspector__title">CSS Inspector</span>
          <div className="css-inspector__actions">
            <button
              className={`btn btn-tool${picking ? ' btn-active' : ''}`}
              onClick={() => setPicking(p => !p)}
              title="Pick an element to inspect"
            >
              {picking ? '◎ Picking…' : '◎ Pick'}
            </button>
            <button className="btn btn-tool" onClick={handleReset} title="Clear overrides">Reset</button>
            <button className="btn btn-tool" onClick={handleCopy} title="Copy CSS to clipboard">Copy</button>
            <button className="btn btn-tool" onClick={onClose} title="Close inspector">✕</button>
          </div>
        </div>

        {/* Inspected element computed styles (read-only) */}
        {inspected ? (
          <div className="css-inspector__inspected">
            <div className="css-inspector__selector">{inspected.selector}</div>
            <pre className="css-inspector__computed">{inspected.styles}</pre>
          </div>
        ) : (
          <div className="css-inspector__empty">
            <span>Click <strong>◎ Pick</strong> then click any element to inspect its styles</span>
          </div>
        )}

        {/* Override editor */}
        <div className="css-inspector__override-header">
          <span className="css-inspector__override-label">CSS Override</span>
          <span className="css-inspector__hint">Changes apply instantly · not saved</span>
        </div>
        <textarea
          ref={textareaRef}
          className="css-inspector__textarea"
          value={override}
          onChange={handleOverrideChange}
          onKeyDown={handleTabKey}
          spellCheck={false}
          placeholder={`/* Pick an element first, or type any CSS rule here */\n\n.my-class {\n  color: red;\n}`}
        />
      </div>
    </>
  );
}
