import type { Aspect } from '@emaki/schema'
import { useStudio } from '../store'
import s from './Toolbar.module.css'

const ASPECTS: Aspect[] = ['16:9', '1:1', '9:16']

export function Toolbar() {
  const deck = useStudio((x) => x.deck)
  const playing = useStudio((x) => x.playing)
  const togglePlay = useStudio((x) => x.togglePlay)
  const setAspect = useStudio((x) => x.setAspect)
  const aspect = deck?.aspect ?? '9:16'

  return (
    <header className={s.bar}>
      <div className={s.brand}>
        <span className={s.star}>✳</span> Emaki Studio
      </div>
      <div className={s.title}>{deck?.title ?? 'Untitled'}</div>
      <div className={s.spacer} />
      <div className={s.group}>
        {ASPECTS.map((a) => (
          <button
            key={a}
            type="button"
            className={a === aspect ? `${s.seg} ${s.segOn}` : s.seg}
            onClick={() => setAspect(a)}
          >
            {a}
          </button>
        ))}
      </div>
      <button type="button" className={s.play} onClick={togglePlay}>
        {playing ? '❚❚ Pause' : '▶ Play'}
      </button>
    </header>
  )
}
