import { useStudio } from '../store'
import s from './SceneTree.module.css'

/** A one-letter glyph per block type — enough to scan the tree at a glance. */
const GLYPH: Record<string, string> = {
  title: 'T',
  statement: '“',
  stat: '#',
  'compare-bars': '≣',
  chapter: '§',
  list: '☰',
  'ui-mock': '▢',
}

export function SceneTree() {
  const deck = useStudio((x) => x.deck)
  const selected = useStudio((x) => x.selected)
  const select = useStudio((x) => x.select)

  return (
    <div className={s.panel}>
      <div className={s.header}>Scenes</div>
      <div className={s.list}>
        {deck?.scenes.map((scene, i) => (
          <button
            key={scene.id}
            type="button"
            className={i === selected ? `${s.row} ${s.active}` : s.row}
            onClick={() => select(i)}
          >
            <span className={s.index}>{String(i + 1).padStart(2, '0')}</span>
            <span className={s.glyph}>{GLYPH[scene.type] ?? '•'}</span>
            <span className={s.meta}>
              <span className={s.type}>{scene.type}</span>
              <span className={s.id}>{scene.id}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
