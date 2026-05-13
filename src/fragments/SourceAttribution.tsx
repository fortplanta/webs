import { useState } from 'react';
import type { FragmentSource } from '../api/types';

interface Props {
  sources: FragmentSource[];
}

export default function SourceAttribution({ sources }: Props) {
  if (!sources || sources.length === 0) return null;
  const primary = sources[0];
  const extra = sources.length - 1;

  return (
    <div className="source-attribution">
      <FaviconImg src={primary.faviconUrl} domain={primary.domain} />
      <span className="source-attribution__label">
        {primary.label}{extra > 0 ? ` +${extra} other` : ''}
      </span>
      {sources.length > 1 && (
        <div className="source-attribution__tooltip">
          {sources.map(s => (
            <span key={s.url}>{s.label} — {s.domain}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function FaviconImg({ src, domain }: { src: string; domain: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span className="source-attribution__favicon-fallback">
        {domain[0]}
      </span>
    );
  }
  return (
    <img
      className="source-attribution__favicon"
      src={src}
      alt={domain}
      onError={() => setFailed(true)}
    />
  );
}
