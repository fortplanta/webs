import { useState, useEffect, useRef } from 'react';

const STYLE_ID = 'webs-live-css';

function injectCSS(css) {
  let el = document.getElementById(STYLE_ID);
  if (!el) {
    el = document.createElement('style');
    el.id = STYLE_ID;
    document.head.appendChild(el);
  }
  el.textContent = css;
}

function clearCSS() {
  const el = document.getElementById(STYLE_ID);
  if (el) el.textContent = '';
}

export default function CSSInspector({ onClose }) {
  const [css, setCss] = useState('/* Type CSS here — changes apply instantly */\n\n');
  const textareaRef = useRef(null);

  useEffect(() => {
    textareaRef.current?.focus();
    return () => clearCSS(); // clear on unmount
  }, []);

  function handleChange(e) {
    const val = e.target.value;
    setCss(val);
    injectCSS(val);
  }

  function handleReset() {
    setCss('');
    clearCSS();
  }

  function handleCopy() {
    navigator.clipboard.writeText(css).catch(() => {});
  }

  // Tab key inserts spaces instead of changing focus
  function handleKeyDown(e) {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const next = css.slice(0, start) + '  ' + css.slice(end);
      setCss(next);
      injectCSS(next);
      requestAnimationFrame(() => {
        textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
      });
    }
  }

  return (
    <div className="css-inspector">
      <div className="css-inspector__header">
        <span className="css-inspector__title">CSS Inspector</span>
        <div className="css-inspector__actions">
          <button className="btn btn-tool" onClick={handleReset}>Reset</button>
          <button className="btn btn-tool" onClick={handleCopy}>Copy</button>
          <button className="btn btn-tool" onClick={onClose}>✕</button>
        </div>
      </div>
      <textarea
        ref={textareaRef}
        className="css-inspector__textarea"
        value={css}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        placeholder="/* Type CSS here — changes apply instantly */"
      />
      <div className="css-inspector__footer">
        <span className="css-inspector__hint">Changes are not saved and will not be committed</span>
      </div>
    </div>
  );
}
