import { createContext, useContext } from 'react';
import { SlotType } from '../api/types';

export interface FragmentActions {
  fragmentId: string;
  navigateSlotHistory: (slotType: SlotType, direction: 'back' | 'forward') => void;
  openCommandMenu: (slotType: SlotType, x: number, y: number) => void;
}

export const FragmentActionsContext = createContext<FragmentActions | null>(null);

export function useFragmentActions(): FragmentActions | null {
  return useContext(FragmentActionsContext);
}
