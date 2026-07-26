import { SkipBack, SkipForward, ChevronLeft, ChevronRight, Play, Pause, Repeat, Maximize2 } from 'lucide-react'
import { useStudio } from '../store'
import { sceneFrames, timecode } from '../timing'
import s from './Transport.module.css'

export function Transport() {
  const deck = useStudio((x) => x.deck)
  const selected = useStudio((x) => x.selected)
  const playing = useStudio((x) => x.playing)
  const loop = useStudio((x) => x.loop)
  const select = useStudio((x) => x.select)
  const togglePlay = useStudio((x) => x.togglePlay)
  const toggleLoop = useStudio((x) => x.toggleLoop)
  const toggleClean = useStudio((x) => x.toggleClean)

  if (!deck) return <div className={s.bar} />
  const frames = sceneFrames(deck)
  const total = frames.reduce((a, b) => a + b, 0)
  const startFrame = frames.slice(0, selected).reduce((a, b) => a + b, 0)
  const last = deck.scenes.length - 1

  return (
    <div className={s.bar}>
      <div className={s.cluster}>
        <button type="button" className={s.btn} onClick={() => select(0)} aria-label="first">
          <SkipBack size={14} />
        </button>
        <button type="button" className={s.btn} onClick={() => select(Math.max(0, selected - 1))} aria-label="prev">
          <ChevronLeft size={14} />
        </button>
        <button
          type="button"
          className={playing ? `${s.btn} ${s.play} ${s.playOn}` : `${s.btn} ${s.play}`}
          onClick={togglePlay}
          aria-label="play/pause"
        >
          {playing ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <button type="button" className={s.btn} onClick={() => select(Math.min(last, selected + 1))} aria-label="next">
          <ChevronRight size={14} />
        </button>
        <button type="button" className={s.btn} onClick={() => select(last)} aria-label="last">
          <SkipForward size={14} />
        </button>
      </div>

      <div className={s.time}>
        {timecode(startFrame)} <span className={s.timeSep}>/ {timecode(total)}</span>
      </div>

      <div className={s.scrubber}>
        {deck.scenes.map((scene, i) => (
          <button
            key={scene.id}
            type="button"
            className={i === selected ? `${s.seg} ${s.segOn}` : s.seg}
            style={{ flex: frames[i] }}
            onClick={() => select(i)}
          >
            <span className={s.segNum}>{String(i + 1).padStart(2, '0')}</span>
          </button>
        ))}
      </div>

      <button type="button" className={loop ? `${s.toggle} ${s.toggleOn}` : s.toggle} onClick={toggleLoop}>
        <Repeat size={13} /> loop
      </button>
      <button type="button" className={s.toggle} onClick={toggleClean}>
        <Maximize2 size={13} /> clean
      </button>

      <span className={s.hint}>space · ←→ · home/end</span>
    </div>
  )
}
