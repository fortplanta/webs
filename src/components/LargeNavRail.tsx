import { useState } from 'react';
import { Tooltip } from '../nd/molecules/Tooltip/Tooltip';
import { Input } from '../nd/atoms/Input/Input';
import './LargeNavRail.css';

export interface PromptCard {
  id: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}

export interface NavItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
  panel?: {
    title: string;
    cards: PromptCard[];
  };
}

interface LargeNavRailProps {
  items: NavItem[];
  activeId: string;
  onSelect: (id: string) => void;
  userAvatar?: string;
}

export function LargeNavRail({ items, activeId, onSelect, userAvatar }: LargeNavRailProps) {
  const [openPanelId, setOpenPanelId] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const openPanel = items.find(i => i.id === openPanelId)?.panel ?? null;

  function handleNavClick(item: NavItem) {
    if (item.panel) {
      setOpenPanelId(prev => {
        if (prev === item.id) { setQuery(''); return null; }
        setQuery('');
        return item.id;
      });
    } else {
      setOpenPanelId(null);
      setQuery('');
      onSelect(item.id);
    }
  }

  return (
    <nav className="lnr" aria-label="Main navigation">
      {/* Slide-out panel — renders before rail so it slides from behind */}
      {openPanel && (
        <div aria-hidden="true" className="lnr__panel-blur" />
      )}
      {openPanel && (
        <div className="lnr__panel" role="dialog" aria-label={openPanel.title}>
          <div className="lnr__panel-header">
            <Input
              placeholder="search…"
              size="sm"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            <button
              className="lnr__panel-close"
              aria-label="Close panel"
              onClick={() => { setOpenPanelId(null); setQuery(''); }}
            >
              close
            </button>
          </div>
          <div className="lnr__panel-grid">
            {openPanel.cards
              .filter(c => !query || c.label.toLowerCase().includes(query.toLowerCase()))
              .map(card => (
                <button
                  key={card.id}
                  className="lnr__prompt-card"
                  onClick={() => { card.onClick?.(); setOpenPanelId(null); setQuery(''); }}
                >
                  <span className="lnr__prompt-icon">{card.icon}</span>
                  <span className="lnr__prompt-label">{card.label}</span>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Rail */}
      <div className="lnr__rail">
        <div className="lnr__items">
          {items.map(item => {
            const isPanelOpen = openPanelId === item.id;
            const isActive = item.id === activeId && !item.panel;
            return (
              <Tooltip key={item.id} content={item.label} placement="right" disabled={isPanelOpen}>
                <button
                  className={[
                    'lnr__btn',
                    isActive ? 'lnr__btn--active' : '',
                    isPanelOpen ? 'lnr__btn--panel-open' : '',
                  ].filter(Boolean).join(' ')}
                  aria-label={item.label}
                  aria-expanded={item.panel ? isPanelOpen : undefined}
                  aria-current={isActive ? 'page' : undefined}
                  disabled={item.disabled}
                  onClick={() => handleNavClick(item)}
                >
                  {item.icon}
                </button>
              </Tooltip>
            );
          })}
        </div>
        <div className="lnr__footer">
          {userAvatar ? (
            <img src={userAvatar} alt="User avatar" className="lnr__avatar" />
          ) : (
            <div className="lnr__avatar-placeholder" aria-hidden="true">u</div>
          )}
        </div>
      </div>
    </nav>
  );
}
