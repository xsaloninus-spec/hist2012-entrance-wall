import { Camera, Footprints, Pause, Play, RotateCcw } from 'lucide-react'
import type { SceneSnapshot, ViewMode } from '@/types/wall'

interface Props {
  snapshot: SceneSnapshot
  mode: ViewMode
  speed: number
  onPlay: () => void
  onSeek: (time: number) => void
  onSpeed: (speed: number) => void
  onReset: () => void
  onMode: (mode: ViewMode) => void
  onCapture: () => void
}

const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`

export function TourControls({ snapshot, mode, speed, onPlay, onSeek, onSpeed, onReset, onMode, onCapture }: Props) {
  return (
    <div className="tour-controls glass-panel">
      <button className="icon-button primary" onClick={onPlay} title={snapshot.playing ? 'Pause · Space' : 'Play · Space'}>
        {snapshot.playing ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}
      </button>
      <button className="icon-button" onClick={onReset} title="Return to B0 · R"><RotateCcw size={16} /></button>
      <span className="time-code">{formatTime(snapshot.time)}</span>
      <div className="timeline-wrap">
        <input
          aria-label="Tour timeline"
          className="timeline"
          type="range"
          min="0"
          max="90"
          step="0.1"
          value={snapshot.time}
          onChange={event => onSeek(Number(event.target.value))}
          style={{ '--progress': `${snapshot.time / 90 * 100}%` } as React.CSSProperties}
        />
        <div className="timeline-ticks">{[0, 16, 30, 44, 58, 72, 84, 90].map(tick => <i key={tick} style={{ left: `${tick / 90 * 100}%` }} />)}</div>
      </div>
      <span className="time-code muted">1:30</span>
      <select className="speed-select" aria-label="Tour speed" value={speed} onChange={event => onSpeed(Number(event.target.value))}>
        <option value="0.5">0.5×</option><option value="1">1×</option><option value="1.5">1.5×</option><option value="2">2×</option>
      </select>
      <span className="control-divider" />
      <button className={`walk-button ${mode === 'walk' ? 'active' : ''}`} onClick={() => onMode(mode === 'walk' ? 'tour' : 'walk')}>
        <Footprints size={15} />{mode === 'walk' ? 'Exit walk' : 'Free walk'}
      </button>
      <button className="icon-button" onClick={onCapture} title="Save current view"><Camera size={16} /></button>
    </div>
  )
}
