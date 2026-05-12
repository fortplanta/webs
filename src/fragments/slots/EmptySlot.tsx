import { SlotType } from '../../api/types';
import { useFragmentActions } from '../FragmentActionsContext';

interface EmptySlotProps {
  slotType: SlotType;
}

export default function EmptySlot({ slotType }: EmptySlotProps) {
  const actions = useFragmentActions();

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (actions) {
      actions.openCommandMenu(slotType, e.clientX, e.clientY);
    }
  };

  return (
    <div
      className="slot--empty"
      onDoubleClick={handleDoubleClick}
      onMouseDown={e => e.stopPropagation()}
      title={`Double-click to fill ${slotType} slot`}
    >
      <span className="slot--empty__label">{slotType}</span>
    </div>
  );
}
