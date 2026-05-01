import { FragmentSlot } from '../../api/types';

export default function ListSlot({ slot }: { slot: FragmentSlot }) {
  if (!slot.items?.length) return null;
  return (
    <div className="fragment-slot fragment-slot--list">
      <ul className="fragment-list">
        {slot.items.map((item, i) => (
          <li key={i} className="fragment-list__item">{item}</li>
        ))}
      </ul>
    </div>
  );
}
