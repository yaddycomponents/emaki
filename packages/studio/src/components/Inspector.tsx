import type { Scene } from '@emaki/schema'
import { useStudio } from '../store'
import { sceneSeconds, sceneFrames } from '../timing'
import s from './Inspector.module.css'

const MONO_KEYS = new Set(['language', 'emphasis', 'transition', 'unit', 'number'])

export function Inspector() {
  const deck = useStudio((x) => x.deck)
  const selected = useStudio((x) => x.selected)
  const error = useStudio((x) => x.error)
  const setText = useStudio((x) => x.setText)

  if (!deck) return <div className={s.body} />
  const scene = deck.scenes[selected]
  if (!scene) return <div className={s.body} />

  const dur = sceneSeconds(deck)[selected]!
  const frames = sceneFrames(deck)[selected]!

  const update = (key: string, value: string) => {
    const next = structuredClone(deck)
    ;(next.scenes[selected]!.props as Record<string, unknown>)[key] = value
    setText(JSON.stringify(next, null, 2))
  }

  const entries = Object.entries(scene.props as Record<string, unknown>)

  return (
    <div className={s.body}>
      <div className={s.head}>
        <span className={s.chip}>{String(selected + 1).padStart(2, '0')}</span>
        <span className={s.block}>{scene.type}</span>
        <span className={s.src}>blocks/{scene.type}.tsx</span>
      </div>

      <div className={s.fields}>
        {entries.map(([key, value]) => (
          <label key={key} className={s.field}>
            <span className={s.label}>{key}</span>
            {typeof value === 'string' || typeof value === 'number' ? (
              <input
                className={MONO_KEYS.has(key) ? `${s.control} ${s.mono}` : s.control}
                value={String(value)}
                onChange={(e) => update(key, e.target.value)}
                spellCheck={false}
              />
            ) : (
              <span className={s.readonly}>
                {Array.isArray(value) ? `${value.length} items` : 'object'} · edit in JSON
              </span>
            )}
          </label>
        ))}

        <div className={s.field}>
          <span className={s.label}>duration</span>
          <span className={s.derived}>
            {dur.toFixed(1)}s · {frames}f
          </span>
        </div>
      </div>

      {error ? (
        <div className={s.callout}>
          <span className={s.calloutRef}>deck</span> {error.split('\n')[0]}
        </div>
      ) : null}
    </div>
  )
}
