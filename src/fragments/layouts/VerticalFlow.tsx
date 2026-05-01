import { Fragment as FragmentType, FragmentSlot } from '../../api/types';
import BodySlot from '../slots/BodySlot';
import TagsSlot from '../slots/TagsSlot';
import ListSlot from '../slots/ListSlot';
import DisclaimerSlot from '../slots/DisclaimerSlot';

const findSlot = (slots: FragmentSlot[], type: FragmentSlot['type']) =>
  slots.find(s => s.type === type);

export default function VerticalFlow({ fragment }: { fragment: FragmentType }) {
  const body = findSlot(fragment.slots, 'body');
  const tags = findSlot(fragment.slots, 'tags');
  const list = findSlot(fragment.slots, 'list');
  const disclaimer = findSlot(fragment.slots, 'disclaimer');

  return (
    <div className="fragment__body">
      {body && <BodySlot slot={body} />}
      {tags && <TagsSlot slot={tags} />}
      {list && <ListSlot slot={list} />}
      {disclaimer && <DisclaimerSlot slot={disclaimer} />}
    </div>
  );
}
