import { useState, useEffect } from 'react';
import { CATEGORY_BY_KEY, SR_INTERVALS, STORAGE_KEYS } from '../constants';

function loadCards() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CARDS);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveCards(cards) {
  try {
    localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(cards));
  } catch { /* quota */ }
}

export default function RememberMode({ newCards }) {
  const [cards, setCards] = useState(loadCards);
  const [flipped, setFlipped] = useState(false);
  const [idx, setIdx] = useState(0);

  // Merge in newly generated cards
  useEffect(() => {
    if (!newCards?.length) return;
    setCards(prev => {
      // Deduplicate by question
      const existing = new Set(prev.map(c => c.question));
      const toAdd = newCards.filter(c => !existing.has(c.question));
      if (!toAdd.length) return prev;
      const updated = [...prev, ...toAdd];
      saveCards(updated);
      return updated;
    });
  }, [newCards]);

  // Due cards: dueDate <= now
  const now = new Date().toISOString();
  const due = cards.filter(c => c.dueDate <= now);

  function rate(rating) {
    // rating: 0=again, 1=hard, 2=good
    const card = due[idx];
    const intervalDays = SR_INTERVALS[rating];
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + intervalDays);

    setCards(prev => {
      const updated = prev.map(c =>
        c.id === card.id
          ? { ...c, dueDate: dueDate.toISOString(), interval: intervalDays }
          : c
      );
      saveCards(updated);
      return updated;
    });

    setFlipped(false);
    setIdx(i => (i + 1 >= due.length ? 0 : i + 1));
  }

  if (due.length === 0) {
    return (
      <div className="remember-view">
        <div className="remember-empty">
          <h2>Nothing due right now.</h2>
          <p>
            {cards.length === 0
              ? 'Explore the canvas and reveal context nodes — review cards will appear here.'
              : `All ${cards.length} cards are reviewed. Check back later.`}
          </p>
        </div>
      </div>
    );
  }

  const card = due[idx % due.length];
  const cat = CATEGORY_BY_KEY[card.category];

  return (
    <div className="remember-view">
      <div className="card-counter">
        {idx + 1} / {due.length} due today
      </div>

      <div className="flip-card" onClick={() => setFlipped(f => !f)}>
        <div className={`flip-card__inner${flipped ? ' flipped' : ''}`}>
          {/* Front */}
          <div className="flip-card__front">
            <div className="flip-card__type">
              {card.type === 'connection' ? 'Connection' : card.type === 'reversal' ? 'Reversal' : 'Context'}
            </div>
            {card.anchorTitle && (
              <div className="flip-card__category" style={{ color: cat?.color }}>
                {cat?.icon} {card.categoryLabel}
              </div>
            )}
            <div className="flip-card__question">{card.question}</div>
            <div className="flip-card__hint">Tap to reveal</div>
          </div>

          {/* Back */}
          <div className="flip-card__back">
            <div className="flip-card__category" style={{ color: cat?.color }}>
              {cat?.icon} {card.categoryLabel}
            </div>
            <div className="flip-card__answer">{card.answer}</div>
          </div>
        </div>
      </div>

      {flipped && (
        <div className="card-actions">
          <button className="card-rating again" onClick={() => rate(0)}>Again</button>
          <button className="card-rating hard" onClick={() => rate(1)}>Hard</button>
          <button className="card-rating good" onClick={() => rate(2)}>Got it</button>
        </div>
      )}
    </div>
  );
}
