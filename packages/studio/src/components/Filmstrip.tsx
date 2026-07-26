import { useStudio } from '../store'
import { Thumb } from './Thumb'
import { sceneSeconds } from '../timing'
import s from './Filmstrip.module.css'

export function Filmstrip() {
  const deck = useStudio((x) => x.deck)
  const selected = useStudio((x) => x.selected)
  const select = useStudio((x) => x.select)
  if (!deck) return <div className={s.strip} />
  const secs = sceneSeconds(deck)

  return (
    <div className={s.strip}>
      <div className={s.header}>Scenes</div>
      <div className={s.list}>
        {deck.scenes.map((scene, i) => (
          <button key={scene.id} type="button" className={i === selected ? `${s.item} ${s.on}` : s.item} onClick={() => select(i)}>
            <span className={s.idx}>{String(i + 1).padStart(2, '0')}</span>
            <div className={s.thumb}>
              <Thumb deck={deck} sceneIndex={i} aspect="9:16" />
            </div>
            <span className={s.meta}>
              {scene.type}
              <br />
              {secs[i]!.toFixed(1)}s
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
