import { useState } from 'react';
import { Badge } from '../nd/atoms/Badge/Badge';
import './TimelineFeed.css';

export interface FeedItem {
  id: string;
  date: string;
  title: string;
  body: string;
  image?: string;
  isNew?: boolean;
  isFeatured?: boolean;
}

interface TimelineFeedProps {
  items: FeedItem[];
  onItemClick: (id: string) => void;
  defaultOpen?: boolean;
}

export function TimelineFeed({ items, onItemClick, defaultOpen = false }: TimelineFeedProps) {
  const [open, setOpen] = useState(defaultOpen);

  const featured = items.find(i => i.isFeatured) ?? items[0];
  const rest = items.filter(i => i !== featured);
  const newCount = items.filter(i => i.isNew).length;
  const hasNew = newCount > 0;

  return (
    <div className="tf">
      {open && (
        <div className="tf__panel">
          {featured && (
            <div className="tf__featured" onClick={() => { onItemClick(featured.id); }}>
              {featured.image && (
                <img src={featured.image} alt="" className="tf__featured-img" />
              )}
              <div className="tf__featured-body">
                <div className="tf__featured-meta">
                  <span className="tf__featured-date">{featured.date}</span>
                  {featured.isNew && <Badge variant="primary" size="sm">new</Badge>}
                </div>
                <p className="tf__featured-title">{featured.title}</p>
                <p className="tf__featured-excerpt">{featured.body}</p>
              </div>
            </div>
          )}

          <div className="tf__list">
            {rest.map((item, i) => (
              <div key={item.id} className="tf__item" onClick={() => onItemClick(item.id)}>
                <div className="tf__timeline-col">
                  <div className={['tf__dot', item.isNew ? 'tf__dot--new' : ''].filter(Boolean).join(' ')} />
                  {i < rest.length - 1 && <div className="tf__line" />}
                </div>
                <div className="tf__item-content">
                  <div className="tf__item-meta">
                    <span className="tf__item-date">{item.date}</span>
                    {item.isNew && <Badge variant="primary" size="sm">new</Badge>}
                  </div>
                  <p className="tf__item-title">{item.title}</p>
                  <p className="tf__item-body">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button className="tf__trigger" onClick={() => setOpen(o => !o)}>
        <span className={['tf__trigger-dot', hasNew ? 'tf__trigger-dot--new' : ''].filter(Boolean).join(' ')} />
        activity
        {newCount > 0 && <span className="tf__trigger-count">{newCount}</span>}
        <span className={['tf__trigger-arrow', open ? 'tf__trigger-arrow--open' : ''].filter(Boolean).join(' ')}>▲</span>
      </button>
    </div>
  );
}
