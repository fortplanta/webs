import { useState } from 'react';
import '../styles/webs-tokens.css';
import { UnifiedContextMenu } from './UnifiedContextMenu';
import { FloatingToolbar } from './FloatingToolbar';
import { LargeNavRail } from './LargeNavRail';
import { RadialMenu } from './RadialMenu';
import { TimelineFeed } from './TimelineFeed';
import { MediaPlayerWidget } from './MediaPlayerWidget';

// ─── Sample data ──────────────────────────────────────────────

// 8 items → search input visible in UnifiedContextMenu
const ctxItems = [
  { id: 'edit', label: 'Edit fragment', icon: '✏️', shortcut: '⌘E' },
  { id: 'dupe', label: 'Duplicate', icon: '⎘', shortcut: '⌘D', description: 'copies to same cluster' },
  { id: 'pivot', label: 'Pivot from here', icon: '🔀', shortcut: '⌘P', submenu: [
    { id: 'piv-related', label: 'Related concepts', icon: '◎', onClick: () => alert('related') },
    { id: 'piv-contra', label: 'Counterarguments', icon: '↔', onClick: () => alert('contra') },
    { id: 'piv-deeper', label: 'Go deeper', icon: '↓', onClick: () => alert('deeper') },
  ]},
  { id: 'star', label: 'Star', icon: '⭐', shortcut: '⌘S' },
  { id: 'expand', label: 'Expand cluster', icon: '⤢', shortcut: '⌘⤢' },
  { id: 'link', label: 'Link to cluster', icon: '⟶', shortcut: '⌘L' },
  { id: 'history', label: 'View history', icon: '◷', description: 'see all past versions' },
  { id: 'delete', label: 'Delete fragment', icon: '🗑', variant: 'destructive' as const, shortcut: '⌫', onClick: () => alert('deleted') },
];

const tools = [
  { id: 'select', icon: '↖', label: 'Select', shortcut: 'V' },
  { id: 'pan', icon: '✋', label: 'Pan', shortcut: 'H' },
  { id: 'fragment', icon: '◻', label: 'Add fragment', shortcut: 'F', subtypes: [
    { id: 'concept', icon: '◎', label: 'Concept' },
    { id: 'person', icon: '◉', label: 'Person' },
    { id: 'quote', icon: '"', label: 'Quote' },
    { id: 'source', icon: '⎘', label: 'Source' },
  ]},
  { id: 'connect', icon: '—', label: 'Connect clusters', shortcut: 'C', dividerBefore: true },
  { id: 'note', icon: '✎', label: 'Note', shortcut: 'N' },
];

const navItems = [
  { id: 'canvas', icon: '◻', label: 'Canvas' },
  { id: 'library', icon: '⎘', label: 'Library' },
  { id: 'graph', icon: '◎', label: 'Graph view' },
  { id: 'prompts', icon: '✦', label: 'Prompts', panel: {
    title: 'Prompt library',
    cards: [
      { id: 'p1', icon: '◎', label: 'New concept' },
      { id: 'p2', icon: '◉', label: 'Add person' },
      { id: 'p3', icon: '"', label: 'Quote' },
      { id: 'p4', icon: '⎘', label: 'Add source' },
      { id: 'p5', icon: '↔', label: 'Counterpoint' },
      { id: 'p6', icon: '↓', label: 'Go deeper' },
      { id: 'p7', icon: '◷', label: 'Timeline event' },
      { id: 'p8', icon: '⤢', label: 'Expand cluster' },
    ],
  }},
  { id: 'settings', icon: '⚙', label: 'Settings' },
];

const radialItems = [
  { id: 'fact-check', icon: '🔍', label: 'Fact check' },
  { id: 'pivot', icon: '🔀', label: 'Pivot' },
  { id: 'star', icon: '⭐', label: 'Star' },
  { id: 'expand', icon: '⤢', label: 'Expand' },
  { id: 'delete', icon: '🗑', label: 'Delete' },
];

