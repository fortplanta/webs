interface LoadingCanvasProps {
  query: string;
  error?: string | null;
  onRetry?: () => void;
}

export default function LoadingCanvas({ query, error, onRetry }: LoadingCanvasProps) {
  return (
    <div className="loading-canvas">
      <span className="loading-canvas__query">{query.toLowerCase()}</span>
      {error ? (
        <div className="loading-canvas__error">
          <span>{error}</span>
          {onRetry && (
            <button className="loading-canvas__retry" onClick={onRetry}>
              try again
            </button>
          )}
        </div>
      ) : (
        <div className="loading-canvas__strip">
          <div className="loading-canvas__track" />
          <div className="loading-canvas__head" />
        </div>
      )}
    </div>
  );
}
