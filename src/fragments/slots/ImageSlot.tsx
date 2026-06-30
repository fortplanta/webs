import { useState } from 'react';
import { FragmentSlot } from '../../api/types';

export default function ImageSlot({ slot }: { slot: FragmentSlot }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="fragment-slot fragment-slot--image">
      {slot.content && !failed
        ? <img src={slot.content} alt="" onError={() => setFailed(true)} />
        : <div className="fragment-slot__image-placeholder" />
      }
    </div>
  );
}
