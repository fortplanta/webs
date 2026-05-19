import { useState, useRef } from 'react';
import { Tooltip } from '../nd/molecules/Tooltip/Tooltip';
import { ToolSubmenuGrid } from './ToolSubmenuGrid';
import type { ToolSubtype } from './ToolSubmenuGrid';
import './FloatingToolbar.css';

export interface ToolDefinition {
  id: string;
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  subtypes?: ToolSubtype[];
  dividerBefore?: boolean;
}

interface FloatingToolbarProps {
  tools: ToolDefinition[];
  activeTool: string;
  onToolSelect: (id: string) => void;
}

export function FloatingToolbar({ tools, activeTool, onToolSelect }: FloatingToolbarProps) {
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const btnRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  return (
    <div className="ftb" role="toolbar">
      {tools.map(tool => {
        const isActive = activeTool === tool.id ||
          (tool.subtypes?.some(s => s.id === activeTool) ?? false);
        const hasSubmenu = (tool.subtypes?.length ?? 0) > 0;
        const submenuOpen = openSubmenu === tool.id;

        const btnRef = (el: HTMLButtonElement | null) => {
          if (el) btnRefs.current.set(tool.id, el);
          else btnRefs.current.delete(tool.id);
        };

        return (
          <span key={tool.id} style={{ display: 'contents' }}>
            {tool.dividerBefore && <div className="ftb__divider" aria-hidden="true" />}
            <span style={{ position: 'relative' }}>
              <Tooltip content={`${tool.label}${tool.shortcut ? ` (${tool.shortcut})` : ''}`} placement="top">
                <button
                  ref={btnRef}
                  className={['ftb__btn', isActive ? 'ftb__btn--active' : ''].filter(Boolean).join(' ')}
                  aria-label={tool.label}
                  aria-pressed={isActive}
                  onClick={() => {
                    if (hasSubmenu) {
                      setOpenSubmenu(submenuOpen ? null : tool.id);
                    } else {
                      onToolSelect(tool.id);
                      setOpenSubmenu(null);
                    }
                  }}
                >
                  {tool.icon}
                </button>
              </Tooltip>

              {hasSubmenu && submenuOpen && (
                <div className="ftb__popup">
                  <ToolSubmenuGrid
                    items={tool.subtypes!}
                    activeId={activeTool}
                    anchorRef={{ current: btnRefs.current.get(tool.id) ?? null }}
                    onSelect={id => { onToolSelect(id); setOpenSubmenu(null); }}
                    onClose={() => setOpenSubmenu(null)}
                  />
                </div>
              )}
            </span>
          </span>
        );
      })}
    </div>
  );
}
