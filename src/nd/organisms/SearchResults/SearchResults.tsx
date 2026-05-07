import './SearchResults.css';
import { Chip } from '../../atoms/Chip/Chip';
import type { Category } from '../../atoms/Chip/Chip';

export interface SearchResult {
  id: string;
  title: string;
  excerpt?: string;
  category: Category;
  active?: boolean;
}

interface SearchResultsProps {
  results: SearchResult[];
  onSelect?: (id: string) => void;
  className?: string;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  onSelect,
  className = '',
}) => (
  <div className={['nd-search-results', className].filter(Boolean).join(' ')}>
    <div className="nd-search-results__count">{results.length} result{results.length !== 1 ? 's' : ''}</div>
    <div className="nd-search-results__list">
      {results.map(r => (
        <button
          key={r.id}
          className={['nd-search-result', r.active ? 'nd-search-result--active' : ''].filter(Boolean).join(' ')}
          onClick={() => onSelect?.(r.id)}
        >
          <Chip category={r.category} size="sm">{r.category}</Chip>
          <div className="nd-search-result__content">
            <div className="nd-search-result__title">{r.title}</div>
            {r.excerpt && <div className="nd-search-result__excerpt">{r.excerpt}</div>}
          </div>
        </button>
      ))}
    </div>
  </div>
);
