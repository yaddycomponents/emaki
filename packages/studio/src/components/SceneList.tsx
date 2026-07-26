import { Plus } from 'lucide-react'
import type { Scene } from '@emaki/schema'
import { useStudio } from '../store'
import { sceneSeconds, totalFrames, FPS } from '../timing'
import s from './SceneList.module.css'

function headline(scene: Scene): string {
  const p = scene.props as Record<string, unknown>
  switch (scene.type) {
    case 'title':
    case 'statement':
    case 'chapter':
      return String(p.title ?? p.text ?? '')
    case 'stat':
      return `${p.value ?? ''} ${p.label ?? ''}`.trim()
    case 'list':
      return String(p.title ?? (p.items as string[])?.[0] ?? 'list')
    case 'compare-bars':
      return String(p.title ?? 'comparison')
    case 'ui-mock':
      return String(p.title ?? p.app ?? 'ui mock')
    default:
      return ''
  }
}

export function SceneList() {
  const deck = useStudio((x) => x.deck)
  const selected = useStudio((x) => x.selected)
  const select = useStudio((x) => x.select)
  const changes = useStudio((x) => x.changes)
  const dismiss = useStudio((x) => x.dismissChanges)

  if (!deck) return <div className={s.panel} />
  const secs = sceneSeconds(deck)
  const totalSec = secs.reduce((a, b) => a + b, 0)
  const changeCount = Object.keys(changes).length

  return (
    <div className={s.panel}>
      <div className={s.header}>
        <span>Scenes</span>
        {changeCount ? (
          <button type="button" className={s.dismiss} onClick={dismiss}>
            {changeCount} updated · dismiss
          </button>
        ) : (
          <button type="button" className={s.add} aria-label="add scene">
            <Plus size={13} />
          </button>
        )}
      </div>
      <div className={s.list}>
        {deck.scenes.map((scene, i) => {
          const change = changes[scene.id]
          const cls = [s.row]
          if (i === selected) cls.push(s.active)
          if (change?.kind === 'new') cls.push(s.rowNew)
          return (
            <button key={scene.id} type="button" className={cls.join(' ')} onClick={() => select(i)}>
              <span className={change?.kind === 'new' ? `${s.index} ${s.indexNew}` : s.index}>
                {change?.kind === 'new' ? '+' : String(i + 1).padStart(2, '0')}
              </span>
              <span className={`${s.vdot} ${s.vok}`} />
              <span className={s.meta}>
                <span className={s.headline}>{headline(scene)}</span>
                <span className={s.typeRow}>
                  <span className={s.type}>{scene.type}</span>
                  {change?.kind === 'updated' ? <span className={s.chipUpdated}>updated</span> : null}
                  {change?.kind === 'new' ? <span className={s.chipNew}>new</span> : null}
                </span>
              </span>
              <span className={s.dur}>{secs[i]!.toFixed(1)}s</span>
            </button>
          )
        })}
      </div>
      <div className={s.footer}>
        <span>{deck.scenes.length} scenes</span>
        <span className={s.footMeta}>
          {totalSec.toFixed(1)}s · {totalFrames(deck)}f @{FPS}
        </span>
      </div>
    </div>
  )
}
