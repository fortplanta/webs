import { FragmentSlot, SlotType } from '../../api/types';
import { useFragmentActions } from '../FragmentActionsContext';

interface SlotHistoryProps {
  slot: FragmentSlot;
  slotType: SlotType;
}

export default function SlotHistory({ slot, slotType }: SlotHistoryProps) {
  const actions = useFragmentActions();
  if (!actions || !slot.history || slot.history.length === 0) return null;

  const currentIndex = slot.historyIndex ?? slot.history.length;
  const totalVersions = slot.history.length + 1; // history entries + current
  const displayIndex = currentIndex + 1;

  return (
    <div className="slot-history-nav" onMouseDown={e => e.stopPropagation()}>
      <button
        className="slot-history-nav__btn"
        disabled={currentIndex === 0}
        onClick={e => { e.stopPropagation(); actions.navigateSlotHistory(slotType, 'back'); }}
        title="Previous version"
      >
        ‹
      </button>
      <span className="slot-history-nav__count">{displayIndex} / {totalVersions}</span>
      <button
        className="slot-history-nav__btn"
        disabled={currentIndex >= totalVersions - 1}
        onClick={e => { e.stopPropagation(); actions.navigateSlotHistory(slotType, 'forward'); }}
        title="Next version"
      >
        ›
      </button>
    </div>
  );
}
