import type { Fragment } from '../../api/types';

interface Props {
  fragment: Fragment;
}

export default function TextNote({ fragment }: Props) {
  return (
    <div className="text-note__content">
      {fragment.title || <span className="text-note__placeholder">Type something…</span>}
    </div>
  );
}