const feedItems = [
  { id: '1', date: 'May 17', title: 'The Medici banking network as a model for knowledge diffusion', body: "Exploring how the Medici family's patronage of art and scholarship mirrors modern platform economies.", isFeatured: true, isNew: true },
  { id: '2', date: 'May 15', title: 'Renaissance humanism and the rediscovery of classical texts', body: 'How the fall of Constantinople brought Greek scholars westward.', isNew: true },
  { id: '3', date: 'May 12', title: 'Gutenberg and the economics of knowledge distribution', body: 'The printing press as a demand-side shock to literacy markets.' },
  { id: '4', date: 'May 10', title: 'Patronage vs. market models for creative production', body: 'Comparing the Florentine commission system to modern streaming royalties.' },
];

// ─── Demo shell ───────────────────────────────────────────────

export function Demo() {
  const [showCtx, setShowCtx] = useState(false);
  const [ctxPos, setCtxPos] = useState({ x: 0, y: 0 });
  const [activeTool, setActiveTool] = useState('select');
  const [activeNav, setActiveNav] = useState('canvas');
  const [radialActive, setRadialActive] = useState('pivot');
  const [showRadial, setShowRadial] = useState(false);
  const [radialPos, setRadialPos] = useState({ x: 0, y: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(42);

  return (
    <div style={{ fontFamily: 'var(--font-primary)', background: '#f0f0f0', minHeight: '100vh', display: 'flex' }}>

      {/* Nav Rail */}
      <LargeNavRail items={navItems} activeId={activeNav} onSelect={setActiveNav} />

      {/* Main area */}
      <div style={{ flex: 1, padding: '32px', display: 'flex', flexDirection: 'column', gap: '40px', overflow: 'auto' }}>

        <h1 style={{ fontFamily: 'var(--font-primary)', fontWeight: 400, fontSize: 14, letterSpacing: '-0.03em', margin: 0, color: '#555' }}>
          component preview — webs design system
        </h1>

        {/* Row 1: Media player + context menu */}
        <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
          <div>
            <Label>MediaPlayerWidget</Label>
            <MediaPlayerWidget
              title="The Medici Network"
              subtitle="Episode 3 · Renaissance Mind"
              duration={3240}
              currentTime={currentTime}
              isPlaying={isPlaying}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onSeek={setCurrentTime}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Label>UnifiedContextMenu — 8 items triggers search</Label>
            <button
              style={{ fontFamily: 'var(--font-primary)', fontSize: 12, padding: '8px 14px', border: '1px solid #ccc', background: '#fff', cursor: 'pointer', borderRadius: 0, textAlign: 'left' }}
              onClick={e => { setCtxPos({ x: e.clientX, y: e.clientY }); setShowCtx(true); }}
            >
              click to open context menu
            </button>
            <p style={{ fontSize: 11, color: '#888', margin: 0 }}>type to filter · hover "Pivot" for submenu · ↑↓ to navigate</p>
            {showCtx && (
              <UnifiedContextMenu items={ctxItems} position={ctxPos} onClose={() => setShowCtx(false)} />
            )}
          </div>
        </div>

        {/* Row 2: Radial menu */}
        <div>
          <Label>RadialMenu — opens at cursor</Label>
          <button
            style={{ fontFamily: 'var(--font-primary)', fontSize: 12, padding: '8px 14px', border: '1px solid #ccc', background: '#fff', cursor: 'pointer', borderRadius: 0 }}
            onClick={e => { setRadialPos({ x: e.clientX, y: e.clientY }); setShowRadial(true); }}
          >
            open radial menu
          </button>
          {showRadial && (
            <RadialMenu
              items={radialItems}
              activeId={radialActive}
              position={radialPos}
              onSelect={id => { setRadialActive(id); setShowRadial(false); }}
              onClose={() => setShowRadial(false)}
            />
          )}
        </div>

        {/* Row 3: Floating toolbar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <Label>FloatingToolbar + ToolSubmenuGrid — click ◻ for subtype grid</Label>
          <FloatingToolbar tools={tools} activeTool={activeTool} onToolSelect={setActiveTool} />
          <p style={{ fontSize: 11, color: '#888', margin: 0 }}>active: {activeTool}</p>
        </div>

        <div style={{ height: 120 }} />
      </div>

      {/* TimelineFeed — fixed bottom-right */}
      <TimelineFeed items={feedItems} onItemClick={id => alert(`item: ${id}`)} defaultOpen />
    </div>
  );
}

function Label({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <p style={{ fontFamily: 'var(--font-primary)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#888', margin: '0 0 8px', ...style }}>
      {children}
    </p>
  );
}
