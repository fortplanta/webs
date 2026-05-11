import { Fragment as FragmentType, FragmentSlot } from '../../api/types';
import ImageSlot from '../slots/ImageSlot';
import BodySlot from '../slots/BodySlot';
import TagsSlot from '../slots/TagsSlot';

const findSlot = (slots: FragmentSlot[], type: FragmentSlot['type']) =>
  slots.find(s => s.type === type);

export default function ImageHero({ fragment }: { fragment: FragmentType }) {
  const image = findSlot(fragment.slots, 'image');
  const body = findSlot(fragment.slots, 'body');
  const tags = findSlot(fragment.slots, 'tags');

  return (
    <div className="fragment__body fragment__body--image-hero">
      {image?.content && <ImageSlot slot={image} />}
      {body && <BodySlot slot={body} />}
      {tags && <TagsSlot slot={tags} />}
    </div>
  );
}
