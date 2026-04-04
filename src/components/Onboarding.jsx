import { useState } from 'react';

export default function Onboarding({ onSave }) {
  const [key, setKey] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = key.trim();
    if (!trimmed.startsWith('sk-ant-')) return;
    onSave(trimmed);
  }

  const valid = key.trim().startsWith('sk-ant-');

  return (
    <div className="onboarding-overlay">
      <form className="onboarding-card" onSubmit={handleSubmit}>
        <div className="onboarding-logo">Webs</div>
        <p className="onboarding-tagline">
          A non-linear canvas for exploring ideas — every note you add unfolds
          into its historical, political, cultural, and technological context.
        </p>

        <div className="onboarding-label">Anthropic API Key</div>
        <input
          className="onboarding-input"
          type="password"
          placeholder="sk-ant-api03-…"
          value={key}
          onChange={e => setKey(e.target.value)}
          autoFocus
          spellCheck={false}
        />
        <p className="onboarding-hint">
          Your key is stored only in this browser and never sent anywhere except
          directly to Anthropic.{' '}
          <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer">
            Get a key →
          </a>
        </p>

        <div className="onboarding-actions">
          <button className="btn btn-primary" type="submit" disabled={!valid}>
            Start exploring
          </button>
        </div>
      </form>
    </div>
  );
}
