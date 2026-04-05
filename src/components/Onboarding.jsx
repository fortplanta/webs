import { useState } from 'react';
import { Input, Button, Typography } from 'antd';

const { Text, Link } = Typography;

export default function Onboarding({ onSave }) {
  const [key, setKey] = useState('');
  const valid = key.trim().startsWith('sk-ant-');

  function handleSubmit() {
    const trimmed = key.trim();
    if (!valid) return;
    onSave(trimmed);
  }

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-card">
        <div className="onboarding-logo">Webs</div>

        <Text
          type="secondary"
          style={{ display: 'block', marginBottom: 24, lineHeight: 1.55, fontSize: 13 }}
        >
          A non-linear canvas for exploring ideas — every note you add unfolds
          into its historical, political, cultural, and technological context.
        </Text>

        <Text
          style={{
            display: 'block',
            marginBottom: 8,
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--color-text-dim)',
          }}
        >
          Anthropic API Key
        </Text>

        <Input.Password
          placeholder="sk-ant-api03-…"
          value={key}
          onChange={e => setKey(e.target.value)}
          onPressEnter={handleSubmit}
          autoFocus
          spellCheck={false}
          style={{ marginBottom: 8 }}
        />

        <Text
          type="secondary"
          style={{ display: 'block', fontSize: 12, marginBottom: 24, lineHeight: 1.55 }}
        >
          Your key is stored only in this browser and never sent anywhere except
          directly to Anthropic.{' '}
          <Link href="https://console.anthropic.com/settings/keys" target="_blank">
            Get a key →
          </Link>
        </Text>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button type="primary" disabled={!valid} onClick={handleSubmit}>
            Start exploring
          </Button>
        </div>
      </div>
    </div>
  );
}
