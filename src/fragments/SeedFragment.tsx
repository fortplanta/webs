import '../styles/seed-fragment.css';

interface Props {
  query: string;
  context: string;
  x: number;
  y: number;
  onMouseDown: (e: React.MouseEvent) => void;
}

export default function SeedFragment({ query, context, x: _x, y: _y, onMouseDown }: Props) {
  // x, y are no longer used for positioning — the Three.js group in Canvas handles that.
  return (
    <div
      className="seed-fragment"
      onMouseDown={onMouseDown}
    >
      <span className="seed-fragment__eyebrow">exploring</span>
      <h1 className="seed-fragment__query">{query.toLowerCase()}</h1>
      {context && (
        <p className="seed-fragment__context">{context}</p>
      )}
    </div>
  );
}
