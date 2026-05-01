import { Fragment as FragmentType, FragmentSlot } from '../../api/types';

const findSlot = (slots: FragmentSlot[], type: FragmentSlot['type']) =>
  slots.find(s => s.type === type);

export default function QuoteCentered({ fragment }: { fragment: FragmentType }) {
  const body = findSlot(fragment.slots, 'body');
  return (
    <div className="fragment__quote-body">
      {body?.content ?? fragment.title}
    </div>
  );
}
