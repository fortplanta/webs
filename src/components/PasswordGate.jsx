import { useState } from 'react';

export default function PasswordGate({ onUnlock }) {
  const [value, setValue]   = useState('');
  const [error, setError]   = useState(false);
  const [shaking, setShake] = useState(false);

  function submit() {
    const correct = import.meta.env.VITE_SITE_PASSWORD;
    if (value === correct) {
      onUnlock();
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setValue('');
    }
  }

  return (
    <div className="password-gate">
      <div className={`password-gate__card${shaking ? ' shake' : ''}`}>
        <div className="password-gate__logo">webs</div>
        <p className="password-gate__desc">
          a non-linear canvas for exploring ideas
        </p>
        <input
          className={`password-gate__input${error ? ' error' : ''}`}
          type="password"
          placeholder="password"
          value={value}
          autoFocus
          onChange={e => { setValue(e.target.value); setError(false); }}
          onKeyDown={e => e.key === 'Enter' && submit()}
        />
        {error && <p className="password-gate__error">incorrect password</p>}
        <button className="password-gate__btn" onClick={submit}>
          enter
        </button>
      </div>
    </div>
  );
}
