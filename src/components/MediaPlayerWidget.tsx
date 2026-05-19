import './MediaPlayerWidget.css';

interface MediaPlayerWidgetProps {
  title: string;
  subtitle?: string;
  artUrl?: string;
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const WAVE_HEIGHTS = [4, 8, 12, 6, 14, 10, 5, 16, 8, 12, 6, 10, 14, 7, 11];

export function MediaPlayerWidget({
  title,
  subtitle,
  artUrl,
  duration,
  currentTime,
  isPlaying,
  onPlay,
  onPause,
  onSeek,
}: MediaPlayerWidgetProps) {
  const progress = duration > 0 ? currentTime / duration : 0;
  const activeWaveBars = Math.round(progress * WAVE_HEIGHTS.length);

  return (
    <div className="mpw">
      {/* Art */}
      {artUrl ? (
        <img src={artUrl} alt="" className="mpw__art" />
      ) : (
        <div className="mpw__art-placeholder" aria-hidden="true">♪</div>
      )}

      {/* Panel */}
      <div className="mpw__panel">
        {/* Top row: title + waveform */}
        <div className="mpw__top">
          <div className="mpw__titles">
            <p className="mpw__title">{title}</p>
            {subtitle && <p className="mpw__subtitle">{subtitle}</p>}
          </div>
          <div className="mpw__waveform" aria-hidden="true">
            {WAVE_HEIGHTS.map((h, i) => (
              <div
                key={i}
                className={['mpw__wave-bar', i < activeWaveBars ? 'mpw__wave-bar--active' : ''].filter(Boolean).join(' ')}
                style={{ height: h }}
              />
            ))}
          </div>
        </div>

        {/* Scrubber */}
        <div className="mpw__scrubber-row">
          <span className="mpw__time">{formatTime(currentTime)}</span>
          <input
            type="range"
            className="mpw__scrubber"
            min={0}
            max={duration}
            step={1}
            value={currentTime}
            aria-label="Seek"
            onChange={e => onSeek(Number(e.target.value))}
          />
          <span className="mpw__time" style={{ textAlign: 'right' }}>{formatTime(duration)}</span>
        </div>

        {/* Controls */}
        <div className="mpw__controls">
          <button className="mpw__ctrl-btn" aria-label="Previous" onClick={() => onSeek(0)}>
            ⏮
          </button>
          <button className="mpw__ctrl-btn" aria-label="Back 10s" onClick={() => onSeek(Math.max(0, currentTime - 10))}>
            ↺
          </button>
          <button
            className="mpw__ctrl-btn mpw__ctrl-btn--play"
            aria-label={isPlaying ? 'Pause' : 'Play'}
            onClick={isPlaying ? onPause : onPlay}
          >
            {isPlaying ? '❚❚' : '▶'}
          </button>
          <button className="mpw__ctrl-btn" aria-label="Forward 10s" onClick={() => onSeek(Math.min(duration, currentTime + 10))}>
            ↻
          </button>
          <button className="mpw__ctrl-btn" aria-label="Next" onClick={() => onSeek(duration)}>
            ⏭
          </button>
        </div>
      </div>
    </div>
  );
}
