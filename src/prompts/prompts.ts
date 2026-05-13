import React from 'react';

export interface Prompt {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const iconProps = {
  viewBox: '0 0 16 16',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  width: 16,
  height: 16,
};

export const PROMPTS: Prompt[] = [
  {
    id: 'explain-simple',
    label: 'made simple',
    icon: React.createElement('svg', iconProps,
      React.createElement('path', { d: 'M8 2a4 4 0 0 1 2.83 6.83A2 2 0 0 0 10 10H6a2 2 0 0 0-.83-1.17A4 4 0 0 1 8 2z' }),
      React.createElement('path', { d: 'M6 12h4M6.5 14h3' }),
    ),
  },
  {
    id: 'visual-learning',
    label: 'visual learning',
    icon: React.createElement('svg', iconProps,
      React.createElement('ellipse', { cx: 8, cy: 8, rx: 7, ry: 4 }),
      React.createElement('circle', { cx: 8, cy: 8, r: 2 }),
    ),
  },
  {
    id: 'fact-check',
    label: 'fact check',
    icon: React.createElement('svg', iconProps,
      React.createElement('circle', { cx: 8, cy: 8, r: 6 }),
      React.createElement('path', { d: 'M5.5 8l2 2 3-3' }),
    ),
  },
  {
    id: 'find-similarities',
    label: 'find similarities',
    icon: React.createElement('svg', iconProps,
      React.createElement('circle', { cx: 6, cy: 8, r: 4 }),
      React.createElement('circle', { cx: 10, cy: 8, r: 4 }),
    ),
  },
  {
    id: 'steelman',
    label: 'steelman',
    icon: React.createElement('svg', iconProps,
      React.createElement('line', { x1: 8, y1: 2, x2: 8, y2: 14 }),
      React.createElement('line', { x1: 4, y1: 14, x2: 12, y2: 14 }),
      React.createElement('path', { d: 'M4 7 2 11h4L4 7z' }),
      React.createElement('path', { d: 'M12 7l-2 4h4l-2-4z' }),
    ),
  },
  {
    id: 'challenge',
    label: 'challenge',
    icon: React.createElement('svg', iconProps,
      React.createElement('path', { d: 'M9 2L4 9h5l-2 5 6-8h-5l2-4z' }),
    ),
  },
];

export function getPromptById(id: string): Prompt | undefined {
  return PROMPTS.find(p => p.id === id);
}
