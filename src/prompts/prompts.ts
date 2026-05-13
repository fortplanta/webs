import { SlotType } from '../api/types';

export interface PromptDefinition {
  id: string;
  label: string;
  description: string;
  icon: string;
  allowedOutputSlots: SlotType[];
}

export const PROMPTS: PromptDefinition[] = [
  {
    id: 'explain-simple',
    label: 'explain simply',
    description: 'rewrite for a five year old',
    icon: '💡',
    allowedOutputSlots: ['body'],
  },
  {
    id: 'visual-learning',
    label: 'visual learning',
    description: 'vivid, sensory explanation',
    icon: '🎨',
    allowedOutputSlots: ['body'],
  },
  {
    id: 'fact-check',
    label: 'fact check',
    description: 'verify claims in this fragment',
    icon: '🔍',
    allowedOutputSlots: ['body', 'disclaimer'],
  },
  {
    id: 'find-similarities',
    label: 'find similarities',
    description: 'what does this connect to',
    icon: '🔗',
    allowedOutputSlots: ['list'],
  },
  {
    id: 'steelman',
    label: 'steelman',
    description: 'strongest case for this idea',
    icon: '⚖️',
    allowedOutputSlots: ['body'],
  },
  {
    id: 'challenge',
    label: 'challenge',
    description: 'what is wrong with this',
    icon: '⚡',
    allowedOutputSlots: ['body', 'list'],
  },
];

export function getPromptById(id: string): PromptDefinition | undefined {
  return PROMPTS.find(p => p.id === id);
}
