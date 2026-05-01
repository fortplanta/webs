import { Fragment as FragmentType, FragmentSlot } from '../../api/types';
import BodySlot from '../slots/BodySlot';
import TagsSlot from '../slots/TagsSlot';
import DisclaimerSlot from '../slots/DisclaimerSlot';

const findSlot = (slots: FragmentSlot[], type: FragmentSlot['type']) =>
  slots.find(s => s.type === type);

export default function CardSplit({ fragment }: { fragment: FragmentType }) {
  const body = findSlot(fragment.slots, 'body');
  const tags = findSlot(fragment.slots, 'tags');
  const disclaimer = findSlot(fragment.slots, 'disclaimer');

  return (
    <div className="fragment__body">
      {body && <BodySlot slot={body} />}
      {tags && <TagsSlot slot={tags} />}
      {disclaimer && <DisclaimerSlot slot={disclaimer} />}
    </div>
  );
}
