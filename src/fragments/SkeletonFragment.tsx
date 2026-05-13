import '../styles/skeleton.css';

interface Props {
  x: number;
  y: number;
}

export default function SkeletonFragment({ x, y }: Props) {
  return (
    <div className="skeleton-fragment" style={{ left: x, top: y }}>
      <div className="skeleton-line skeleton-line--header" />
      <div className="skeleton-line skeleton-line--full" />
      <div className="skeleton-line skeleton-line--medium" />
      <div className="skeleton-line skeleton-line--full" />
      <div className="skeleton-line skeleton-line--short" />
      <div className="skeleton-line skeleton-line--medium" />
    </div>
  );
}
