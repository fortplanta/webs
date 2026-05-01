import { FragmentSlot } from '../../api/types';

export default function TagsSlot({ slot }: { slot: FragmentSlot }) {
  if (!slot.items?.length) return null;
  return (
    <div className="fragment-slot fragment-slot--tags">
      {slot.items.map((tag, i) => (
        <span key={i} className="fragment-tag">{tag}</span>
      ))}
    </div>
  );
}
