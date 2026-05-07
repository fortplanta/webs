import { Spinner } from '../nd/atoms/Spinner/Spinner';
import { Button } from '../nd/atoms/Button/Button';

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
            <Button variant="secondary" size="sm" onClick={onRetry}>
              try again
            </Button>
          )}
        </div>
      ) : (
        <div className="loading-canvas__strip">
          <Spinner variant="strip" width={240} />
        </div>
      )}
    </div>
  );
}
