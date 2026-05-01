import { FragmentSlot } from '../../api/types';

export default function BodySlot({ slot }: { slot: FragmentSlot }) {
  if (!slot.content) return null;
  return (
    <div className="fragment-slot fragment-slot--body">
      <p>{slot.content}</p>
    </div>
  );
}
