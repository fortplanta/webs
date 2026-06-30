import { useState } from 'react';
import type { Fragment } from '../../api/types';

interface Props {
  fragment: Fragment;
  onAction: (id: string, action: 'summarise' | 'extract-entities') => void;
}

export default function SparkSlot({ fragment, onAction }: Props) {
  const isProcessing = fragment.sparkStatus === 'processing';
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div className="spark-slot">
      {fragment.sparkMediaUrl && !imageFailed && (
        <div className="spark-slot__image-wrap">
          <img
            src={fragment.sparkMediaUrl}
            alt="spark"
            className="spark-slot__image"
            draggable={false}
            onError={() => setImageFailed(true)}
          />
        </div>
      )}
      <div className="spark-slot__actions">
        {isProcessing ? (
          <div className="spark-slot__loading">
            <div className="fragment__pivot-track" />
            <div className="loading-canvas__head" />
          </div>
        ) : (
          <>
            <button
              className="spark-slot__btn"
              onClick={e => { e.stopPropagation(); onAction(fragment.id, 'summarise'); }}
            >
              summarise
            </button>
            <button
              className="spark-slot__btn"
              onClick={e => { e.stopPropagation(); onAction(fragment.id, 'extract-entities'); }}
            >
              extract entities
            </button>
            <button
              className="spark-slot__btn spark-slot__btn--disabled"
              disabled
              title="coming soon"
            >
              ask questions
            </button>
          </>
        )}
      </div>
    </div>
  );
}
