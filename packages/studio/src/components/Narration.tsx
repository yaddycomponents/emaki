import type { Scene } from '@emaki/schema'
import { useStudio } from '../store'
import { sceneSeconds } from '../timing'
import s from './Narration.module.css'

function script(scene: Scene): string {
  const p = scene.props as Record<string, unknown>
  const parts =
    scene.type === 'stat'
      ? [p.value, p.label, p.caption]
      : scene.type === 'list'
        ? [p.title, ...((p.items as string[]) ?? [])]
        : scene.type === 'compare-bars'
          ? [p.title]
          : [p.kicker, p.number, p.title, p.text]
  return parts.filter(Boolean).join(' ')
}

export function Narration() {
  const deck = useStudio((x) => x.deck)
  const selected = useStudio((x) => x.selected)
  const select = useStudio((x) => x.select)
  if (!deck) return <div className={s.body} />
  const secs = sceneSeconds(deck)

  return (
    <div className={s.body}>
      {deck.scenes.map((scene, i) => {
        const text = script(scene)
        const words = text.trim() ? text.trim().split(/\s+/).length : 0
        const over = words / deck.wordsPerSecond - secs[i]!
        return (
          <button
            key={scene.id}
            type="button"
            className={i === selected ? `${s.row} ${s.active}` : s.row}
            onClick={() => select(i)}
          >
            <span className={s.idx}>{String(i + 1).padStart(2, '0')}</span>
            <span className={s.text}>{text}</span>
            <span className={over > 0.05 ? `${s.meta} ${s.over}` : s.meta}>
              {secs[i]!.toFixed(1)}s · {words} words · {over > 0.05 ? `${over.toFixed(1)}s over` : 'fits'}
            </span>
          </button>
        )
      })}
    </div>
  )
}
