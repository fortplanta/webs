import { Fragment as FragmentType, FragmentSlot } from '../../api/types';
import BodySlot from '../slots/BodySlot';
import TagsSlot from '../slots/TagsSlot';
import ListSlot from '../slots/ListSlot';

const findSlot = (slots: FragmentSlot[], type: FragmentSlot['type']) =>
  slots.find(s => s.type === type);

export default function Timeline({ fragment }: { fragment: FragmentType }) {
  const body = findSlot(fragment.slots, 'body');
  const tags = findSlot(fragment.slots, 'tags');
  const list = findSlot(fragment.slots, 'list');

  return (
    <div className="fragment__body">
      {body && <BodySlot slot={body} />}
      {list && <ListSlot slot={list} />}
      {tags && <TagsSlot slot={tags} />}
    </div>
  );
}
