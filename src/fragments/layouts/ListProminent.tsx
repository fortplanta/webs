import { Fragment as FragmentType, FragmentSlot } from '../../api/types';
import ListSlot from '../slots/ListSlot';
import BodySlot from '../slots/BodySlot';
import TagsSlot from '../slots/TagsSlot';

const findSlot = (slots: FragmentSlot[], type: FragmentSlot['type']) =>
  slots.find(s => s.type === type);

export default function ListProminent({ fragment }: { fragment: FragmentType }) {
  const list = findSlot(fragment.slots, 'list');
  const body = findSlot(fragment.slots, 'body');
  const tags = findSlot(fragment.slots, 'tags');

  return (
    <div className="fragment__body">
      {list && <ListSlot slot={list} />}
      {body && <BodySlot slot={body} />}
      {tags && <TagsSlot slot={tags} />}
    </div>
  );
}
