import { FragmentSlot } from '../../api/types';

export default function ImageSlot({ slot }: { slot: FragmentSlot }) {
  return (
    <div className="fragment-slot fragment-slot--image">
      {slot.content
        ? <img src={slot.content} alt="" />
        : <div className="fragment-slot__image-placeholder" />
      }
    </div>
  );
}
