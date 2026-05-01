import { FragmentSlot } from '../../api/types';

export default function DisclaimerSlot({ slot }: { slot: FragmentSlot }) {
  if (!slot.content) return null;
  return (
    <div className="fragment-slot fragment-slot--disclaimer">
      {slot.content}
    </div>
  );
}
