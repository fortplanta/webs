import { FragmentSlot } from '../../api/types';

// Normalize items — the AI occasionally returns a comma-string instead of string[]
function toArray(items: string[] | string | undefined): string[] {
  if (!items) return [];
  if (Array.isArray(items)) return items;
  return String(items).split(',').map(s => s.trim()).filter(Boolean);
}

export default function TagsSlot({ slot }: { slot: FragmentSlot }) {
  const items = toArray(slot.items);
  if (!items.length) return null;
  return (
    <div className="fragment-slot fragment-slot--tags">
      {items.map((tag, i) => (
        <span key={i} className="fragment-tag">{tag}</span>
      ))}
    </div>
  );
}
